using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search
{
    public class SearchAvailablePackagesFilterAndMapperDurationFilterOptionsTests
    {
        private readonly Mock<IRouteAvailabilityService> _routesMock = new Mock<IRouteAvailabilityService>();
        private readonly SearchAvailablePackagesFilterAndMapper _sut;

        public SearchAvailablePackagesFilterAndMapperDurationFilterOptionsTests()
        {
            var fixture = MapperTestsHelper.PrepareMapperFixture();
            _routesMock = fixture.Freeze<Mock<IRouteAvailabilityService>>();

            var searchSettings = Options.Create(new SearchSettings()
            {
                MaximumHolidayDuration = 10,
                MinimumHolidayDuration = 1,
                DefaultFlexibleDays = 3
            });
            fixture.Inject(searchSettings);

            _sut = fixture.Create<SearchAvailablePackagesFilterAndMapper>();
        }

        [Theory]
        [MemberData(nameof(MapperDurationFilterOptionsTestsData.Map_NullResponse), MemberType = typeof(MapperDurationFilterOptionsTestsData))]
        public async Task Map_NullResponse(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(MapperDurationFilterOptionsTestsData.Map_EmptyResponse), MemberType = typeof(MapperDurationFilterOptionsTestsData))]
        public async Task Map_EmptyResponse(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(0);
        }

        [Theory]
        [MemberData(nameof(MapperDurationFilterOptionsTestsData.Map_Collect_All_Options_Flexible), MemberType = typeof(MapperDurationFilterOptionsTestsData))]
        public async Task Map_CollectOptions_Flexible(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Arrange
            _routesMock.Setup(x => x.GetAvailabilityDates(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<DateTime>(),
                It.IsAny<DateTime>(),
                It.IsAny<DateTime?>(),
                It.IsAny<string>())
            ).Returns(Task.FromResult(new DatesAvailability()
            {
                Dates = new List<SingleDayAvailability>()
                {
                    new SingleDayAvailability()
                    {
                        Date = "2020-03-19",
                        In = false,
                        Out = true,
                    },
                    new SingleDayAvailability()
                    {
                        Date = "2020-03-20",
                        In = false,
                        Out = true,
                    },
                    new SingleDayAvailability()
                    {
                        Date = "2020-03-21",
                        In = true,
                        Out = false,
                    },
                    new SingleDayAvailability()
                    {
                        Date = "2020-03-22",
                        In = false,
                        Out = false,
                    },
                    new SingleDayAvailability()
                    {
                        Date = "2020-03-23",
                        In = true,
                        Out = true,
                    },
                    new SingleDayAvailability()
                    {
                        Date = "2020-03-24",
                        In = true,
                        Out = false,
                    },
                    new SingleDayAvailability()
                    {
                        Date = "2020-03-25",
                        In = true,
                        Out = true,
                    }
                },
                NextAvailableDate = DateTime.Parse("2020-03-29T00:00:00"),
            }));

            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            var durationFilterOptions = actual.SearchOffersResponse.Filters.First(x => x.Code == AvailableFilters.Duration).Options;

            durationFilterOptions.Should().NotBeNull();
            durationFilterOptions.Count.Should().Be(6);
            durationFilterOptions.All(x => x.Count == 1).Should().BeTrue();
        }

        [Theory]
        [MemberData(nameof(MapperDurationFilterOptionsTestsData.Map_Collect_All_Options), MemberType = typeof(MapperDurationFilterOptionsTestsData))]
        public async Task Map_CollectOption_NotAvailalbeDate(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Arrange
            _routesMock.Setup(x => x.GetAvailabilityDates(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<DateTime>(),
                It.IsAny<DateTime>(),
                It.IsAny<DateTime?>(),
                It.IsAny<string>())
            ).Returns(Task.FromResult(new DatesAvailability()
            {
                Dates = new List<SingleDayAvailability>()
                {
                                new SingleDayAvailability()
                                {
                                    Date = "2020-03-19",
                                    In = false,
                                    Out = true,
                                },
                                new SingleDayAvailability()
                                {
                                    Date = "2020-03-20",
                                    In = false,
                                    Out = false,
                                },
                                new SingleDayAvailability()
                                {
                                    Date = "2020-03-21",
                                    In = true,
                                    Out = true,
                                }
                },
                NextAvailableDate = DateTime.Parse("2020-03-29T00:00:00"),
            }));

            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            var durationFilterOptions = actual.SearchOffersResponse.Filters.First(x => x.Code == AvailableFilters.Duration).Options;

            durationFilterOptions.Should().NotBeNull();
            durationFilterOptions.Count.Should().Be(2);
            durationFilterOptions[0].Count.Should().Be(0);
            durationFilterOptions[1].Count.Should().Be(1);
        }

        [Theory]
        [MemberData(nameof(MapperDurationFilterOptionsTestsData.Map_Collect_All_Options), MemberType = typeof(MapperDurationFilterOptionsTestsData))]
        public async Task Map_CollectOption_EmptyResult(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Arrange
            _routesMock.Setup(x => x.GetAvailabilityDates(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<DateTime>(),
                It.IsAny<DateTime>(),
                It.IsAny<DateTime?>(),
                It.IsAny<string>())
            ).Returns(Task.FromResult(new DatesAvailability()
            {
                Dates = null,
                NextAvailableDate = DateTime.Parse("2020-03-29T00:00:00"),
            }));

            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            var durationFilterOptions = actual.SearchOffersResponse.Filters.First(x => x.Code == AvailableFilters.Duration).Options;

            durationFilterOptions.Should().NotBeNull();
            durationFilterOptions.Count.Should().Be(0);
        }
    }

    public class MapperDurationFilterOptionsTestsData
    {
        public static IEnumerable<object[]> Map_NullResponse =>
            new List<object[]>
            {
                new object[] {
                    null,
                    new PackagesSearchRequest() {
                        Facilities = "abcd"
                    }
                }
            };

        public static IEnumerable<object[]> Map_EmptyResponse =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>(),
                    new PackagesSearchRequest() {
                        Facilities = "cdef"
                    }
                }
            };


        public static IEnumerable<object[]> Map_Collect_All_Options_Flexible =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Transport = new Models.Internal.Search.AvCacheResultOffersOfferTransport
                                {
                                    Route = new[]
                                    {
                                        new Models.Internal.Search.AvCacheResultOffersOfferTransportRoute
                                        {
                                            Dir = Models.Internal.Search.AvCacheResultOffersOfferTransportRouteDir.O,
                                            DepPt = "LGW",
                                            DepDate = new DateTime(2020,05,04),
                                            DepTime = "0955",
                                            ArrDate = new DateTime(2020,05,04),
                                            ArrTime = "1155"
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
                                })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Transport = new Models.Internal.Search.AvCacheResultOffersOfferTransport
                                {
                                    Route = new[]
                                    {
                                        new Models.Internal.Search.AvCacheResultOffersOfferTransportRoute
                                        {
                                            Dir = Models.Internal.Search.AvCacheResultOffersOfferTransportRouteDir.O,
                                            DepPt = "LGW",
                                            DepDate = new DateTime(2020,05,06),
                                            DepTime = "0945",
                                            ArrDate = new DateTime(2020,05,06),
                                            ArrTime = "1055"
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
                                })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Transport = new Models.Internal.Search.AvCacheResultOffersOfferTransport
                                {
                                    Route = new[]
                                    {
                                        new Models.Internal.Search.AvCacheResultOffersOfferTransportRoute
                                        {
                                            Dir = Models.Internal.Search.AvCacheResultOffersOfferTransportRouteDir.O,
                                            DepPt = "LTN",
                                            DepDate = new DateTime(2020,05,04),
                                            DepTime = "0955",
                                            ArrDate = new DateTime(2020,05,04),
                                            ArrTime = "1155"
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
                                })
                            }
                        )
                    },
                    new PackagesSearchRequest() {
                        Departure = "LGW,LTN,SEN",
                        FlexibleDays = 3,
                        StartDate = "2020-05-12",
                        Duration = new List<int>() {2}
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
                                Transport = new Models.Internal.Search.AvCacheResultOffersOfferTransport
                                {
                                    Route = new[]
                                    {
                                        new Models.Internal.Search.AvCacheResultOffersOfferTransportRoute
                                        {
                                            Dir = Models.Internal.Search.AvCacheResultOffersOfferTransportRouteDir.O,
                                            DepPt = "LGW",
                                            DepDate = new DateTime(2020,05,04),
                                            DepTime = "0955",
                                            ArrDate = new DateTime(2020,05,04),
                                            ArrTime = "1155"
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
                                })
                            }
                        ),
                    },
                    new PackagesSearchRequest() {
                        Duration = new List<int>() { 7 },
                    }
                }
            };
    }

}
