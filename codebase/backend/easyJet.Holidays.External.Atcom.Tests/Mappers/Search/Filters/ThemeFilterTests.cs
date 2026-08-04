using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Themes;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search.Filters;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search.Filters;

public class ThemeFilterTests
{
    private readonly Mock<IReferenceDataService> _referenceDataService = new();
    private readonly ThemeFilter _sut;

    public ThemeFilterTests()
    {
        var options = Options.Create(new AtcomSettings());
        _sut = new ThemeFilter(options, _referenceDataService.Object);
    }

    [Fact]
    public async Task GetOptions_maps_theme_and_type_tracking_ids_and_counts()
    {
        // Prom substring (2,2) must match theme / type codes — see HotelThemeService.CompareThemeCode
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOfferWithProm("00BEAA"),
            CreateOfferWithProm("00BECC"),
        };

        var themes = new List<PackageTheme>
        {
            new()
            {
                Code = "BE",
                Name = "Beach",
                TrackingId = "theme-beach-en",
                Icon = "beach.svg",
                Types =
                [
                    new ThemeType
                    {
                        Code = "B",
                        Name = "Beach broad",
                        TrackingId = "type-b-en",
                        Icon = "b.svg",
                    },
                    new ThemeType
                    {
                        Code = "BE",
                        Name = "Beach exact",
                        TrackingId = "type-be-en",
                        Icon = "be.svg",
                    },
                ],
            },
        };

        _referenceDataService.Setup(x => x.GetAllThemes()).ReturnsAsync(themes);

        ApplyAllFiltersFunc passthrough = (set, _) => Task.FromResult(set);

        var result = await _sut.GetOptions(offers, new PackagesSearchRequest(), passthrough);

        result.Options.Should().ContainSingle();
        var beach = result.Options.Single();
        beach.Code.Should().Be("BE");
        beach.Name.Should().Be("Beach");
        beach.TrackingId.Should().Be("theme-beach-en");
        beach.Icon.Should().Be("beach.svg");
        beach.Count.Should().Be(2);
        beach.Children.Should().HaveCount(2);

        var broad = beach.Children!.Single(c => c.Code == "B");
        broad.TrackingId.Should().Be("type-b-en");
        broad.Icon.Should().Be("b.svg");
        broad.Count.Should().Be(2);

        var exact = beach.Children.Single(c => c.Code == "BE");
        exact.TrackingId.Should().Be("type-be-en");
        exact.Icon.Should().Be("be.svg");
        exact.Count.Should().Be(2);
    }

    [Fact]
    public async Task GetOptions_omits_theme_types_listed_in_HideOnFilters()
    {
        var atcomSettings = Options.Create(new AtcomSettings
        {
            Themes = new ThemeSettings { HideOnFilters = ["B"] },
        });
        var sut = new ThemeFilter(atcomSettings, _referenceDataService.Object);

        var offers = new List<AvCacheResultOffersOfferExtended> { CreateOfferWithProm("00BEAA") };

        var themes = new List<PackageTheme>
        {
            new()
            {
                Code = "BE",
                Name = "Beach",
                TrackingId = "theme-beach-en",
                Types =
                [
                    new ThemeType { Code = "B", Name = "Beach broad", TrackingId = "type-b-en" },
                    new ThemeType { Code = "BE", Name = "Beach exact", TrackingId = "type-be-en", Icon = "be.svg" },
                ],
            },
        };

        _referenceDataService.Setup(x => x.GetAllThemes()).ReturnsAsync(themes);

        ApplyAllFiltersFunc passthrough = (set, _) => Task.FromResult(set);

        var result = await sut.GetOptions(offers, new PackagesSearchRequest(), passthrough);

        var beach = result.Options.Should().ContainSingle().Subject;
        beach.Children.Should().ContainSingle();
        beach.Children![0].Code.Should().Be("BE");
        beach.Children[0].TrackingId.Should().Be("type-be-en");
        beach.Children[0].Icon.Should().Be("be.svg");
    }

    private static AvCacheResultOffersOfferExtended CreateOfferWithProm(string prom)
    {
        var accomBase = new AvCacheResultOffersOfferAccom { Prom = prom };
        var accom = new AvCacheResultOffersOfferAccomExtended(accomBase);
        return new AvCacheResultOffersOfferExtended(new AvCacheResultOffersOffer(), new[] { accom });
    }
}