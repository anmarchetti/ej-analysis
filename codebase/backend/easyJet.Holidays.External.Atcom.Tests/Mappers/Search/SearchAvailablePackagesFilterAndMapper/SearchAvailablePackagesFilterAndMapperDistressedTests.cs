using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search
{
    public class SearchAvailablePackagesFilterAndMapperDistressedTests
    {
        private readonly SearchAvailablePackagesFilterAndMapper _sut;

        public SearchAvailablePackagesFilterAndMapperDistressedTests()
        {
            var fixture = MapperTestsHelper.PrepareMapperFixture();

            var atcomSettings = fixture.Freeze<IOptions<AtcomSettings>>();
            atcomSettings.Value.DistressedFlightsClass = "Z";

            _sut = fixture.Create<SearchAvailablePackagesFilterAndMapper>();
        }

        /*
         * BOARD TYPE FILTER OPTIONS TESTS
         * 1. no response
         * 2. empty response
         * 3. valid response - collect options from units
         * 4. valid response - collect options from alt boards
         * 5. valid response - same board presented in unit and alt board
         * 6. valid response - collect from filtered set
        */

        [Theory]
        [MemberData(nameof(MapperFilterDisstressedData.Map_NullResponse), MemberType = typeof(MapperFilterDisstressedData))]
        public async Task Map_NullResponse(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(MapperFilterDisstressedData.Map_EmptyResponse), MemberType = typeof(MapperFilterDisstressedData))]
        public async Task Map_EmptyResponse(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(0);
        }

        [Theory]
        [MemberData(nameof(MapperFilterDisstressedData.Map_Collect_All_Options), MemberType = typeof(MapperFilterDisstressedData))]
        public async Task Map_SingleFilter_Full_Response(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(2);
        }

        [Theory]
        [MemberData(nameof(MapperFilterDisstressedData.Map_Collect_All_Options_Distressed), MemberType = typeof(MapperFilterDisstressedData))]
        public async Task Map_SingleFilter_Filtered_Distressed(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert

            actual.SearchOffersResponse.Offers.Count.Should().Be(1);
        }

        [Theory]
        [MemberData(nameof(MapperFilterDisstressedData.Map_Collect_All_Options_Distressed), MemberType = typeof(MapperFilterDisstressedData))]
        public async Task Map_SingleFilter_Filtered_Distressed_Settings_Claas_Incorect(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Arrange
            var fixture = MapperTestsHelper.PrepareMapperFixture();

            var atcomSettings = fixture.Freeze<IOptions<AtcomSettings>>();
            atcomSettings.Value.DistressedFlightsClass = "B";

            var sut = fixture.Create<SearchAvailablePackagesFilterAndMapper>();

            // Act
            var actual = await sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(0);
        }
    }

    public class MapperFilterDisstressedData
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

        public static IEnumerable<object[]> Map_Collect_All_Options_Distressed =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Transport = new Models.Internal.Search.AvCacheResultOffersOfferTransport()
                                {
                                    Route = new[]
                                    {
                                        new Models.Internal.Search.AvCacheResultOffersOfferTransportRoute()
                                        {
                                            Class = "Z",
                                            ArrDate = new DateTime(2020, 03, 10),
                                            DepDate = new DateTime(2020, 03, 20),
                                            ArrTime = "1020",
                                            DepTime = "1020"
                                        }
                                    }
                                }
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                    Unit = new[]
                                    {
                                        new Models.Internal.Search.AvCacheResultOffersOfferAccomUnit()
                                        {
                                            Board = "BB"
                                        }
                                    }
                                })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                AltBoard = new[]
                                {
                                    new Models.Internal.Search.AvCacheResultOffersOfferBoard()
                                    {
                                        Code = "FB"
                                    }
                                },
                                Transport = new Models.Internal.Search.AvCacheResultOffersOfferTransport()
                                {
                                    Route = new[]
                                    {
                                        new Models.Internal.Search.AvCacheResultOffersOfferTransportRoute()
                                        {
                                            Class = "Y",
                                            ArrDate = new DateTime(2020, 03, 10),
                                            DepDate = new DateTime(2020, 03, 20),
                                            ArrTime = "1020",
                                            DepTime = "1020"
                                        }
                                    }
                                }
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Cty2 = "DEMU",
                                    Unit = new[]
                                    {
                                        new Models.Internal.Search.AvCacheResultOffersOfferAccomUnit()
                                        {
                                            Board = "BB"
                                        }
                                    }
                                })
                            }
                        ),
                    },
                    new PackagesSearchRequest() {
                        DistressedFlightsOnly = true,
                        Duration = [4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_Collect_All_Options =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Transport = new Models.Internal.Search.AvCacheResultOffersOfferTransport()
                                {
                                    Route = new[]
                                    {
                                        new Models.Internal.Search.AvCacheResultOffersOfferTransportRoute()
                                        {
                                            Class = "Z",
                                            ArrDate = new DateTime(2020, 03, 10),
                                            DepDate = new DateTime(2020, 03, 20),
                                            ArrTime = "1020",
                                            DepTime = "1020"
                                        }
                                    }
                                }
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                    Unit = new[]
                                    {
                                        new Models.Internal.Search.AvCacheResultOffersOfferAccomUnit()
                                        {
                                            Board = "BB"
                                        }
                                    }
                                })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                AltBoard = new[]
                                {
                                    new Models.Internal.Search.AvCacheResultOffersOfferBoard()
                                    {
                                        Code = "FB"
                                    }
                                },
                                Transport = new Models.Internal.Search.AvCacheResultOffersOfferTransport()
                                {
                                    Route = new[]
                                    {
                                        new Models.Internal.Search.AvCacheResultOffersOfferTransportRoute()
                                        {
                                            Class = "Y",
                                            ArrDate = new DateTime(2020, 03, 10),
                                            DepDate = new DateTime(2020, 03, 20),
                                            ArrTime = "1020",
                                            DepTime = "1020"
                                        }
                                    }
                                }
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",  
                                    Unit = new[]
                                    {
                                        new Models.Internal.Search.AvCacheResultOffersOfferAccomUnit()
                                        {
                                            Board = "BB"
                                        }
                                    }
                                })
                            }
                        ),
                    },
                    new PackagesSearchRequest() {
                        DistressedFlightsOnly = false,
                        Duration = [4]
                    }
                }
            };
    }
}
