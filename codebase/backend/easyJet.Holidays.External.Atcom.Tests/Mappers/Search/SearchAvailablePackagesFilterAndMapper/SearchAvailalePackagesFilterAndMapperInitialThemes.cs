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
    public class SearchAvailalePackagesFilterAndMapperInitialThemes
    {
        private readonly SearchAvailablePackagesFilterAndMapper _sut;

        public SearchAvailalePackagesFilterAndMapperInitialThemes()
        {
            var fixture = MapperTestsHelper.PrepareMapperFixture();
            var refDataMock = fixture.Freeze<Mock<IReferenceDataService>>();
            refDataMock.Setup(x => x.GetAllThemes()).ReturnsAsync(MapperFilterInitialThemeOptionsTestsData.AllThemes);
            _sut = fixture.Create<SearchAvailablePackagesFilterAndMapper>();
        }

        [Theory]
        [MemberData(nameof(MapperFilterInitialThemeOptionsTestsData.InitialThemes), MemberType = typeof(MapperFilterInitialThemeOptionsTestsData))]
        public async Task MapWithFilters_InitialThemeOnly(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(1);
            var options = actual.SearchOffersResponse.Filters.FirstOrDefault(x => x.Code == AvailableFilters.Theme).Options.FirstOrDefault();
            options.Children.FirstOrDefault(x => x.Code == "BL").Count.Should().Be(1);
            options.Children.FirstOrDefault(x => x.Code == "BA").Count.Should().Be(0);
        }

        [Theory]
        [MemberData(nameof(MapperFilterInitialThemeOptionsTestsData.ThemesAndInitialThemes), MemberType = typeof(MapperFilterInitialThemeOptionsTestsData))]
        public async Task MapWithFilters_InitialThemeAndTheme(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(1);
            var options = actual.SearchOffersResponse.Filters.FirstOrDefault(x => x.Code == AvailableFilters.Theme).Options.FirstOrDefault();
            options.Children.FirstOrDefault(x => x.Code == "BA").Count.Should().Be(1);
            options.Children.FirstOrDefault(x => x.Code == "BL").Count.Should().Be(0);
        }
    }

    public class MapperFilterInitialThemeOptionsTestsData
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

        public static IEnumerable<object[]> InitialThemes =>
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
                        InitialThemes = "BL",
                        Duration = [4]
                    }
                }
            };

        public static IEnumerable<object[]> ThemesAndInitialThemes =>
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
                                    Prom = "EUBB",
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
                        InitialThemes = "BA,BB",
                        Themes = "BA,BL",
                        MinTemp = 0,
                        MaxTemp = 30,
                        Duration = [4],
                        StartDate = "2024-01-01",
                    }
                }
            };
    }

}
