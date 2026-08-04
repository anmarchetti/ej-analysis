using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Themes;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search;

public class OffersMapperTouristTaxTests
{
    private readonly Mock<IReferenceDataService> _referenceDataServiceMock = new();
    private readonly Mock<IHotelThemeService> _hotelThemeServiceMock = new();
    private readonly OffersMapper _offersMapper;

    public OffersMapperTouristTaxTests()
    {
        _referenceDataServiceMock
            .Setup(x => x.GetDiscountSettings())
            .ReturnsAsync(new DiscountSettings { DiscountThreshold = 1 });
        _referenceDataServiceMock
            .Setup(x => x.GetTransfers())
            .ReturnsAsync(new Dictionary<string, HotelTransfer>());
        _hotelThemeServiceMock
            .Setup(x => x.GetTheme(It.IsAny<string>()))
            .ReturnsAsync((new PackageTheme(), new ThemeType()));

        _offersMapper = new OffersMapper(
            _referenceDataServiceMock.Object,
            _hotelThemeServiceMock.Object,
            Options.Create(new AtcomSettings()),
            new PricesService(Options.Create(new ApiSettings())));
    }

    [Fact]
    public void ExtendedOffer_WhenExcludedTouristTaxPricesAreNotProvided_CalculatesThemFromPayLocalEstAndPayingCustomers()
    {
        var sourceOffer = CreateOffer(
            price: 1000m,
            pricePP: 250m,
            payLocalEst: 90m,
            payLocalEstPP: 5m,
            units: [CreateUnit(adults: 2, children: 1)]);

        var extendedOffer = CreateExtendedOffer(sourceOffer);

        extendedOffer.PriceExcludingTouristTax.Should().Be(910m);
        extendedOffer.PricePPExcludingTouristTax.Should().Be(220m);
        extendedOffer.PayLocalEstPP.Should().Be(30m);
    }

    [Fact]
    public async Task ConvertOffers_WhenPricePPExcludingTouristTaxIsNotProvided_UsesPayingCustomersCount()
    {
        var offer = CreateOffer(
            price: 1000m,
            pricePP: 250m,
            payLocalEst: 90m,
            payLocalEstPP: 30m,
            units: [CreateUnit(adults: 2, children: 1)]);

        var result = await _offersMapper.ConvertOffers([offer], [], CreateMarketSettings());

        result.Should().ContainSingle();
        result[0].TouristTax.Should().Be(90m);
        result[0].TouristTaxPP.Should().Be(30m);
        result[0].PriceExcludingTouristTax.Should().Be(910m);
        result[0].PricePPExcludingTouristTax.Should().Be(220m);
    }

    [Fact]
    public async Task ConvertOffers_WhenThereAreNoPayingCustomers_DoesNotSubtractTouristTaxFromPricePP()
    {
        var offer = CreateOffer(
            price: 1000m,
            pricePP: 250m,
            payLocalEst: 90m,
            payLocalEstPP: 30m,
            units: [CreateUnit(adults: 0, children: 0)]);

        var result = await _offersMapper.ConvertOffers([offer], [], CreateMarketSettings());

        result.Should().ContainSingle();
        result[0].PriceExcludingTouristTax.Should().Be(910m);
        result[0].PricePPExcludingTouristTax.Should().Be(250m);
    }

    [Fact]
    public async Task ConvertOffers_WhenPriceElementsExist_MapsTaxesAndFeesGroupedByLocalCurrencyAndDividedByPayingCustomers()
    {
        var offer = CreateOffer(
            price: 1000m,
            pricePP: 250m,
            payLocalEst: 90m,
            payLocalEstPP: 30m,
            units:
            [
                CreateUnit(
                    adults: 2,
                    children: 0,
                    priceElements:
                    [
                        CreatePriceElement("EUR", pricePP: 10m, quantity: 2, exchangeRate: 0.85m),
                        CreatePriceElement("USD", pricePP: 3m, quantity: 2, exchangeRate: 0.75m)
                    ]),
                CreateUnit(
                    adults: 1,
                    children: 0,
                    priceElements:
                    [
                        CreatePriceElement("EUR", pricePP: 5m, quantity: 1, exchangeRate: 0.85m)
                    ])
            ]);

        var result = await _offersMapper.ConvertOffers([offer], [], CreateMarketSettings());

        result.Should().ContainSingle();
        result[0].TaxesAndFees.Should().NotBeNull();
        result[0].TaxesAndFees.Should().HaveCount(2);
        result[0].TaxesAndFees["EUR"].Should().BeEquivalentTo(new
        {
            TotalLocalPrice = 25m,
            TotalLocalPricePP = 8.33m,
            Currency = "EUR",
            ExchRt = 0.85m
        });
        result[0].TaxesAndFees["USD"].Should().BeEquivalentTo(new
        {
            TotalLocalPrice = 6m,
            TotalLocalPricePP = 2m,
            Currency = "USD",
            ExchRt = 0.75m
        });
    }

