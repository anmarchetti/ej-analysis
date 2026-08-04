using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Mappers.Search.Filters;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search.Filters
{
    public class DiscountFilterTests
    {

        [Theory]
        [MemberData(nameof(FilterByDiscountData))]
        public async Task FilterByDiscount(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request,
            List<AvCacheResultOffersOfferExtended> result, string because)
        {
            // Arrange
            var refDataMock = new Mock<IReferenceDataService>();
            refDataMock.Setup(x => x.GetDiscountSettings()).ReturnsAsync(new DiscountSettings() { DiscountThreshold = 1 });
            DiscountFilter filter = new DiscountFilter(refDataMock.Object);

            // Act
            var expected = await filter.FilterBy(offers, request);

            // Assert
            result.Should().BeEquivalentTo(expected, because);
        }

        public static IEnumerable<object[]> FilterByDiscountData()
        {
            yield return new object[] {
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(100, 0) },
                new PackagesSearchRequest() {
                    MinDisc = 0,
                    MinDiscP = 0,
                },
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(100, 0) },
                "No discount on offer and no discount filter"
            };

            yield return new object[] {
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(100, 0) },
                new PackagesSearchRequest() {
                    MinDisc = 10,
                    MinDiscP = 0,
                },
                new List<AvCacheResultOffersOfferExtended>(),
                "No discount on offer and has discount filter"
            };

            yield return new object[] {
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(100, 30) },
                new PackagesSearchRequest() {
                    MinDisc = 20,
                    MinDiscP = 0,
                },
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(100, 30) },
                "Offer has discount and request has filter by discount ammount"
            };

            yield return new object[] {
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(100, 10) },
                new PackagesSearchRequest() {
                    MinDiscP = 20
                },
                new List<AvCacheResultOffersOfferExtended>(),
                "Offer has discount but discount is too small(%)"
            };

            yield return new object[] {
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(100, 30) },
                new PackagesSearchRequest() {
                    MinDiscP = 20
                },
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(100, 30) },
                "Offer has discount and request has filter by discount(%)"
            };

            yield return new object[] {
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(100, 40) },
                new PackagesSearchRequest() {
                    MinDiscP = 20,
                    MaxDiscP = 25
                },
                new List<AvCacheResultOffersOfferExtended>(),
                "Discount percentage calculated correctly as disc / (price + disc) and no offers fit it"
            };

            yield return new object[] {
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(100, 20) },
                new PackagesSearchRequest() {
                    MinDiscP = 20,
                    MinDisc = 30,
                },
                new List<AvCacheResultOffersOfferExtended>(),
                "Request has multiple filters"
            };

            yield return new object[] {
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(100, 40) },
                new PackagesSearchRequest() {
                    MinDiscP = 20,
                    MinDisc = 30,
                    MaxDisc = 100,
                    MaxDiscP = 50,
                },
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(100, 40) },
                "Request has multiple filters"
            };

            yield return new object[] {
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(1000, 1200) },
                new PackagesSearchRequest() { },
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(1000, 1200) },
                "Request has discount higher than current price, but that is still a valid offer"
            };

            yield return new object[] {
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(1000, 1200) },
                new PackagesSearchRequest() {
                     MinDiscP = 54,
                     MaxDiscP = 55,
                },
                new List<AvCacheResultOffersOfferExtended> { CreateOffer(1000, 1200) },
                "Discount percentage calculated correctly as disc / (price + disc) and there is offer that fits it"
            };
        }

        private static AvCacheResultOffersOfferExtended CreateOffer(decimal price, decimal discount)
        {
            return new AvCacheResultOffersOfferExtended(
                        new AvCacheResultOffersOffer()
                        {
                            Price = price,
                        },
                        new List<AvCacheResultOffersOfferAccomExtended>()
                        {
                            new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom()
                            {
                                Unit = new AvCacheResultOffersOfferAccomUnit[1]{ new AvCacheResultOffersOfferAccomUnit() { Disc = discount } }
                            })
                        });
        }
    }
}
