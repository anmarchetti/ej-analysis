using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search;

public class SearchAvailablePackagesFilterAndMapperTests
{
    private readonly SearchAvailablePackagesFilterAndMapper _sut;

    public SearchAvailablePackagesFilterAndMapperTests()
    {
        var fixture = MapperTestsHelper.PrepareMapperFixture();
        _sut = fixture.Create<SearchAvailablePackagesFilterAndMapper>();
    }

    [Theory]
    [MemberData(nameof(CalculateUpsell_TestData))]
    public async Task CalculateUpsell(AvCacheResultOffersOfferExtended[] offers, 
        PackagesSearchRequest searchRequest, decimal? expectedResult)
    {
        // Act
        var result = await _sut.MapWithFilters(offers.ToList(), searchRequest, false, true, false);

        // Assert
        result.SearchOffersResponse.Status.Upsell.Should().Be(expectedResult);
    }

    public static TheoryData<AvCacheResultOffersOfferExtended[], PackagesSearchRequest, decimal?> CalculateUpsell_TestData()
    {
        var testCases = new TheoryData<AvCacheResultOffersOfferExtended[], PackagesSearchRequest, decimal?>
        {
            {
                [ CreateOffer(1020), CreateOffer(1100), CreateOffer(1140), CreateOffer(1270) ],
                new PackagesSearchRequest { UpsellFrom = 1100, UpsellTo = 1300 },
                40
            },
            {
                [ CreateOffer(1000), CreateOffer(1100), CreateOffer(1210), CreateOffer(1220) ],
                new PackagesSearchRequest { UpsellFrom = 1100, UpsellTo = 1200 },
                null
            },
            {
                [ CreateOffer(1000), CreateOffer(1100), CreateOffer(1200), CreateOffer(1300) ],
                new PackagesSearchRequest { UpsellFrom = 1100, UpsellTo = null },
                null
            },
            {
                [ CreateOffer(1000), CreateOffer(1100), CreateOffer(1200), CreateOffer(1300) ],
                new PackagesSearchRequest { UpsellFrom = null, UpsellTo = 1400 },
                null
            },
            {
                [ CreateOffer(1000), CreateOffer(1100), CreateOffer(1200), CreateOffer(1300) ],
                new PackagesSearchRequest { UpsellFrom = null, UpsellTo = null },
                null
            },
        };

        return testCases;
    }

    [Fact]
    public void Map_LivePriceSummary_MapsTouristTaxFields()
    {
        // Arrange
        var touristTaxCurrency = new Currency { Code = "EUR" };
        var livePrice = new LivePriceSummaryModel
        {
            AccomCode = "AC1",
            Geog = "GEO1",
            PackageId = "PKG1",
            Price = 100,
            PricePP = 50,
            TouristTax = 7,
            SearchCriteria = new SearchCriteria
            {
                Duration = 7,
                Date = DateTimeOffset.UtcNow,
                Adults = 2,
                Children = 1
            }
        };

        var settings = new ComplimentaryLuggageSettings
        {
            DefaultMarketPart = "EU",
            DefaultPromoPart = "BO",
            MarketPromoCodeMapping = new Dictionary<string, string> { { "UK", "EU" } },
            ThemePromoCodeMapping = new Dictionary<string, string> { { "B", "BO" } }
        };

        // Act
        var result = SearchAvailablePackagesFilterAndMapper.Map([livePrice], settings);

        // Assert
        var offer = result.Should().ContainSingle().Subject;
        offer.TouristTax.Should().Be(livePrice.TouristTax);
    }

    private static AvCacheResultOffersOfferExtended CreateOffer(decimal price)
    {
        return new AvCacheResultOffersOfferExtended
            (
                new AvCacheResultOffersOffer()
                {
                    Price = price,
                },
                [ new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom()) ]
            );
    }
}
