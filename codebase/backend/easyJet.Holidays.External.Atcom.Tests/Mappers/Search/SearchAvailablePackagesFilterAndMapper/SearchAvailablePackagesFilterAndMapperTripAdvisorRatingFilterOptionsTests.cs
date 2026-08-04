using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search
{
    public class SearchAvailablePackagesFilterAndMapperTripAdvisorRatingFilterOptionsTests
    {
        private readonly SearchAvailablePackagesFilterAndMapper _sut;

        public SearchAvailablePackagesFilterAndMapperTripAdvisorRatingFilterOptionsTests()
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
        [MemberData(nameof(MapperTripAdvisorRatingFilterOptionsTestsTestsData.Map_Filter_Options_Correct_Values), MemberType = typeof(MapperTripAdvisorRatingFilterOptionsTestsTestsData))]
        public async Task Map_Filter_Options_Correct_Values(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Status.Total.Should().Be(7);

            var tripAdvisorRatingOptions = actual.SearchOffersResponse.Filters.First(x => x.Code == AvailableFilters.TripadvisorRating).Options;

            tripAdvisorRatingOptions.Should().NotBeNull();

            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "0").Should().BeNull();

            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "1").Should().NotBeNull();
            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "1").Count.Should().Be(5);

            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "2").Should().NotBeNull();
            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "2").Count.Should().Be(4);

            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "3").Should().NotBeNull();
            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "3").Count.Should().Be(4);

            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "4").Should().NotBeNull();
            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "4").Count.Should().Be(3);

            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "5").Should().NotBeNull();
            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "5").Count.Should().Be(2);

            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "6").Should().BeNull();

            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "7").Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(MapperTripAdvisorRatingFilterOptionsTestsTestsData.Map_Filter_By_One_Correct_Value), MemberType = typeof(MapperTripAdvisorRatingFilterOptionsTestsTestsData))]
        public async Task Map_Filter_By_One_Correct_Value(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Status.Total.Should().Be(4);

            var tripAdvisorRatingOptions = actual.SearchOffersResponse.Filters.First(x => x.Code == AvailableFilters.TripadvisorRating).Options;

            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "0").Should().BeNull();

            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "1").Should().NotBeNull();
            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "1").Count.Should().Be(5);

            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "2").Should().NotBeNull();
            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "2").Count.Should().Be(4);

            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "3").Should().NotBeNull();
            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "3").Count.Should().Be(4);

            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "4").Should().NotBeNull();
            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "4").Count.Should().Be(3);

            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "5").Should().NotBeNull();
            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "5").Count.Should().Be(2);

            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "6").Should().BeNull();

            tripAdvisorRatingOptions.FirstOrDefault(o => o.Code == "7").Should().BeNull();

            var starRatingOptions = actual.SearchOffersResponse.Filters.First(x => x.Code == AvailableFilters.StarRating).Options;

            starRatingOptions.Should().NotBeNull();

            starRatingOptions.FirstOrDefault(o => o.Code == "0").Should().BeNull();

            starRatingOptions.FirstOrDefault(o => o.Code == "1").Should().NotBeNull();
            starRatingOptions.FirstOrDefault(o => o.Code == "1").Count.Should().Be(0);

            starRatingOptions.FirstOrDefault(o => o.Code == "2").Should().NotBeNull();
            starRatingOptions.FirstOrDefault(o => o.Code == "2").Count.Should().Be(1);

            starRatingOptions.FirstOrDefault(o => o.Code == "3").Should().NotBeNull();
            starRatingOptions.FirstOrDefault(o => o.Code == "3").Count.Should().Be(1);

            starRatingOptions.FirstOrDefault(o => o.Code == "4").Should().NotBeNull();
            starRatingOptions.FirstOrDefault(o => o.Code == "4").Count.Should().Be(1);

            starRatingOptions.FirstOrDefault(o => o.Code == "5").Should().NotBeNull();
            starRatingOptions.FirstOrDefault(o => o.Code == "5").Count.Should().Be(1);
        }
    }

    public class MapperTripAdvisorRatingFilterOptionsTestsTestsData
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

                            },
                            new[]
                            {
                                new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom()
                                {
                                    Prom = "ASDE",
                                    Cty2 = "DEMU"
                                })
                                {
                                    TripAdvisorRating = 5
                                }
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
                                {
                                }
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
                                {
                                    TripAdvisorRating = 1
                                }
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
                                {
                                    TripAdvisorRating = 3
                                }
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
                                {
                                    TripAdvisorRating = 4
                                }
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
                                {
                                    TripAdvisorRating = 5
                                }
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
                                {
                                    TripAdvisorRating = 7
                                }
                            }
                        )
                    },
                    new PackagesSearchRequest() {
                        Duration = [4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_Filter_By_One_Correct_Value =>
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
                                {
                                    TripAdvisorRating = 5,
                                    StarRating = 4
                                }
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
                                {
                                }
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
                                {
                                    TripAdvisorRating = 1,
                                    StarRating = 1
                                }
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
                                {
                                    TripAdvisorRating = 3,
                                    StarRating = 2
                                }
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
                                {
                                    TripAdvisorRating = 4,
                                    StarRating = 3
                                }
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
                                {
                                    TripAdvisorRating = 5,
                                    StarRating = 5
                                }
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
                                {
                                    TripAdvisorRating = 7,
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
    }
}
