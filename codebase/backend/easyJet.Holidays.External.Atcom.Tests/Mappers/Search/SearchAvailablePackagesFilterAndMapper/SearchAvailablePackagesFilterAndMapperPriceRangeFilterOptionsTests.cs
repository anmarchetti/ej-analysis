using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search
{
    public class SearchAvailablePackagesFilterAndMapperPriceRangeFilterOptionsTests
    {
        private readonly SearchAvailablePackagesFilterAndMapper _sut;

        public SearchAvailablePackagesFilterAndMapperPriceRangeFilterOptionsTests()
        {
            var fixture = MapperTestsHelper.PrepareMapperFixture();
            _sut = fixture.Create<SearchAvailablePackagesFilterAndMapper>();
        }

        /*
         * TripAdvisor RATING FILTER OPTIONS TESTS
         * 1. + filter options - no offers with "2" rating
         * 2. + filter options - some offers with "7" rating
         * 3. + filter results - by one option
         * 4. test it does proper "& up"
         * 5. filter results - by two valid options, calculate sum of results
        */

        [Theory]
        [MemberData(nameof(MapperPriceRangeFilterOptionsTestsTestsData.Map_Filter_Options_Correct_Values), MemberType = typeof(MapperPriceRangeFilterOptionsTestsTestsData))]
        public async Task Map_Filter_Options_Correct_Values(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Status.Total.Should().Be(7);

            actual.SearchOffersResponse.Status.MinPrice.Should().Be(100);
            actual.SearchOffersResponse.Status.MaxPrice.Should().Be(160);
        }

        [Theory]
        [MemberData(nameof(MapperPriceRangeFilterOptionsTestsTestsData.Map_Filter_By_Filtered_Set), MemberType = typeof(MapperPriceRangeFilterOptionsTestsTestsData))]
        public async Task Map_Filter_By_Filtered_Set(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);
            // Assert
            actual.SearchOffersResponse.Status.Total.Should().Be(5);

            actual.SearchOffersResponse.Status.MinPrice.Should().Be(120);
            actual.SearchOffersResponse.Status.MaxPrice.Should().Be(160);
        }

        [Theory]
        [MemberData(nameof(MapperPriceRangeFilterOptionsTestsTestsData.Map_Filter_By_Filtered_Set_And_Price_Bottom), MemberType = typeof(MapperPriceRangeFilterOptionsTestsTestsData))]
        public async Task Map_Filter_By_Filtered_Set_And_Price_Bottom(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Status.Total.Should().Be(4);

            actual.SearchOffersResponse.Status.MinPrice.Should().Be(120);
            actual.SearchOffersResponse.Status.MaxPrice.Should().Be(160);
        }

        [Theory]
        [MemberData(nameof(MapperPriceRangeFilterOptionsTestsTestsData.Map_Filter_By_Filtered_Set_And_Price_Up), MemberType = typeof(MapperPriceRangeFilterOptionsTestsTestsData))]
        public async Task Map_Filter_By_Filtered_Set_And_Price_Up(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Status.Total.Should().Be(3);

            actual.SearchOffersResponse.Status.MinPrice.Should().Be(140);
            actual.SearchOffersResponse.Status.MaxPrice.Should().Be(160);
        }

        [Theory]
        [MemberData(nameof(MapperPriceRangeFilterOptionsTestsTestsData.Map_Filter_By_Filtered_Set_And_PricePP_Both), MemberType = typeof(MapperPriceRangeFilterOptionsTestsTestsData))]
        public async Task Map_Filter_By_Filtered_Set_And_PricePP_Both(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Status.Total.Should().Be(3);

            actual.SearchOffersResponse.Status.MinPricePP.Should().Be(30);
            actual.SearchOffersResponse.Status.MaxPricePP.Should().Be(60);
        }
    }

    public class MapperPriceRangeFilterOptionsTestsTestsData
    {
        public static IEnumerable<object[]> Map_Filter_Options_Correct_Values =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 100
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 5
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 110
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 120
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 1
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 130
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 3
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 140
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 4
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 150
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 5
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 160
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 7
                                }
                            }
                        )
                    },
                    new PackagesSearchRequest() {
                        Duration =[4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_Filter_By_Filtered_Set =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 100
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 1,
                                    StarRating = 4
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 110
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 120
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 5,
                                    StarRating = 1
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 130
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 3,
                                    StarRating = 2
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 140
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 4,
                                    StarRating = 3
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 150
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 5,
                                    StarRating = 5
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 160
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 5,
                                    StarRating = 5
                                }
                            }
                        )
                    },
                    new PackagesSearchRequest() {
                        TripAdvisorRating = 3,
                        Duration =[4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_Filter_By_Filtered_Set_And_Price_Bottom =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 100
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 1,
                                    StarRating = 4
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 110
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 120
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 5,
                                    StarRating = 1
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 130
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 3,
                                    StarRating = 2
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 140
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 4,
                                    StarRating = 3
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 150
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 5,
                                    StarRating = 5
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 160
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 5,
                                    StarRating = 5
                                }
                            }
                        )
                    },
                    new PackagesSearchRequest() {
                        TripAdvisorRating = 3,
                        PriceTo = 150,
                        Duration =[4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_Filter_By_Filtered_Set_And_Price_Up =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 100
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 1,
                                    StarRating = 4
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 110
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 120
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 1,
                                    StarRating = 1
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 130
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 2,
                                    StarRating = 2
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 140
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 4,
                                    StarRating = 3
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 150
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 5,
                                    StarRating = 5
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                Price = 160
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 5,
                                    StarRating = 5
                                }
                            }
                        )
                    },
                    new PackagesSearchRequest() {
                        TripAdvisorRating = 3,
                        PriceFrom = 120,
                        Duration =[4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_Filter_By_Filtered_Set_And_PricePP_Both =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                PricePP = 5
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 1,
                                    StarRating = 4
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                PricePP = 10
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                PricePP = 20
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 2,
                                    StarRating = 1
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                PricePP = 30
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 3,
                                    StarRating = 2
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                PricePP = 40
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 4,
                                    StarRating = 3
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                PricePP = 50
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 5,
                                    StarRating = 5
                                }
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new Models.Internal.Search.AvCacheResultOffersOffer()
                            {
                                PricePP = 60
                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU",
                                })
                                {
                                    TripAdvisorRating = 5,
                                    StarRating = 5
                                }
                            }
                        )
                    },
                    new PackagesSearchRequest() {
                        TripAdvisorRating = 3,
                        PriceFrom = 20,
                        PriceTo = 50,
                        IsPricePP = true,
                        Duration =[4]
                    }
                }
            };
    }
}
