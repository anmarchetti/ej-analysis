using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Themes;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search
{
    public class SearchAvailalePackagesFilterAnd_MapperThemes
    {
        private readonly SearchAvailablePackagesFilterAndMapper _sut;

        public SearchAvailalePackagesFilterAnd_MapperThemes()
        {
            var fixture = MapperTestsHelper.PrepareMapperFixture();
            var refDataMock = fixture.Freeze<Mock<IReferenceDataService>>();
            refDataMock.Setup(x => x.GetAllThemes()).ReturnsAsync(MapperFilterThemeOptionsTestsData.AllThemes);
            _sut = fixture.Create<SearchAvailablePackagesFilterAndMapper>();
        }

        [Theory]
        [MemberData(nameof(MapperFilterThemeOptionsTestsData.Map_NullResponse), MemberType = typeof(MapperFilterThemeOptionsTestsData))]
        public async Task Map_NullResponse(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(MapperFilterThemeOptionsTestsData.Map_EmptyResponse), MemberType = typeof(MapperFilterThemeOptionsTestsData))]
        public async Task Map_EmptyResponse(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            var themes = actual.SearchOffersResponse.Filters.FirstOrDefault(x => x.Code == AvailableFilters.Theme);
            themes.Options.Count.Should().Be(0);
        }

        [Theory]
        [MemberData(nameof(MapperFilterThemeOptionsTestsData.Map_Single_FIlters), MemberType = typeof(MapperFilterThemeOptionsTestsData))]
        public async Task Map_Single_Filters(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(2);
            var options = actual.SearchOffersResponse.Filters.FirstOrDefault(x => x.Code == AvailableFilters.Theme).Options.FirstOrDefault();
            options.Children.FirstOrDefault(x => x.Code == "BA").Count.Should().Be(2);
            options.Children.FirstOrDefault(x => x.Code == "BL").Count.Should().Be(1);
        }

        [Theory]
        [MemberData(nameof(MapperFilterThemeOptionsTestsData.Map_Multiple_Filteres), MemberType = typeof(MapperFilterThemeOptionsTestsData))]
        public async Task Map_Multiple_Filters(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(3);
            var options = actual.SearchOffersResponse.Filters.FirstOrDefault(x => x.Code == AvailableFilters.Theme).Options.FirstOrDefault();
            options.Children.FirstOrDefault(x => x.Code == "BA").Count.Should().Be(2);
            options.Children.FirstOrDefault(x => x.Code == "BL").Count.Should().Be(1);
        }
    }

    public class MapperFilterThemeOptionsTestsData
    {

        public static List<PackageTheme> AllThemes => new List<PackageTheme>()
        {
            new PackageTheme()
            {
                Code = "B",
                Name = "Beach",
                Types = new List<ThemeType>()
                {
                    new ThemeType()
                    {
                        Code = "BA",
                        Name = "Adult",
                    },
                    new ThemeType()
                    {
                        Code = "BL",
                        Name = "Luxary",
                    }
                }
            }
        };

        public static IEnumerable<object[]> Map_NullResponse =>
            new List<object[]>
            {
                new object[] {
                    null,
                    new PackagesSearchRequest() {
                        Themes = "BA"
                    }
                }
            };

        public static IEnumerable<object[]> Map_EmptyResponse =>
            new List<object[]>
            {
                new object[] {
                    new List<AvCacheResultOffersOfferExtended>(),
                    new PackagesSearchRequest() {
                        BoardType = "BA"
                    }
                }
            };

        public static IEnumerable<object[]> Map_Single_FIlters =>
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
                                    Cty2 = "DEMU"
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
                                    Cty2 = "DEMU"
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
                                    Cty2 = "DEMU"
                                })
                            }
                        ),
                    },

                    new PackagesSearchRequest() {
                        Themes = "BA",
                        Duration = [4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_Multiple_Filteres =>
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
                                    Cty2 = "DEMU"
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
                                    Cty2 = "DEMU"
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
                                    Cty2 = "DEMU"
                                })
                            }
                        ),
                    },
                    new PackagesSearchRequest() {
                        Themes = "BA,BL",
                        Duration = [4]
                    }
                }
            };
    }

}
