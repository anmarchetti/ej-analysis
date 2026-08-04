using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Extensions;

public class AvCacheResultOffersOfferExtendedHelpersTests
{
    [Fact]
    public void GetPayLocalEst_ShouldReturnZero_WhenPayLocalEstAndPayLocalAreZero()
    {
        var offer = new AvCacheResultOffersOffer
        {
            PayLocalEst = 0,
            PayLocal = 0
        };

        var result = AvCacheResultOffersOfferExtendedHelpers.GetPayLocalEst(offer);

        result.Should().Be(0);
    }

    [Fact]
    public void GetPayLocalEst_ShouldReturnPayLocal_WhenPayLocalEstIsZeroAndPayLocalIsPositive()
    {
        var offer = new AvCacheResultOffersOffer
        {
            PayLocalEst = 0,
            PayLocal = 25.5m
        };

        var result = AvCacheResultOffersOfferExtendedHelpers.GetPayLocalEst(offer);

        result.Should().Be(25.5m);
    }

    [Fact]
    public void GetPayLocalEst_ShouldReturnPayLocalEst_WhenPayLocalIsZeroAndPayLocalEstIsPositive()
    {
        var offer = new AvCacheResultOffersOffer
        {
            PayLocalEst = 11.25m,
            PayLocal = 0
        };

        var result = AvCacheResultOffersOfferExtendedHelpers.GetPayLocalEst(offer);

        result.Should().Be(11.25m);
    }

    [Fact]
    public void GetPayLocalEst_ShouldReturnZero_WhenNeitherConditionMatches()
    {
        var offer = new AvCacheResultOffersOffer
        {
            PayLocalEst = 3m,
            PayLocal = 2m
        };

        var result = AvCacheResultOffersOfferExtendedHelpers.GetPayLocalEst(offer);

        result.Should().Be(0);
    }

    [Fact]
    public void GetPayLocalEstPP_ShouldReturnZero_WhenAccomIsNull()
    {
        var offer = new AvCacheResultOffersOffer
        {
            Accom = null
        };

        var result = AvCacheResultOffersOfferExtendedHelpers.GetPayLocalEstPP(offer);

        result.Should().Be(0);
    }

    [Fact]
    public void GetPayLocalEstPP_ShouldReturnZero_WhenAccomIsEmpty()
    {
        var offer = new AvCacheResultOffersOffer
        {
            Accom = []
        };

        var result = AvCacheResultOffersOfferExtendedHelpers.GetPayLocalEstPP(offer);

        result.Should().Be(0);
    }

    [Fact]
    public void GetPayLocalEstPP_ShouldSumConvPricePP_FromValidPriceElementsOnly()
    {
        var offer = new AvCacheResultOffersOffer
        {
            Accom =
            [
                new AvCacheResultOffersOfferAccom
                {
                    Unit = null
                },
                new AvCacheResultOffersOfferAccom
                {
                    Unit =
                    [
                        new AvCacheResultOffersOfferAccomUnit
                        {
                            PriceDetail = null
                        },
                        new AvCacheResultOffersOfferAccomUnit
                        {
                            PriceDetail = new AvCacheResultOffersOfferAccomUnitPriceDetail
                            {
                                PriceElement =
                                [
                                    new AvCacheResultOffersOfferAccomUnitPriceDetailPriceElement { ConvPricePP = 12.5m },
                                    new AvCacheResultOffersOfferAccomUnitPriceDetailPriceElement { ConvPricePP = 7.5m }
                                ]
                            }
                        }
                    ]
                }
            ]
        };

        var result = AvCacheResultOffersOfferExtendedHelpers.GetPayLocalEstPP(offer);

        result.Should().Be(20m);
    }

    [Fact]
    public void GetPriceExcludingTouristTax_ShouldSubtractPayLocalEstFromPrice()
    {
        var offer = new AvCacheResultOffersOffer
        {
            Price = 100m,
            PayLocalEst = 0,
            PayLocal = 10m
        };

        var result = AvCacheResultOffersOfferExtendedHelpers.GetPriceExcludingTouristTax(offer);

        result.Should().Be(90m);
    }

    [Fact]
    public void GetPricePPExcludingTouristTax_ShouldSubtractPayLocalEstPPFromPricePP()
    {
        var offer = CreateOffer(
            price: 1000m,
            pricePP: 250m,
            payLocalEst: 90m,
            payLocalEstPP: 5m,
            units: [CreateUnit(adults: 2, children: 1)]);

        var result = AvCacheResultOffersOfferExtendedHelpers.GetPricePPExcludingTouristTax(offer);

        result.Should().Be(220m); // 250 - (90 / 3)
    }

    [Fact]
    public void PayingCustomersCount_ReturnsAdultsAndChildrenExcludingFreeChildPlaces()
    {
        var offer = new AvCacheResultOffersOffer
        {
            Accom =
            [
                new AvCacheResultOffersOfferAccom
                {
                    Unit =
                    [
                        CreateUnit(adults: 2, children: 2),
                        CreateUnit(adults: 1, children: 1, hasFreeChildPlace: true)
                    ]
                }
            ]
        };

        AvCacheResultOffersOfferExtendedHelpers.PayingCustomersCount(offer).Should().Be(5);
    }

    [Fact]
    public void GetPricePPExcludingTouristTax_WithPayingCustomers_DividesTotalTouristTaxByPayingCustomers()
    {
        var offer = CreateOffer(
            price: 1000m,
            pricePP: 250m,
            payLocalEst: 90m,
            payLocalEstPP: 5m,
            units: [CreateUnit(adults: 2, children: 1)]);

        AvCacheResultOffersOfferExtendedHelpers.GetPricePPExcludingTouristTax(offer).Should().Be(220m);
    }

    [Fact]
    public void GetPricePPExcludingTouristTax_WithoutPayingCustomers_ReturnsPricePP()
    {
        var offer = CreateOffer(
            price: 1000m,
            pricePP: 250m,
            payLocalEst: 90m,
            payLocalEstPP: 30m,
            units: [CreateUnit(adults: 0, children: 0)]);

        AvCacheResultOffersOfferExtendedHelpers.GetPricePPExcludingTouristTax(offer).Should().Be(250m);
    }

    [Fact]
    public void GetPayLocalEstPP_WithPayingCustomers_DividesTotalTouristTaxByPayingCustomers()
    {
        var offer = CreateOffer(
            price: 1000m,
            pricePP: 250m,
            payLocalEst: 90m,
            payLocalEstPP: 5m,
            units: [CreateUnit(adults: 2, children: 1)]);

        AvCacheResultOffersOfferExtendedHelpers.GetPayLocalEstPP(offer).Should().Be(30m);
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
}