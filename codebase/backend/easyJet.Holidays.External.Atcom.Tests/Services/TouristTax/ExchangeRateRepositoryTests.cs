using easyJet.Holidays.External.Atcom.Services.TouristTax;
using easyJet.Holidays.Api.Domain.Interfaces.FileService;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Services.TouristTax;

public class ExchangeRateRepositoryTests
{
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

    private static TouristTaxRepository CreateSut(Mock<IS3FileService> s3Mock = null, ICacheService cache = null)
    {
        s3Mock ??= new Mock<IS3FileService>(MockBehavior.Strict);
        cache ??= new NoCacheService();

        // Return CSV bytes for Exchange Rates
        var candidate1 = Path.Combine(AppContext.BaseDirectory, "Services", "TouristTax", "Exchange Rates.csv");
        var candidate2 = Path.Combine(AppContext.BaseDirectory, "Exchange Rates.csv");
        var filePath = File.Exists(candidate1) ? candidate1 : candidate2;
        var bytes = File.ReadAllBytes(filePath);
        s3Mock.Setup(x => x.Download(It.IsAny<string>(), It.Is<string>(f => f == "Exchange Rates.csv")))
              .ReturnsAsync(bytes);

        return new TouristTaxRepository(s3Mock.Object, cache, CreateCacheSettings(), CreateAwsSettings());
    }

    [Fact]
    public async Task GetExchangeRates_ReturnsRecords()
    {
        var sut = CreateSut();
        var rates = await sut.GetExchangeRates();
        rates.Should().NotBeNull();
        rates.Should().ContainSingle();
        rates[0].UserCurrency.Should().Be("GBP");
        rates[0].HotelCurrency.Should().Be("EUR");
        rates[0].ExchangeRate.Should().Be(1.15m);
    }
}