    [Fact]
    public void TaxesAndFees_WhenThereAreNoPayingCustomers_UsesOriginalPricePPSumForPerPersonTotal()
    {
        var offer = CreateOffer(
            price: 1000m,
            pricePP: 250m,
            payLocalEst: 90m,
            payLocalEstPP: 30m,
            units:
            [
                CreateUnit(
                    adults: 0,
                    children: 0,
                    priceElements:
                    [
                        CreatePriceElement("EUR", pricePP: 10m, quantity: 2, exchangeRate: 0.85m),
                        CreatePriceElement("EUR", pricePP: 5m, quantity: 1, exchangeRate: 0.85m)
                    ])
            ]);

        var taxesAndFees = offer.TaxesAndFees;

        taxesAndFees.Should().ContainSingle();
        taxesAndFees["EUR"].Should().BeEquivalentTo(new
        {
            TotalLocalPrice = 25m,
            TotalLocalPricePP = 15m,
            Currency = "EUR",
            ExchRt = 0.85m
        });
    }

    [Fact]
    public void TaxesAndFees_WithPayingCustomers_RoundsPerPersonTotalAwayFromZero()
    {
        var offer = CreateOffer(
            price: 1000m,
            pricePP: 500m,
            payLocalEst: 90m,
            payLocalEstPP: 45m,
            units:
            [
                CreateUnit(
                    adults: 2,
                    children: 0,
                    priceElements:
                    [
                        CreatePriceElement("EUR", pricePP: 20.01m, quantity: 1, exchangeRate: 0.85m)
                    ])
            ]);

        var taxesAndFees = offer.TaxesAndFees;

        taxesAndFees.Should().ContainSingle();
        taxesAndFees["EUR"].TotalLocalPrice.Should().Be(20.01m);
        taxesAndFees["EUR"].TotalLocalPricePP.Should().Be(10.01m);
    }

    private static AvCacheResultOffersOffer CreateOffer(
        decimal price,
        decimal pricePP,
        decimal payLocalEst,
        decimal payLocalEstPP,
        AvCacheResultOffersOfferAccomUnit[] units)
    {
        return new AvCacheResultOffersOffer
        {
            Price = price,
            PricePP = pricePP,
            PayLocalEst = payLocalEst,
            PayLocalEstPP = payLocalEstPP,
            Accom =
            [
                new AvCacheResultOffersOfferAccom
                {
                    Code = "HT001",
                    Id = "HT001",
                    AtcomId = "atcom_ht001",
                    Prom = "PROMO",
                    Unit = units
                }
            ]
        };
    }

    private static AvCacheResultOffersOfferAccomUnit CreateUnit(
        byte adults,
        byte children,
        bool hasFreeChildPlace = false,
        AvCacheResultOffersOfferAccomUnitPriceDetailPriceElement[] priceElements = null)
    {
        return new AvCacheResultOffersOfferAccomUnit
        {
            Code = "DBL",
            Name = "Double Room",
            AtcomId = "room1",
            DcSpecified = hasFreeChildPlace,
            Dc = hasFreeChildPlace ? YesNo.Y : YesNo.N,
            Occ = new AvCacheResultOffersOfferAccomUnitOcc
            {
                Ad = adults,
                Ch = children
            },
            PriceDetail = priceElements is null
                ? null
                : new AvCacheResultOffersOfferAccomUnitPriceDetail
                {
                    PriceElement = priceElements
                }
        };
    }

    private static AvCacheResultOffersOfferAccomUnitPriceDetailPriceElement CreatePriceElement(
        string currency,
        decimal pricePP,
        uint quantity,
        decimal exchangeRate)
    {
        return new AvCacheResultOffersOfferAccomUnitPriceDetailPriceElement
        {
            PriceCur = currency,
            PricePP = pricePP,
            Qty = quantity,
            ExchRt = exchangeRate
        };
    }

    private static AvCacheResultOffersOfferExtended CreateExtendedOffer(AvCacheResultOffersOffer sourceOffer)
    {
        return new AvCacheResultOffersOfferExtended(
            sourceOffer,
            sourceOffer.Accom.Select(accom => new AvCacheResultOffersOfferAccomExtended(accom)));
    }

    private static MarketSettings CreateMarketSettings()
    {
        return new MarketSettings
        {
            Currency = new Currency { Code = "GBP" }
        };
    }
}

