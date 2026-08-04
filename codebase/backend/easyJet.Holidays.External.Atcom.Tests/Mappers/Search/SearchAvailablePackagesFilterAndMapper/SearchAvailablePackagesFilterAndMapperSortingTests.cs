using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.SmartSeer;
using easyJet.Holidays.Api.Domain.Interfaces.SmartSeer;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search
{
    public class SearchAvailablePackagesFilterAndMapperSortingTests
    {
        private readonly Mock<ISmartSeerService> _smartSeerService = new Mock<ISmartSeerService>();
        private readonly SearchAvailablePackagesFilterAndMapper _sut;

        public SearchAvailablePackagesFilterAndMapperSortingTests()
        {
            var fixture = MapperTestsHelper.PrepareMapperFixture();
            _smartSeerService = fixture.Freeze<Mock<ISmartSeerService>>();
            _sut = fixture.Create<SearchAvailablePackagesFilterAndMapper>();
        }
        /*
         * SORTING TESTS
         * 1. no response
         * 2. empty response
         * 3. sort by default - nothing changed
         * 4. sort by price asc
         * 4. sort by price desc
        */

        [Theory]
        [MemberData(nameof(MapperSortingTestsData.Map_NullResponse), MemberType = typeof(MapperSortingTestsData))]
        public async Task Map_NullResponse(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Arrange

            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(MapperSortingTestsData.Map_EmptyResponse), MemberType = typeof(MapperSortingTestsData))]
        public async Task Map_EmptyResponse(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Arrange

            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(0);
        }

        [Theory]
        [MemberData(nameof(MapperSortingTestsData.Map_DefaultSorting), MemberType = typeof(MapperSortingTestsData))]
        public async Task Map_DefaultSorting(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Arrange

            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(4);
            actual.SearchOffersResponse.Offers[0].Accom.PackageId.Should().Be("750-99");
            actual.SearchOffersResponse.Offers[1].Accom.PackageId.Should().Be("750-100");
            actual.SearchOffersResponse.Offers[2].Accom.PackageId.Should().Be("800");
            actual.SearchOffersResponse.Offers[3].Accom.PackageId.Should().Be("900");
        }

        [Theory]
        [MemberData(nameof(MapperSortingTestsData.Map_DefaultSorting), MemberType = typeof(MapperSortingTestsData))]
        public async Task Map_DefaultSorting_SmartSeer(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Arrange
            _smartSeerService.Setup(x => x.GetSortedHotelCodes(It.IsAny<IEnumerable<string>>(), It.IsAny<PackagesSearchRequest>(), It.IsAny<bool>())).Returns(Task.FromResult(new SmartSeerSortedBody()
            {
                TrackingInfo = new SmartSeerTrackingInfo()
                {
                    PToken = "test"
                },
                Response = new SmartSeerSortResponseBody()
                {
                    Elements = new List<SortResponseElements>()
                    {
                        new SortResponseElements() {Id="900"},
                        new SortResponseElements() {Id="800"},
                        new SortResponseElements() {Id="750-99"},
                        new SortResponseElements() {Id="750-100"},
                    }
                }
            }));

            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(4);
            actual.SearchOffersResponse.Offers[0].Accom.Code.Should().Be("900");
            actual.SearchOffersResponse.Offers[1].Accom.Code.Should().Be("800");
            actual.SearchOffersResponse.Offers[2].Accom.Code.Should().Be("750-99");
            actual.SearchOffersResponse.Offers[3].Accom.Code.Should().Be("750-100");
        }

        [Theory]
        [MemberData(nameof(MapperSortingTestsData.Map_DefaultSorting), MemberType = typeof(MapperSortingTestsData))]
        public async Task Map_DefaultSorting_SmartSeer_FialResponse(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Arrange
            _smartSeerService.Setup(x => x.GetSortedHotelCodes(It.IsAny<IEnumerable<string>>(), It.IsAny<PackagesSearchRequest>(), It.IsAny<bool>()))
                .Returns(Task.FromResult((SmartSeerSortedBody)null));

            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(4);
            actual.SearchOffersResponse.Offers[0].Accom.Code.Should().Be("750-99");
            actual.SearchOffersResponse.Offers[1].Accom.Code.Should().Be("750-100");
            actual.SearchOffersResponse.Offers[2].Accom.Code.Should().Be("800");
            actual.SearchOffersResponse.Offers[3].Accom.Code.Should().Be("900");
        }

        [Theory]
        [MemberData(nameof(MapperSortingTestsData.Map_SortPriceAsc), MemberType = typeof(MapperSortingTestsData))]
        public async Task Map_SortPriceAsc(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Arrange

            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(3);
            actual.SearchOffersResponse.Offers[0].Price.Should().BeLessOrEqualTo(actual.SearchOffersResponse.Offers[1].Price);
            actual.SearchOffersResponse.Offers[1].Price.Should().BeLessOrEqualTo(actual.SearchOffersResponse.Offers[2].Price);
        }

        [Theory]
        [MemberData(nameof(MapperSortingTestsData.Map_SortPriceDesc), MemberType = typeof(MapperSortingTestsData))]
        public async Task Map_SortPriceDesc(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Arrange

            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(3);
            actual.SearchOffersResponse.Offers[0].Price.Should().BeGreaterOrEqualTo(actual.SearchOffersResponse.Offers[1].Price);
            actual.SearchOffersResponse.Offers[1].Price.Should().BeGreaterOrEqualTo(actual.SearchOffersResponse.Offers[2].Price);
        }

        [Theory]
        [MemberData(nameof(MapperSortingTestsData.Map_SortDiscountDesc), MemberType = typeof(MapperSortingTestsData))]
        public async Task Map_SortDiscountDesc(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(3);
            actual.SearchOffersResponse.Offers[0].Price.Should().BeGreaterOrEqualTo(response[0].Price);
            actual.SearchOffersResponse.Offers[1].Price.Should().BeGreaterOrEqualTo(response[2].Price);
            actual.SearchOffersResponse.Offers[2].Price.Should().BeGreaterOrEqualTo(response[1].Price);
        }

        [Theory]
        [MemberData(nameof(MapperSortingTestsData.Map_TripAdvisorWithSmartSeer), MemberType = typeof(MapperSortingTestsData))]
        public async Task Map_TripAdvisorSortingWithSmartSeerData(List<AvCacheResultOffersOfferExtended> atcomOffers, List<string> smartSeerOrder, List<string> expectedOrder)
        {
            // Arrange
            _smartSeerService.Setup(x => x.GetSortedHotelCodes(It.IsAny<IEnumerable<string>>(), It.IsAny<PackagesSearchRequest>(), It.IsAny<bool>()))
                .Returns(Task.FromResult(new SmartSeerSortedBody()
                {
                    TrackingInfo = new SmartSeerTrackingInfo()
                    {
                        PToken = "test"
                    },
                    Response = new SmartSeerSortResponseBody()
                    {
                        Elements = smartSeerOrder.Select(x => new SortResponseElements() { Id = x }).ToList()
                    }
                }));
            var request = new PackagesSearchRequest() { OrderBy = OrderByField.TripAdvisor, Duration = [4] };

            // Act
            var actual = await _sut.MapWithFilters(atcomOffers, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Select(x => x.Accom.Code).Should().Equal(expectedOrder);
        }

        [Theory]
        [MemberData(nameof(MapperSortingTestsData.Map_TripAdvisorWithoutSmartSeer), MemberType = typeof(MapperSortingTestsData))]
        public async Task Map_TripAdvisorSortingWithoutSmartSeerData(List<AvCacheResultOffersOfferExtended> atcomOffers, List<string> expectedOrder)
        {
            // Arrange
            _smartSeerService.Setup(x => x.GetSortedHotelCodes(It.IsAny<IEnumerable<string>>(), It.IsAny<PackagesSearchRequest>(), It.IsAny<bool>()))
                    .Returns(Task.FromResult((SmartSeerSortedBody)null));
            var request = new PackagesSearchRequest() { OrderBy = OrderByField.TripAdvisor, Duration = [4] };

            // Act
            var actual = await _sut.MapWithFilters(atcomOffers, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Select(x => x.Accom.Code).Should().Equal(expectedOrder);
        }

        [Theory]
        [MemberData(nameof(MapperSortingTestsData.Map_RandomSortingTestData), MemberType = typeof(MapperSortingTestsData))]
        public async Task Map_RandomSorting(List<AvCacheResultOffersOfferExtended> offers)
        {
            // Arrange
            var request = new PackagesSearchRequest { OrderBy = OrderByField.Random };

            // Act
            var result = await _sut.MapWithFilters(offers, request, false);

            // Assert
            result.SearchOffersResponse.Offers.Count.Should().Be(offers.Count);
            result.SearchOffersResponse.Offers.Select(x => x.Accom.Code).Should().BeEquivalentTo(offers.Select(x => x.Accommodation.Code));
        }
    }

    public class MapperSortingTestsData
    {
        public static IEnumerable<object[]> Map_NullResponse =>
            new List<object[]>
            {
                new object[] {
                    null,
                    new PackagesSearchRequest() {
                        Page = 1,
                        Take = 10
                    }
                }
            };

        public static IEnumerable<object[]> Map_EmptyResponse =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>(),
                    new PackagesSearchRequest() {
                        Page = 1,
                        Take = 10
                    }
                }
            };

        public static IEnumerable<object[]> Map_DefaultSorting =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {

                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                    AtcomId = "800",
                                    CommPri="800",
                                    Code = "800",
                                })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {

                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                    AtcomId = "900",
                                    CommPri="900",
                                    Code = "900",
                                })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 99,
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                    AtcomId = "750-99",
                                    CommPri="750",
                                    Code = "750-99",
                                })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 100,
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                    AtcomId = "750-100",
                                    CommPri="750",
                                    Code = "750-100",
                                })
                            }
                        ),
                    },
                    new PackagesSearchRequest() {
                        Duration =[4]
                    }
                },
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {

                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                    AtcomId = "800",
                                    CommPri="800",
                                    Code = "800",
                                })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {

                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                    AtcomId = "900",
                                    CommPri="900",
                                    Code = "900",
                                })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 99,
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                    AtcomId = "750-99",
                                    CommPri="750",
                                    Code = "750-99",
                                })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 100,
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                    AtcomId = "750-100",
                                    CommPri="750",
                                    Code = "750-100",
                                })
                            }
                        ),
                    },
                    new PackagesSearchRequest() {
                        OrderDirection = OrderByDirection.Asc,
                        Duration =[4]
                    }
                },
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {

                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                    AtcomId = "800",
                                    CommPri="800",
                                    Code = "800",
                                })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {

                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                    AtcomId = "900",
                                    CommPri="900",
                                    Code = "900",
                                })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 99,
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                    AtcomId = "750-99",
                                    CommPri="750",
                                    Code = "750-99",
                                })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 100,
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                    AtcomId = "750-100",
                                    CommPri="750",
                                    Code = "750-100",
                                })
                            }
                        ),
                    },
                    new PackagesSearchRequest() {
                        OrderDirection = OrderByDirection.Desc,
                        Duration =[4]
                    }
                },
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {

                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                    AtcomId = "800",
                                    CommPri="800",
                                    Code = "800",
                                })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {

                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                    AtcomId = "900",
                                    CommPri="900",
                                    Code = "900",
                                })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 99,
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                    AtcomId = "750-99",
                                    CommPri="750",
                                    Code = "750-99",
                                })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 100,
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                    AtcomId = "750-100",
                                    CommPri="750",
                                    Code = "750-100",
                                })
                            }
                        ),
                    },
                    new PackagesSearchRequest() {
                        OrderBy = OrderByField.SmartSeer,
                        Duration =[4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_SortPriceAsc =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 101.20M,
                            },
                            GetAccom()
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 500M,
                            },
                            GetAccom()
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 0.01M,
                            },
                            GetAccom()
                        ),
                    },
                    new PackagesSearchRequest() {
                        OrderBy = OrderByField.Price,
                        Duration = [4]
                    }
                },
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 101.20M,
                            },
                            GetAccom()
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 500M,
                            },
                            GetAccom()
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 0.01M,
                            },
                            GetAccom()
                        ),
                    },
                    new PackagesSearchRequest() {
                        OrderBy = OrderByField.Price,
                        OrderDirection = OrderByDirection.Asc,
                        Duration =[4]
                    }
                }
            };

        private static AvCacheResultOffersOfferAccomExtended[] GetAccom()
        {
            return new AvCacheResultOffersOfferAccomExtended[]
                   {
                       new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                       {
                           Prom = "ASDE",
                           Cty2 = "DEMU",
                           Date = DateTime.Today,
                           Stay = 7,
                       })
                   };
        }

        public static IEnumerable<object[]> Map_SortPriceDesc =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 101.20M,
                            },
                            GetAccom()
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 500M,
                            },
                            GetAccom()
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 0.01M,
                            },
                            GetAccom()
                        ),
                    },
                    new PackagesSearchRequest() {
                        OrderBy = OrderByField.Price,
                        OrderDirection = OrderByDirection.Desc,
                        Duration =[4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_SortDiscountDesc =>
           new List<object[]>
           {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 101.20M,
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                    Date = DateTime.Today,
                                    Stay = 7,
                                    Unit = new[]
                                    {
                                        new Models.Internal.Search.AvCacheResultOffersOfferAccomUnit()
                                        {
                                            Board = "BB",
                                            Disc = 100,
                                        }
                                    }
                                })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 500M,
                            },
                            GetAccom()
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 0.01M,
                            },
                            GetAccom()
                        ),
                    },
                    new PackagesSearchRequest() {
                        OrderBy = OrderByField.DiscAmount,
                        OrderDirection = OrderByDirection.Desc,
                        Duration =[4]
                    }
                }
           };

        public static IEnumerable<object[]> Map_TripAdvisorWithSmartSeer =>
            new List<object[]>
            {
                new object[] {
                    //atcom offers
                    new List<AvCacheResultOffersOfferExtended>() {
                        CreateOffer("ESCD0018", 4.5),
                        CreateOffer("ESCD0038", 3.5),
                        CreateOffer("ESCD0030", 4  ),
                        CreateOffer("ESCD0012", 4.5),
                        CreateOffer("ESCD0020", 4  ),
                        CreateOffer("ESCD0049", 4.5),
                        CreateOffer("ESCD0002", 4  ),
                        CreateOffer("ESCD0022", 3.5),
                        CreateOffer("ESCD0050", 4.5),
                        CreateOffer("ESCD0003", 4.5)
                    },
                    //SmartSeer response
                    new List<string>
                    {
                        "ESCD0049", "ESCD0020", "ESCD0018", "ESCD0002", "ESCD0030", "ESCD0050", "ESCD0012", "ESCD0003", "ESCD0022", "ESCD0038",
                    },
                    //expected result
                    new List<string>
                    {
                        // 4.5 trip advisor in SmartSeer order
                        "ESCD0049", "ESCD0018", "ESCD0050", "ESCD0012", "ESCD0003",
                        // 4 trip advisor in SmartSeer order
                        "ESCD0020", "ESCD0002", "ESCD0030", 
                        // 3.5 trip advisor in SmartSeer order
                        "ESCD0022", "ESCD0038"
                    }
                }
            };

        public static IEnumerable<object[]> Map_TripAdvisorWithoutSmartSeer =>
            new List<object[]>
            {
                new object[] {
                    //atcom offers
                    new List<AvCacheResultOffersOfferExtended>() {
                        CreateOffer("ESCD0018", 4.5, "57"),
                        CreateOffer("ESCD0038", 3.5, "44"),
                        CreateOffer("ESCD0030", 4  , "88"),
                        CreateOffer("ESCD0012", 4.5, "28"),
                        CreateOffer("ESCD0020", 4  , "22"),
                        CreateOffer("ESCD0049", 4.5, "92"),
                        CreateOffer("ESCD0002", 4  , "42"),
                        CreateOffer("ESCD0022", 3.5, "23"),
                        CreateOffer("ESCD0050", 4.5, "38"),
                        CreateOffer("ESCD0003", 4.5, "50")
                    },
                    //expected result
                    new List<string>
                    {
                        // 4.5 trip advisor in commercial priority order
                        "ESCD0012", "ESCD0050", "ESCD0003", "ESCD0018", "ESCD0049",
                        // 4 trip advisor in SmartSeer order
                        "ESCD0020", "ESCD0002", "ESCD0030", 
                        // 3.5 trip advisor in SmartSeer order
                        "ESCD0022", "ESCD0038"
                    }
                }
            };

        public static IEnumerable<object[]> Map_RandomSortingTestData =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>() {
                        CreateOffer("ESCD0018"),
                        CreateOffer("ESCD0038"),
                        CreateOffer("ESCD0030"),
                        CreateOffer("ESCD0012"),
                        CreateOffer("ESCD0020"),
                        CreateOffer("ESCD0049"),
                        CreateOffer("ESCD0002"),
                        CreateOffer("ESCD0022"),
                        CreateOffer("ESCD0050"),
                        CreateOffer("ESCD0003")
                    },
                }
            };

        private static AvCacheResultOffersOfferExtended CreateOffer(string accomodationCode, double tripAdvisorRating, string commercialPriority = null)
        {
            return new AvCacheResultOffersOfferExtended(
                new Models.Internal.Search.AvCacheResultOffersOffer()
                {

                },
                new[]
                {
                    new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                    {
                        Prom = "ASDE",
                        Cty2 = "DEMU",
                        Code = accomodationCode,
                        CommPri = commercialPriority
                    })
                    {
                        TripAdvisorRating = tripAdvisorRating
                    }
                }
           );
        }

        private static AvCacheResultOffersOfferExtended CreateOffer(string accomodationCode)
        {
            return new AvCacheResultOffersOfferExtended(
                new Models.Internal.Search.AvCacheResultOffersOffer()
                {

                },
                new[]
                {
                    new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                    {
                        Prom = "ASDE",
                        Code = accomodationCode
                    })                }
           );
        }
    }
}
