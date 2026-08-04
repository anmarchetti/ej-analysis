using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search
{
    public class SearchAvailablePackagesFilterAndMapperDestinationTests
    {
        private readonly Mock<IReferenceDataService> _refDataMock = new Mock<IReferenceDataService>();
        private readonly SearchAvailablePackagesFilterAndMapper _sut;

        public SearchAvailablePackagesFilterAndMapperDestinationTests()
        {
            var fixture = MapperTestsHelper.PrepareMapperFixture();
            _refDataMock = fixture.Freeze<Mock<IReferenceDataService>>();
            _sut = fixture.Create<SearchAvailablePackagesFilterAndMapper>();
        }

        [Fact]
        public async Task MapWithFilters_NullResponse()
        {
            // Act
            var actual = await _sut.MapWithFilters(null, new PackagesSearchRequest() { }, false);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(MapperFilterDestinationTestsData.Data), MemberType = typeof(MapperFilterDestinationTestsData))]
        public async Task MapWithFilters_SitecoreDestinationsAreNull_EmptyFilterOptionResponse(string because, List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, Filter expectedFilter)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            var destinationFilter = actual.SearchOffersResponse.Filters.FirstOrDefault(x => x.Code == AvailableFilters.Destination);

            destinationFilter.Should().NotBeNull(because);
            destinationFilter?.Options.Should().BeEmpty(because);
        }

        [Theory]
        [MemberData(nameof(MapperFilterDestinationTestsData.Data), MemberType = typeof(MapperFilterDestinationTestsData))]
        public async Task MapWithFilters_MapAndFilter(string because, List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, Filter expectedFilter)
        {
            // Arrange
            _refDataMock.Setup(x => x.GetAllDestinations(false)).ReturnsAsync(MapperFilterDestinationTestsData.Destinations().Destinations);

            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            var destinationFilter = actual.SearchOffersResponse.Filters.FirstOrDefault(x => x.Code == AvailableFilters.Destination);

            destinationFilter.Should().BeEquivalentTo(expectedFilter, because);
        }

    }

    public class MapperFilterDestinationTestsData
    {
        public static DestinationsSearchResponse Destinations()
        {
            return new DestinationsSearchResponse
            {
                Destinations = new List<DestinationItem> {
                    new DestinationItem {
                        Code = "ES",
                        Name = "Spain",
                        Type = DestinationItemType.Country,
                        Children = new List<DestinationItem>{
                            new DestinationItem
                            {
                                Code = "ESTF",
                                Name = "Tenerife",
                            },
                            new DestinationItem
                            {
                                Code = "ESDO",
                                Name = "Costa Dorada",
                            },
                            new DestinationItem
                            {
                                Code = "ESGC",
                                Name = "Gran Canaria",
                            },
                            new DestinationItem
                            {
                                Code = "VANDA",
                                Name = "Andalucia",
                                RelatedRegions = new string[1] { "ESGC" },
                                Type = DestinationItemType.VirtualRegion
                            }
                        }
                    },
                    new DestinationItem {
                        Parents = new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Code = "ES",
                            }
                        },
                        RelatedRegions = new string[1] { "GBSC" },
                        Code = "VGBSC",
                        Name = "Scotland",
                        Type = DestinationItemType.VirtualCountry,
                        Children = new List<DestinationItem>{
                            new DestinationItem
                            {
                                Code = "GRGCDS",
                                Name = "Greece Gran Canaria",
                                Type = DestinationItemType.Resort,
                            }
                        }
                    }
                }
            };
        }

        public static IEnumerable<object[]> Data()
        {
            yield return new object[] {
                "Empty geography",
                new List<AvCacheResultOffersOfferExtended>(),
                new PackagesSearchRequest() {
                    Geography=""
                },
                new Filter {
                    Code = AvailableFilters.Destination,
                    Name = Atcom.Mappers.Search.Filters.DestinationFilter.DestinationVariantFilterName,
                    Options = new List<FilterOption>()
                }
            };

            yield return new object[] {
                "Multiple countries",
                new List<AvCacheResultOffersOfferExtended>(),
                new PackagesSearchRequest() {
                    Geography="ES|GR,GBSC"
                },
                new Filter {
                    Code = AvailableFilters.Destination,
                    Name = Atcom.Mappers.Search.Filters.DestinationFilter.DestinationVariantFilterName,
                    Options = new List<FilterOption>{
                        new FilterOption {
                            Code = "ES",
                            Name = "Spain",
                            Children = new List<FilterOption> {
                                new FilterOption {
                                    Code = "ESTF",
                                    Name = "Tenerife",
                                    DestinationInfo = new DestinationFilterInfo() {},
                                },
                                new FilterOption {
                                    Code = "ESDO",
                                    Name = "Costa Dorada",
                                    DestinationInfo = new DestinationFilterInfo() {},
                                },
                                new FilterOption
                                {
                                    Code = "ESGC",
                                    Name = "Gran Canaria",
                                    DestinationInfo = new DestinationFilterInfo() {},
                                },
                                new FilterOption
                                {
                                    Code = "VANDA",
                                    Name = "Andalucia",
                                    DestinationInfo = new DestinationFilterInfo() {
                                        Type = DestinationItemType.VirtualRegion,
                                        RelatedRegions = new string[1] { "ESGC" },
                                    },
                                }
                            },
                            DestinationInfo = new DestinationFilterInfo() {
                                Type= DestinationItemType.Country
                            },
                        },
                        new FilterOption {
                            Code = "VGBSC",
                            Name = "Scotland",
                            Children = new List<FilterOption> {
                                new FilterOption {
                                    Code = "GRGCDS",
                                    Name = "Greece Gran Canaria",
                                    DestinationInfo = new DestinationFilterInfo() {
                                        Type = DestinationItemType.Resort
                                    },
                                }
                            },
                            DestinationInfo = new DestinationFilterInfo() {
                                Parent = "ES",
                                RelatedRegions = new string[1] { "GBSC" },
                                Type = DestinationItemType.VirtualCountry
                            },
                        }
                    }
                }
            };
        }
    }
}
