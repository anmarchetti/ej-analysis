using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Mappers.Search.Filters;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search.Filters
{
    public class RequestedPriceFilterTests
    {
        [Theory]
        [MemberData(nameof(FilterBySitecorePriceData))]
        public async Task FilterBySitecorePrice(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request,
            List<AvCacheResultOffersOfferExtended> result, string because)
        {
            RequestedPriceFilter filter = new RequestedPriceFilter();
            var expected = await filter.FilterBy(offers, request);
            result.Should().BeEquivalentTo(expected, because);
        }

        public static IEnumerable<object[]> FilterBySitecorePriceData()
        {
            yield return new object[]
            {
                new List<AvCacheResultOffersOfferExtended>() {
                    new AvCacheResultOffersOfferExtended(
                        new AvCacheResultOffersOffer(){
                            Price = 801,
                            PricePP = 267
                        },
                        new List<AvCacheResultOffersOfferAccomExtended>(){
                            new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom())
                        }),
                    new AvCacheResultOffersOfferExtended(
                        new AvCacheResultOffersOffer(){
                            Price = 798,
                            PricePP = 266
                        },
                        new List<AvCacheResultOffersOfferAccomExtended>(){
                            new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom())
                        })
                },
                new PackagesSearchRequest() {
                    InitialPricePPFrom = 200,
                    InitialPricePPTo = 500,
                    InitialTotalPriceFrom = null,
                    InitialTotalPriceTo = 800
                },
                new List<AvCacheResultOffersOfferExtended>() {
                    new AvCacheResultOffersOfferExtended(
                        new AvCacheResultOffersOffer(){
                            Price = 798,
                            PricePP = 266
                        },
                        new List<AvCacheResultOffersOfferAccomExtended>(){
                            new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom())
                        })
                },
                "Some offers were excluded from result set"
            };

            yield return new object[]
            {
                new List<AvCacheResultOffersOfferExtended>() {
                    new AvCacheResultOffersOfferExtended(
                        new AvCacheResultOffersOffer(){
                            Price = 801,
                            PricePP = 267
                        },
                        new List<AvCacheResultOffersOfferAccomExtended>(){
                            new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom())
                        }),
                    new AvCacheResultOffersOfferExtended(
                        new AvCacheResultOffersOffer(){
                            Price = 798,
                            PricePP = 266
                        },
                        new List<AvCacheResultOffersOfferAccomExtended>(){
                            new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom())
                        })
                },
                new PackagesSearchRequest() {
                    InitialPricePPFrom = 400,
                    InitialPricePPTo = 500,
                    InitialTotalPriceFrom = 500,
                    InitialTotalPriceTo = 800
                },
                new List<AvCacheResultOffersOfferExtended>(),
                "Return empty result set"
            };

            yield return new object[]
            {
                new List<AvCacheResultOffersOfferExtended>() {
                    new AvCacheResultOffersOfferExtended(
                        new AvCacheResultOffersOffer(){
                            Price = 800,
                            PricePP = 267
                        },
                        new List<AvCacheResultOffersOfferAccomExtended>(){
                            new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom())
                        }),
                    new AvCacheResultOffersOfferExtended(
                        new AvCacheResultOffersOffer(){
                            Price = 798,
                            PricePP = 266
                        },
                        new List<AvCacheResultOffersOfferAccomExtended>(){
                            new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom())
                        })
                },
                new PackagesSearchRequest() {
                    InitialPricePPFrom = 200,
                    InitialPricePPTo = 500,
                    InitialTotalPriceFrom = null,
                    InitialTotalPriceTo = 800
                },
                new List<AvCacheResultOffersOfferExtended>() {
                    new AvCacheResultOffersOfferExtended(
                        new AvCacheResultOffersOffer(){
                            Price = 800,
                            PricePP = 267
                        },
                        new List<AvCacheResultOffersOfferAccomExtended>(){
                            new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom())
                        }),
                    new AvCacheResultOffersOfferExtended(
                        new AvCacheResultOffersOffer(){
                            Price = 798,
                            PricePP = 266
                        },
                        new List<AvCacheResultOffersOfferAccomExtended>(){
                            new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom())
                        })
                },
                "Return original set of offers"
            };
        }
    }
}
