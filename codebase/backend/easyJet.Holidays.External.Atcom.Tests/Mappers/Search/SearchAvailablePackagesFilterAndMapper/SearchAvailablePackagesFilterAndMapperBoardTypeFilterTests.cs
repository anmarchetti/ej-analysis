using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search
{
    public class SearchAvailablePackagesFilterAndMapperBoardTypeFilterTests
    {
        private readonly SearchAvailablePackagesFilterAndMapper _sut;

        public SearchAvailablePackagesFilterAndMapperBoardTypeFilterTests()
        {
            var fixture = MapperTestsHelper.PrepareMapperFixture();
            _sut = fixture.Create<SearchAvailablePackagesFilterAndMapper>();
        }
        /*
         * BOARD TYPE FILTER TESTS
         * 1. no response
         * 2. empty response
         * 3. valid response - single filter - presented in Unit Board only
         * 4. valid response - single filter - presented in Alt Board only
         * 5. valid response - single filter - presented in Unit Board + Alt Board
         * 6. valid response - single filters - not matching 
         * 7. valid response - multiple filters - one presented in Unit Board only
         * 8. valid response - multiple filters - one presented in Alt Board only
         * 9. valid response - multiple filters - one presented in both Unit Board + Alt Board 
         * 0. valid response - multiple filters - both presented in Unit Board only
         * 1. valid response - multiple filters - both presented in Alt Board only
         * 2. valid response - multiple filters - both presented in both Unit Board + Alt Board 
         * 3. valid response - multiple filters - not matching 
        */

        [Theory]
        [MemberData(nameof(MapperFilterTestsData.Map_NullResponse), MemberType = typeof(MapperFilterTestsData))]
        public async Task Map_NullResponse(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(MapperFilterTestsData.Map_EmptyResponse), MemberType = typeof(MapperFilterTestsData))]
        public async Task Map_EmptyResponse(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(0);
        }

        [Theory]
        [MemberData(nameof(MapperFilterTestsData.Map_SingleFilter_PresentedInUnitOnly), MemberType = typeof(MapperFilterTestsData))]
        public async Task Map_SingleFilter_PresentedInUnitOnly(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(1);
            actual.SearchOffersResponse.Offers[0].Accom.Unit[0].Board.Should().Be("BB");
        }


        [Theory]
        [MemberData(nameof(MapperFilterTestsData.Map_SingleFilter_PresentedInAltBoard), MemberType = typeof(MapperFilterTestsData))]
        public async Task Map_SingleFilter_PresentedInAltBoardOnly(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(1);
        }

        [Theory]
        [MemberData(nameof(MapperFilterTestsData.Map_SingleFilter_NoResults), MemberType = typeof(MapperFilterTestsData))]
        public async Task Map_SingleFilter_NoResults(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(0);
        }

        [Theory]
        [MemberData(nameof(MapperFilterTestsData.Map_MultipleFilters_MatchesUnitAndAlt), MemberType = typeof(MapperFilterTestsData))]
        public async Task Map_MultipleFilters_MatchesUnitAndAlt(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(2);
        }
    }

    public class MapperFilterTestsData
    {
        public static IEnumerable<object[]> Map_NullResponse =>
            new List<object[]>
            {
                new object[] {
                    null,
                    new PackagesSearchRequest() {
                        BoardType = "bb"
                    }
                }
            };

        public static IEnumerable<object[]> Map_EmptyResponse =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>(),
                    new PackagesSearchRequest() {
                        BoardType = "bb"
                    }
                }
            };

        public static IEnumerable<object[]> Map_SingleFilter_PresentedInUnitOnly =>
            new List<object[]>
            {
                new object[] {

                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        MapperTestsHelper.CreateOffer("BB"),
                        MapperTestsHelper.CreateOffer("FB"),
                    },
                    new PackagesSearchRequest() {
                        BoardType = "bb",
                        Duration = [4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_SingleFilter_PresentedInAltBoard =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        MapperTestsHelper.CreateOffer("AI", new string[] {"FB"}),
                        MapperTestsHelper.CreateOffer("AI", new string[] {"BB"})
                    },
                    new PackagesSearchRequest() {
                        BoardType = "bb",
                        Room = new List<RoomAllocation>() {
                            new RoomAllocation{
                                Adults = 1,
                            }
                        },
                        Duration = [4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_SingleFilter_NoResults =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        MapperTestsHelper.CreateOffer("BB"),
                        MapperTestsHelper.CreateOffer("BB", new string[] {"FB"}),
                        MapperTestsHelper.CreateOffer("FB", new string[] {"BB"}),
                    },
                    new PackagesSearchRequest() {
                        BoardType = "sc",
                        Duration = [4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_MultipleFilters_MatchesUnitAndAlt =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        MapperTestsHelper.CreateOffer("BB", new string[] {"FB"}),
                        MapperTestsHelper.CreateOffer("QA", new string[] {"SC"}),
                    },
                    new PackagesSearchRequest() {
                        BoardType = "fb,sc",
                        Room = new List<RoomAllocation>() {
                            new RoomAllocation{
                                Adults = 1,
                            }
                        },
                        Duration = [4]
                    }
                },
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        MapperTestsHelper.CreateOffer("BB", new string[] {"FB"}),
                        MapperTestsHelper.CreateOffer("FB", new string[] {"QA"}),
                    },
                    new PackagesSearchRequest() {
                        BoardType = "fb,",
                        Room = new List<RoomAllocation>() {
                            new RoomAllocation{
                                Adults = 1,
                            }
                        },
                        Duration = [4]
                    },
                }
            };
    }
}