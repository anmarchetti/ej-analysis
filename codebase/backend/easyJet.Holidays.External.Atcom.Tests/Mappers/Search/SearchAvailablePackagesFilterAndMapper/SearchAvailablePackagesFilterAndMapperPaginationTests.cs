using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search
{
    public class SearchAvailablePackagesFilterAndMapperPaginationTests
    {
        private readonly SearchAvailablePackagesFilterAndMapper _sut;

        public SearchAvailablePackagesFilterAndMapperPaginationTests()
        {
            var fixture = MapperTestsHelper.PrepareMapperFixture();
            _sut = fixture.Create<SearchAvailablePackagesFilterAndMapper>();
        }

        /*
         * PAGINATION TESTS
         * 1. no response
         * 2. empty response
         * 3. valid response - N of results is less then Take size
         * 4. valid response - N of results is more then Take size
         * 5. valid response - 0 or missing Page and Take arguments
         * 6. valid response - Take > 100 shold be replaced with default 10
         * 7. valid response - Page + Take is more them number of results
        */

        [Theory]
        [MemberData(nameof(MapperPaginationTestsData.Map_NullResponse), MemberType = typeof(MapperPaginationTestsData))]
        public async Task Map_NullResponse(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(MapperPaginationTestsData.Map_EmptyResponse), MemberType = typeof(MapperPaginationTestsData))]
        public async Task Map_EmptyResponse(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(0);
        }

        [Theory]
        [MemberData(nameof(MapperPaginationTestsData.Map_2ResultsTake10), MemberType = typeof(MapperPaginationTestsData))]
        public async Task Map_2ResultsTake10(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(2);
        }


        [Theory]
        [MemberData(nameof(MapperPaginationTestsData.Map_5ResultsTake3), MemberType = typeof(MapperPaginationTestsData))]
        public async Task Map_5ResultsTake3(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(3);
        }

        [Theory]
        [MemberData(nameof(MapperPaginationTestsData.Map_MissingArguments), MemberType = typeof(MapperPaginationTestsData))]
        public async Task Map_MissingArguments(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(10);
            actual.SearchOffersResponse.Offers[0].Accom.PackageId.Should().Be("1");
            actual.SearchOffersResponse.Offers[1].Accom.PackageId.Should().Be("2");
            actual.SearchOffersResponse.Offers[2].Accom.PackageId.Should().Be("3");
            actual.SearchOffersResponse.Offers[3].Accom.PackageId.Should().Be("4");
            actual.SearchOffersResponse.Offers[4].Accom.PackageId.Should().Be("5");
            actual.SearchOffersResponse.Offers[5].Accom.PackageId.Should().Be("6");
            actual.SearchOffersResponse.Offers[6].Accom.PackageId.Should().Be("7");
            actual.SearchOffersResponse.Offers[7].Accom.PackageId.Should().Be("8");
            actual.SearchOffersResponse.Offers[8].Accom.PackageId.Should().Be("9");
            actual.SearchOffersResponse.Offers[9].Accom.PackageId.Should().Be("10");
        }

        [Theory]
        [MemberData(nameof(MapperPaginationTestsData.Map_PageOverflow), MemberType = typeof(MapperPaginationTestsData))]
        public async Task Map_PageOverflow(List<AvCacheResultOffersOfferExtended> response, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(response, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(0);
        }
    }

    public class MapperPaginationTestsData
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

        public static IEnumerable<object[]> Map_2ResultsTake10 =>
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
                                    Cty2 = "DEMU"
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
                                    Cty2 = "DEMU"
                                })
                            }
                        )
                    },
                    new PackagesSearchRequest() {
                        Page = 1,
                        Take = 10,
                        Duration =[4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_5ResultsTake3 =>
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
                                    Cty2 = "DEMU"
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
                                    Cty2 = "DEMU"
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
                                    Cty2 = "DEMU"
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
                                    Cty2 = "DEMU"
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
                                    Cty2 = "DEMU"
                                })
                            }
                        )
                    },
                    new PackagesSearchRequest() {
                        Page = 1,
                        Take = 3,
                        Duration =[4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_MissingArguments =>
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
                                    AtcomId = "1"
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
                                    AtcomId = "2"
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
                                    AtcomId = "3"
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
                                    AtcomId = "4"
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
                                    AtcomId = "5"
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
                                    AtcomId = "6"
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
                                    AtcomId = "7"
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
                                    AtcomId = "8"
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
                                    AtcomId = "9"
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
                                    AtcomId = "10"
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
                                    AtcomId = "11"
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
                                    AtcomId = "12"
                                })
                            }
                        )
                    },
                    new PackagesSearchRequest() {
                        Page = 0,
                        Take = 0,
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
                                    AtcomId = "1"
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
                                    AtcomId = "2"
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
                                    AtcomId = "3"
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
                                    AtcomId = "4"
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
                                    AtcomId = "5"
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
                                    AtcomId = "6"
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
                                    AtcomId = "7"
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
                                    AtcomId = "8"
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
                                    AtcomId = "9"
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
                                    AtcomId = "10"
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
                                    AtcomId = "11"
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
                                    AtcomId = "12"
                                })
                            }
                        )
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
                                    AtcomId = "1"
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
                                    AtcomId = "2"
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
                                    AtcomId = "3"
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
                                    AtcomId = "4"
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
                                    AtcomId = "5"
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
                                    AtcomId = "6"
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
                                    AtcomId = "7"
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
                                    AtcomId = "8"
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
                                    AtcomId = "9"
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
                                    AtcomId = "10"
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
                                    AtcomId = "11"
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
                                    AtcomId = "12"
                                })
                            }
                        )
                    },
                    new PackagesSearchRequest() {
                        Take = byte.MaxValue - 1,
                        Duration = [4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_PageOverflow =>
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
                                    AtcomId = "1"
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
                                    AtcomId = "2"
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
                                    AtcomId = "3"
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
                                    AtcomId = "4"
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
                                    AtcomId = "5"
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
                                    AtcomId = "6"
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
                                    AtcomId = "7"
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
                                    AtcomId = "8"
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
                                    AtcomId = "9"
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
                                    AtcomId = "10"
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
                                    AtcomId = "11"
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
                                    AtcomId = "12"
                                })
                            }
                        )
                    },
                    new PackagesSearchRequest() {
                        Page = short.MaxValue - 1,
                        Duration =[4]
                    }
                }
            };
    }
}
