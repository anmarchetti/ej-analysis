using AutoFixture;
using easyJet.Holidays.Api.Domain.Interfaces.FileService;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Services.TouristTax;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using System.Text;
using Xunit;
using System.IO;
using System;
using System.Linq;
using System.Globalization;

namespace easyJet.Holidays.External.Atcom.Tests.Services.TouristTax;

public class TouristTaxRepositoryTests
{
    private static string FileName = "Tourist Tax Rules.csv";
    private static IOptions<CacheSettings> CreateCacheSettings()
    {
        var cacheSettings = new CacheSettings
        {
            ExpirationSeconds = new Dictionary<string, int>
            {
                { "TouristTaxRulesBucket", 600 }
            },
            Buckets = new Buckets
            {
                TouristTaxRules = "TouristTaxRulesBucket"
            }
        };
        return Options.Create(cacheSettings);
    }

    private static IOptions<AwsSettings> CreateAwsSettings()
    {
        var aws = new AwsSettings
        {
            S3 = new AwsSettingsS3
            {
                Buckets = new AwsSettingsS3Buckets
                {
                    TouristTaxRules = "s3-ttr-bucket"
                }
            }
        };
        return Options.Create(aws);
    }

    private static byte[] LoadCsvFromDisk()
    {
        // The test project's .csproj copies Services/TouristTax/rules.csv to the output directory
        var path = Path.Combine(AppContext.BaseDirectory, "Services", "TouristTax", FileName);
        if (!File.Exists(path))
        {
            // Fallback: work back to project root from bin folder if running in a non-standard environment
            var fallback = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "Services", "TouristTax", FileName));
            if (File.Exists(fallback))
            {
                path = fallback;
            }
        }
        if (!File.Exists(path))
        {
            throw new FileNotFoundException($"Tourist tax rules CSV not found. Checked: '{path}'.");
        }
        return File.ReadAllBytes(path);
    }

    private static TouristTaxRepository CreateSut(Mock<IS3FileService> s3Mock = null, ICacheService cache = null)
    {
        s3Mock ??= new Mock<IS3FileService>(MockBehavior.Strict);
        cache ??= new NoCacheService();

        // Return CSV bytes for any bucket and file key
        s3Mock.Setup(x => x.Download(It.IsAny<string>(), It.Is<string>(f => f == FileName)))
              .ReturnsAsync(LoadCsvFromDisk());

        return new TouristTaxRepository(s3Mock.Object, cache, CreateCacheSettings(), CreateAwsSettings());
    }

    private static TouristTaxOffer BuildOffer(string geography, DateTime? from = null, int duration = 5)
    {
        var start = DateOnly.FromDateTime((from ?? new DateTime(2026, 02, 15)).Date);
        return new TouristTaxOffer(
            Guid.NewGuid().ToString("N"),
            geography,
            duration,
            0m,
            start,
            start.AddDays(duration),
            3,
            1,
            Array.AsReadOnly(new[] { new AdultPax() }),
            Array.AsReadOnly(Array.Empty<ChildPax>())
        );
    }


    [Fact]
    public async Task GetConfig_UsesCountryFallback_WhenNoResortOrRegionMatch_ReturnsRoomBased()
    {
        // Arrange
        var sut = CreateSut();
        var offer = BuildOffer("GR");

        // Act
        var cfg = (await sut.GetConfig(offer)).First();

        // Assert
        cfg.ApplicationType.Should().Be("RoomBased");
    }
    
    [Fact]
    public async Task GetConfig_ReturnsPercentageBased_WhenRegionMatches()
    {
        // Arrange
        var sut = CreateSut();
        var offer = BuildOffer("ITFU");

        // Act
        var cfg = (await sut.GetConfig(offer)).First();

        // Assert
        cfg.ApplicationType.Should().Be("PercentageBased");
    }
   
    [Fact]
    public async Task GetConfig_ReturnsPaxFlatBased_WhenResortMatches()
    {
        // Arrange
        var sut = CreateSut();
        var offer = BuildOffer("ESFU13");

        // Act
        var cfg = (await sut.GetConfig(offer)).First();

        // Assert
        cfg.ApplicationType.Should().Be("PaxBased");
    }

    [Fact]
    public async Task GetConfig_ReturnsEmpty_WhenNoMatch()
    {
        // Arrange
        var sut = CreateSut();
        var offer = BuildOffer("xXXXXX");

        // Act
        var cfg = await sut.GetConfig(offer);

        // Assert
        cfg.Should().BeEmpty();
    }

    [Fact]
    public async Task GetConfig_MultipleRulesForSameGeography_PicksLatestTravelToDate()
    {
        // Arrange: DEGE has multiple rows in CSV
        var sut = CreateSut();
        var offer = BuildOffer("DEGE", new DateTime(2026, 06, 01), 5);

        // Act
        var cfg = (await sut.GetConfig(offer)).First();

        // Assert
        cfg.ApplicationType.Should().Be("PaxBased");
        // All DEGE rows have TravelToDate 30/6/2026 per sample; ensure rule exists
        cfg.TravelToDate.Should().Be(DateOnly.ParseExact("30/6/2026", new[] { "d/M/yyyy", "dd/M/yyyy", "d/MM/yyyy", "dd/MM/yyyy" }, CultureInfo.GetCultureInfo("en-GB"), DateTimeStyles.None));
    }

    [Fact]
    public async Task GetConfig_MultipleRulesForSameGeography_PicksFirstMatchingWhenDatesEqual()
    {
        // Arrange: DEGE has several entries; when ordered by TravelToDate desc equal, expect first in file
        var sut = CreateSut();
        var offer = BuildOffer("DEGE", new DateTime(2026, 02, 15), 5);

        // Act
        var cfg = (await sut.GetConfig(offer)).First();

        // Assert
        cfg.ApplicationType.Should().Be("PaxBased");
        // The first DEGE row in CSV has MaximumValueCap 999; verify it's selected
        cfg.MaximumValueCap.Should().Be(999m);
    }

    [Fact]
    public async Task GetExchangeRates_LoadsRates_FromCsv()
    {
        // Arrange
        var s3 = new Mock<IS3FileService>(MockBehavior.Strict);
        var cache = new NoCacheService();
        var aws = CreateAwsSettings();
        var cacheSettings = CreateCacheSettings();

        // Wire S3 to return the embedded Exchange Rates.csv
        var exchangeBytes = File.ReadAllBytes(Path.Combine(AppContext.BaseDirectory, "Services", "TouristTax", "Exchange Rates.csv"));
        s3.Setup(x => x.Download(aws.Value.S3.Buckets.TouristTaxRules, It.Is<string>(f => f == "Exchange Rates.csv")))
          .ReturnsAsync(exchangeBytes);

        var sut = new TouristTaxRepository(s3.Object, cache, cacheSettings, aws);

        // Act
        var rates = await sut.GetExchangeRates();

        // Assert
        rates.Should().NotBeNull();
        rates.Should().NotBeEmpty();
        rates.All(r => !string.IsNullOrWhiteSpace(r.UserCurrency)).Should().BeTrue();
        rates.All(r => !string.IsNullOrWhiteSpace(r.HotelCurrency)).Should().BeTrue();
    }

    [Fact]
    public async Task GetConfig_SupportsVariousDateFormats_InCsv()
    {
        // Arrange
        var sut = CreateSut();
        // Offer spanning a week to hit rules with different date formats in CSV
        var offer = BuildOffer("ITFU", new DateTime(2026, 02, 01), 7);

        // Act
        var cfg = (await sut.GetConfig(offer)).FirstOrDefault();

        // Assert
        cfg.Should().NotBeNull();
        cfg!.TravelFromDate.Should().BeOnOrBefore(offer.TravelFromDate);
        cfg.TravelToDate.Should().BeOnOrAfter(offer.TravelToDate);
    }
}

