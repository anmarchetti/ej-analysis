using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search
{
    public class SearchAvailalePackagesFilterAndMapperIgnoreTests
    {
        private readonly SearchAvailablePackagesFilterAndMapper _sut;

        public SearchAvailalePackagesFilterAndMapperIgnoreTests()
        {
            var fixture = MapperTestsHelper.PrepareMapperFixture();
            _sut = fixture.Create<SearchAvailablePackagesFilterAndMapper>();
        }

        [Theory]
        [MemberData(nameof(SearchAvailablePackagesFilterAndMapperIgnoreTestData.Map_IgnoreFilterOptionsData), MemberType = typeof(SearchAvailablePackagesFilterAndMapperIgnoreTestData))]
        public async Task MapWithFilters_IgnoreFiltersTrue_ReturnAvCacheResultOffersAsItIs(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, true);

            // Assert
            actual.AvCacheResultOffers.Should().BeEquivalentTo(offers);
            actual.SearchOffersResponse.Status.MinPrice.Should().Be(0);
            actual.SearchOffersResponse.Filters.Should().BeNull();
        }
    }

    public class SearchAvailablePackagesFilterAndMapperIgnoreTestData
    {
        public static IEnumerable<object[]> Map_IgnoreFilterOptionsData =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer() {},
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "EUBA",
                                })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer(){},
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "EUBA",
                                })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer() {},
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "EUBL",
                                })
                            }
                        ),
                    },
                    new PackagesSearchRequest()
                }
            };
    }

}