using AutoFixture;
using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search
{
    public class SearchAvailablePackagesFilterAndMapperDepartureAirportsFilterOptionsTests
    {
        private readonly Mock<IReferenceDataService> _refDataMock;
        private readonly Mock<IMarketService> _marketServiceMock;
        private readonly Mock<IRouteAvailabilityService> _routeServiceMock;
        private readonly SearchAvailablePackagesFilterAndMapper _sut;

        public SearchAvailablePackagesFilterAndMapperDepartureAirportsFilterOptionsTests()
        {
            var fixture = MapperTestsHelper.PrepareMapperFixture();
            _refDataMock = fixture.Freeze<Mock<IReferenceDataService>>();
            _marketServiceMock = fixture.Freeze<Mock<IMarketService>>();
            _routeServiceMock = fixture.Freeze<Mock<IRouteAvailabilityService>>();

            var atcomSettings = fixture.Freeze<IOptions<AtcomSettings>>();
            atcomSettings.Value.AnywhereCode = "ALL";

            _sut = fixture.Create<SearchAvailablePackagesFilterAndMapper>();
        }

        [Theory]
        [MemberData(nameof(MapperDepartureAirportsFilterOptionsTestsData.Map_NullResponse),
            MemberType = typeof(MapperDepartureAirportsFilterOptionsTestsData))]
        public async Task Map_NullResponse(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(MapperDepartureAirportsFilterOptionsTestsData.Map_EmptyResponse),
            MemberType = typeof(MapperDepartureAirportsFilterOptionsTestsData))]
        public async Task Map_EmptyResponse(List<AvCacheResultOffersOfferExtended> offers,
            PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(0);
        }

        [Theory]
        [MemberData(nameof(MapperDepartureAirportsFilterOptionsTestsData.Map_Collect_All_Options),
            MemberType = typeof(MapperDepartureAirportsFilterOptionsTestsData))]
        public async Task Map_CollectOptions(List<AvCacheResultOffersOfferExtended> offers,
            PackagesSearchRequest request)
        {
            // Arrange
            _routeServiceMock.Setup(x => x.GetDepartureAvailability(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime>(),
                    It.IsAny<DateTime>(), It.IsAny<int?>(), It.IsAny<string>()))
                .Returns(Task.FromResult(new string[3] { "LGW", "LTN", "SEN" }));

            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            var departureFilterOptions = actual.SearchOffersResponse.Filters.First(x => x.Code == AvailableFilters.Departure).Options;

            departureFilterOptions.Should().NotBeNull();
            departureFilterOptions.Count.Should().Be(3);

            departureFilterOptions.FirstOrDefault(o => o.Code == "LGW").Should().NotBeNull();
            departureFilterOptions.FirstOrDefault(o => o.Code == "LGW").Count.Should().Be(1);

            departureFilterOptions.FirstOrDefault(o => o.Code == "LTN").Should().NotBeNull();
            departureFilterOptions.FirstOrDefault(o => o.Code == "LTN").Count.Should().Be(1);

            departureFilterOptions.FirstOrDefault(o => o.Code == "SEN").Should().NotBeNull();
            departureFilterOptions.FirstOrDefault(o => o.Code == "SEN").Count.Should().Be(1);
        }

        [Theory]
        [MemberData(nameof(MapperDepartureAirportsFilterOptionsTestsData.Map_Collect_All_Options),
            MemberType = typeof(MapperDepartureAirportsFilterOptionsTestsData))]
        public async Task Map_CollectOptions_Limited_Availability(List<AvCacheResultOffersOfferExtended> offers,
            PackagesSearchRequest request)
        {
            // Arrange
            _routeServiceMock.Setup(x => x.GetDepartureAvailability(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime>(),
                It.IsAny<DateTime>(), It.IsAny<int?>(), It.IsAny<string>())).Returns(Task.FromResult(new string[1] { "LGW" }));

            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            var departureFilterOptions = actual.SearchOffersResponse.Filters.First(x => x.Code == AvailableFilters.Departure).Options;

            departureFilterOptions.Should().NotBeNull();
            departureFilterOptions.Count.Should().Be(3);

            departureFilterOptions.FirstOrDefault(o => o.Code == "LGW").Should().NotBeNull();
            departureFilterOptions.FirstOrDefault(o => o.Code == "LGW").Count.Should().Be(1);

            departureFilterOptions.FirstOrDefault(o => o.Code == "LTN").Should().NotBeNull();
            departureFilterOptions.FirstOrDefault(o => o.Code == "LTN").Count.Should().Be(0);

            departureFilterOptions.FirstOrDefault(o => o.Code == "SEN").Should().NotBeNull();
            departureFilterOptions.FirstOrDefault(o => o.Code == "SEN").Count.Should().Be(0);
        }

        [Theory]
        [MemberData(nameof(MapperDepartureAirportsFilterOptionsTestsData.Map_Options_Filtered_Set),
            MemberType = typeof(MapperDepartureAirportsFilterOptionsTestsData))]
        public async Task Map_CollectOptions_Filtered_Set(List<AvCacheResultOffersOfferExtended> offers,
            PackagesSearchRequest request)
        {
            // Arrange
            _routeServiceMock.Setup(x => x.GetDepartureAvailability(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime>(),
                    It.IsAny<DateTime>(), It.IsAny<int?>(), It.IsAny<string>()))
                .Returns(Task.FromResult(new string[3] { "LGW", "LTN", "STN" }));

            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            var departureFilterOptions = actual.SearchOffersResponse.Filters.First(x => x.Code == AvailableFilters.Departure).Options;

            departureFilterOptions.Should().NotBeNull();
            departureFilterOptions.Count.Should().Be(3);

            departureFilterOptions.FirstOrDefault(o => o.Code == "LGW").Should().NotBeNull();
            departureFilterOptions.FirstOrDefault(o => o.Code == "LGW").Count.Should().Be(1);

            departureFilterOptions.FirstOrDefault(o => o.Code == "LTN").Should().NotBeNull();
            departureFilterOptions.FirstOrDefault(o => o.Code == "LTN").Count.Should().Be(1);

            departureFilterOptions.FirstOrDefault(o => o.Code == "STN").Should().NotBeNull();
            departureFilterOptions.FirstOrDefault(o => o.Code == "STN").Count.Should().Be(1);
        }

        [Theory]
        [MemberData(nameof(MapperDepartureAirportsFilterOptionsTestsData.Map_Options_Filtered_Set_ALL),
            MemberType = typeof(MapperDepartureAirportsFilterOptionsTestsData))]
        public async Task Map_CollectOptions_Filtered_Set_All(List<AvCacheResultOffersOfferExtended> offers,
            PackagesSearchRequest request)
        {
            // Arrange
            _routeServiceMock.Setup(x => x.GetDepartureAvailability(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime>(),
                    It.IsAny<DateTime>(), It.IsAny<int?>(), It.IsAny<string>()))
                .Returns(Task.FromResult(new string[5] { "LGW", "LTN", "STN", "SEN", "ABC" }));

            _refDataMock.Setup(x => x.GetAllDestinations(true)).Returns(Task.FromResult(new List<DestinationItem>()
            {
                new DestinationItem()
                {
                    AirportCodes = new string[2] {"LTN", "LGW"}
                }
            }));

            var currentMarket = new MarketSettings
            {
                AirportDepartureCodes = new HashSet<string>(1) { "LGW" }
            };

            _marketServiceMock.Setup(x => x.GetCurrentMarket()).Returns(currentMarket);

            var atcomSettings = Options.Create(new AtcomSettings());
            atcomSettings.Value.AnywhereCode = "ALL";

            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            var filter = actual.SearchOffersResponse.Filters.FirstOrDefault(x => x.Code == AvailableFilters.Departure);
            filter.Should().NotBeNull();
            filter.Options.Select(x => x.Code).Should().BeEquivalentTo(new List<string> { "LGW" });
        }

        [Theory]
        [MemberData(nameof(MapperDepartureAirportsFilterOptionsTestsData.Map_Options_FreeForKids),
            MemberType = typeof(MapperDepartureAirportsFilterOptionsTestsData))]
        public async Task Map_FreeForKidsOnly(List<AvCacheResultOffersOfferExtended> offers,
            PackagesSearchRequest request, int expectedAmount)
        {
            // Arrange
            _routeServiceMock.Setup(x => x.GetDepartureAvailability(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime>(),
                    It.IsAny<DateTime>(), It.IsAny<int?>(), It.IsAny<string>()))
                .Returns(Task.FromResult(new string[5] { "LGW", "LTN", "STN", "SEN", "ABC" }));

            _marketServiceMock.Setup(x => x.GetCurrentMarket()).Returns(new MarketSettings()
            { Code = "UK", AirportDepartureCodes = new HashSet<string> { "LGW", "LTN", "STN", "SEN", "ABC" } });

            _refDataMock.Setup(x => x.GetAllDestinations(true)).Returns(Task.FromResult(new List<DestinationItem>()
            {
                new DestinationItem()
                {
                    AirportCodes = new string[2] {"LTN", "LGW"}
                }
            }));

            _refDataMock.Setup(x => x.GetAirports()).ReturnsAsync(
                new Dictionary<string, Holidays.Api.Domain.Data.ReferenceData.Airport>
                {
                    {
                        "LGW",
                        new Holidays.Api.Domain.Data.ReferenceData.Airport {Code = "LGW"}
                    },
                    {
                        "LTN",
                        new Holidays.Api.Domain.Data.ReferenceData.Airport {Code = "LTN"}
                    },
                });

            _refDataMock.Setup(x => x.GetOfferFilterOptions()).ReturnsAsync(
                new OfferFilterOptions
                {
                    Filters = new List<OfferFilterOption>
                    {
                        new OfferFilterOption
                        {
                            Code = "ffk",
                            Name = "Only \"Free Kids Places\"",
                            Enabled = true
                        }
                    }
                });

            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            var filter = actual.SearchOffersResponse.Filters.FirstOrDefault(x => x.Code == AvailableFilters.Offers);
            filter.Should().NotBeNull();
            filter.Options.Single().Count.Should().Be(expectedAmount);
        }
    }

    public class MapperDepartureAirportsFilterOptionsTestsData
    {
        public static IEnumerable<object[]> Map_NullResponse =>
            new List<object[]>
            {
                new object[]
                {
                    null,
                    new PackagesSearchRequest()
                    {
                        Facilities = "abcd"
                    }
                }
            };

        public static IEnumerable<object[]> Map_EmptyResponse =>
            new List<object[]>
            {
                new object[]
                {
                    new List<AvCacheResultOffersOfferExtended>(),
                    new PackagesSearchRequest()
                    {
                        Facilities = "cdef"
                    }
                }
            };

        public static IEnumerable<object[]> Map_Collect_All_Options =>
            new List<object[]>
            {
                new object[]
                {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                                Transport = new AvCacheResultOffersOfferTransport
                                {
                                    Route = new[]
                                    {
                                        new AvCacheResultOffersOfferTransportRoute
                                        {
                                            Dir = AvCacheResultOffersOfferTransportRouteDir.O,
                                            DepPt = "LGW",
                                            DepDate = new DateTime(2020, 05, 04),
                                            DepTime = "0955",
                                            ArrDate = new DateTime(2020, 05, 04),
                                            ArrTime = "1155"
                                        }
                                    }
                                }
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(
                                    new AvCacheResultOffersOfferAccom()
                                    {
                                        Prom = "ASDE",
                                        Cty2 = "DEMU"
                                    })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                                Transport = new AvCacheResultOffersOfferTransport
                                {
                                    Route = new[]
                                    {
                                        new AvCacheResultOffersOfferTransportRoute
                                        {
                                            Dir = AvCacheResultOffersOfferTransportRouteDir.O,
                                            DepPt = "LGW",
                                            DepDate = new DateTime(2020, 05, 06),
                                            DepTime = "0945",
                                            ArrDate = new DateTime(2020, 05, 06),
                                            ArrTime = "1055"
                                        }
                                    }
                                }
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(
                                    new AvCacheResultOffersOfferAccom()
                                    {
                                        Prom = "ASDE",
                                        Cty2 = "DEMU"
                                    })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                                Transport = new AvCacheResultOffersOfferTransport
                                {
                                    Route = new[]
                                    {
                                        new AvCacheResultOffersOfferTransportRoute
                                        {
                                            Dir = AvCacheResultOffersOfferTransportRouteDir.O,
                                            DepPt = "LTN",
                                            DepDate = new DateTime(2020, 05, 04),
                                            DepTime = "0955",
                                            ArrDate = new DateTime(2020, 05, 04),
                                            ArrTime = "1155"
                                        }
                                    }
                                }
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(
                                    new AvCacheResultOffersOfferAccom()
                                    {   
                                        Prom = "ASDE",
                                        Cty2 = "DEMU"
                                    })
                            }
                        )
                    },
                    new PackagesSearchRequest()
                    {
                        Departure = "LGW,LTN,SEN",
                        Duration = [4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_Options_Filtered_Set =>
            new List<object[]>
            {
                new object[]
                {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                                Transport = new AvCacheResultOffersOfferTransport
                                {
                                    Route = new[]
                                    {
                                        new AvCacheResultOffersOfferTransportRoute
                                        {
                                            Dir = AvCacheResultOffersOfferTransportRouteDir.O,
                                            DepPt = "LGW",
                                            DepDate = new DateTime(2020, 05, 04),
                                            DepTime = "0955",
                                            ArrDate = new DateTime(2020, 05, 04),
                                            ArrTime = "1155"
                                        }
                                    }
                                }
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(
                                    new AvCacheResultOffersOfferAccom()
                                    {
                                        Prom = "ASDE",
                                    })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                                Transport = new AvCacheResultOffersOfferTransport
                                {
                                    Route = new[]
                                    {
                                        new AvCacheResultOffersOfferTransportRoute
                                        {
                                            Dir = AvCacheResultOffersOfferTransportRouteDir.O,
                                            DepPt = "LGW",
                                            DepDate = new DateTime(2020, 05, 06),
                                            DepTime = "0945",
                                            ArrDate = new DateTime(2020, 05, 06),
                                            ArrTime = "1055"
                                        }
                                    }
                                }
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(
                                    new AvCacheResultOffersOfferAccom()
                                    {
                                        Prom = "ASDE",
                                        Cty2 = "DEMU"
                                    })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                                Transport = new AvCacheResultOffersOfferTransport
                                {
                                    Route = new[]
                                    {
                                        new AvCacheResultOffersOfferTransportRoute
                                        {
                                            Dir = AvCacheResultOffersOfferTransportRouteDir.O,
                                            DepPt = "LTN",
                                            DepDate = new DateTime(2020, 05, 04),
                                            DepTime = "0955",
                                            ArrDate = new DateTime(2020, 05, 04),
                                            ArrTime = "1155"
                                        }
                                    }
                                }
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(
                                    new AvCacheResultOffersOfferAccom()
                                    {
                                        Prom = "ASDE",
                                        Cty2 = "DEMU"
                                    })
                            }
                        )
                    },
                    new PackagesSearchRequest()
                    {
                        Departure = "LGW",
                        DepartureAirport = "LGW, STN, LTN",
                        Duration = [4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_Options_Filtered_Set_ALL =>
            new List<object[]>
            {
                new object[]
                {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                                Transport = new AvCacheResultOffersOfferTransport
                                {
                                    Route = new[]
                                    {
                                        new AvCacheResultOffersOfferTransportRoute
                                        {
                                            Dir = AvCacheResultOffersOfferTransportRouteDir.O,
                                            DepPt = "LGW",
                                            DepDate = new DateTime(2020, 05, 04),
                                            DepTime = "0955",
                                            ArrDate = new DateTime(2020, 05, 04),
                                            ArrTime = "1155"
                                        }
                                    }
                                }
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(
                                    new AvCacheResultOffersOfferAccom()
                                    {
                                        Prom = "ASDE",
                                        Cty2 = "DEMU"
                                    })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                                Transport = new AvCacheResultOffersOfferTransport
                                {
                                    Route = new[]
                                    {
                                        new AvCacheResultOffersOfferTransportRoute
                                        {
                                            Dir = AvCacheResultOffersOfferTransportRouteDir.O,
                                            DepPt = "LGW",
                                            DepDate = new DateTime(2020, 05, 06),
                                            DepTime = "0945",
                                            ArrDate = new DateTime(2020, 05, 06),
                                            ArrTime = "1055"
                                        }
                                    }
                                }
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(
                                    new AvCacheResultOffersOfferAccom()
                                    {
                                        Prom = "ASDE",
                                        Cty2 = "DEMU"
                                    })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                                Transport = new AvCacheResultOffersOfferTransport
                                {
                                    Route = new[]
                                    {
                                        new AvCacheResultOffersOfferTransportRoute
                                        {
                                            Dir = AvCacheResultOffersOfferTransportRouteDir.O,
                                            DepPt = "LTN",
                                            DepDate = new DateTime(2020, 05, 04),
                                            DepTime = "0955",
                                            ArrDate = new DateTime(2020, 05, 04),
                                            ArrTime = "1155"
                                        }
                                    }
                                }
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(
                                    new AvCacheResultOffersOfferAccom()
                                    {
                                        Prom = "ASDE",
                                        Cty2 = "DEMU"
                                    })
                            }
                        )
                    },
                    new PackagesSearchRequest()
                    {
                        Departure = "LGW,LTN,STN",
                        Geography = "ALL",
                        DepartureAirport = "ALL",
                        Duration = [4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_Options_FreeForKids =>
            new List<object[]>
            {
                new object[]
                {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                                Transport = new AvCacheResultOffersOfferTransport
                                {
                                    Route = new[]
                                    {
                                        new AvCacheResultOffersOfferTransportRoute
                                        {
                                            Dir = AvCacheResultOffersOfferTransportRouteDir.O,
                                            DepPt = "LGW",
                                            DepDate = new DateTime(2020, 05, 04),
                                            DepTime = "0955",
                                            ArrDate = new DateTime(2020, 05, 04),
                                            ArrTime = "1155"
                                        }
                                    }
                                }
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(
                                    new AvCacheResultOffersOfferAccom()
                                    {
                                        Prom = "ASDE",
                                        Cty2 = "DEMU",
                                        Unit = new []
                                        {
                                            new AvCacheResultOffersOfferAccomUnit
                                            {
                                                Dc = YesNo.Y,
                                                DcSpecified = false,
                                                Board = "WHATEVER"
                                            }
                                        }
                                    })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                                Transport = new AvCacheResultOffersOfferTransport
                                {
                                    Route = new[]
                                    {
                                        new AvCacheResultOffersOfferTransportRoute
                                        {
                                            Dir = AvCacheResultOffersOfferTransportRouteDir.O,
                                            DepPt = "LGW",
                                            DepDate = new DateTime(2020, 05, 06),
                                            DepTime = "0945",
                                            ArrDate = new DateTime(2020, 05, 06),
                                            ArrTime = "1055"
                                        }
                                    }
                                }
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(
                                    new AvCacheResultOffersOfferAccom()
                                    {
                                        Prom = "ASDE",
                                        Cty2 = "DEMU",
                                        Unit = new []
                                        {
                                            new AvCacheResultOffersOfferAccomUnit
                                            {
                                                Dc = YesNo.Y,
                                                DcSpecified = true,
                                                Board = "WHATEVER"
                                            }
                                        }
                                    })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                                Transport = new AvCacheResultOffersOfferTransport
                                {
                                    Route = new[]
                                    {
                                        new AvCacheResultOffersOfferTransportRoute
                                        {
                                            Dir = AvCacheResultOffersOfferTransportRouteDir.O,
                                            DepPt = "LTN",
                                            DepDate = new DateTime(2020, 05, 04),
                                            DepTime = "0955",
                                            ArrDate = new DateTime(2020, 05, 04),
                                            ArrTime = "1155"
                                        }
                                    }
                                }
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(
                                    new AvCacheResultOffersOfferAccom()
                                    {
                                        Prom = "ASDE",
                                        Cty2 = "DEMU",
                                        Unit = new []
                                        {
                                            new AvCacheResultOffersOfferAccomUnit
                                            {
                                                Dc = YesNo.Y,
                                                DcSpecified = true,
                                                Board = "WHATEVER"
                                            }
                                        }
                                    })
                            }
                        )
                    },
                    new PackagesSearchRequest()
                    {
                        Departure = "LGW,LTN,STN",
                        Geography = "ALL",
                        DepartureAirport = "ALL",
                        Offers = OfferConstants.FreeForKidsFilter,
                        Duration = [4]
                    },
                    // expected amount
                    2
                }
            };
    }
}