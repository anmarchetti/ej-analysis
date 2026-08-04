using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using System.Globalization;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search.Filters
{
    public class DestinationFilterTests
    {
        private readonly Mock<IDestinationsService> _destinationsServiceMock;
        private readonly Mock<IReferenceDataService> _referenceDataServiceMock;
        private readonly Mock<IRouteAvailabilityService> _routeAvailabilityServiceMock;
        private readonly IOptions<AtcomSettings> _atcomSettings;

        public DestinationFilterTests()
        {
            _atcomSettings = Options.Create<AtcomSettings>(new AtcomSettings
            {
                AnywhereCode = "ALL"
            });

            _destinationsServiceMock = new Mock<IDestinationsService>();
            _destinationsServiceMock
                .Setup(x => x.GetDestinationsByCodes(It.IsAny<ICollection<string>>(), true))
                .ReturnsAsync(new DestinationItem[]
                {
                    new DestinationItem
                    {
                        Code = "ESBA",
                        Name = "Barcelona",
                        Available = true,
                        AirportCodes = new[] { "ESBA" },
                        Type = DestinationItemType.Region
                    }
                });

            _referenceDataServiceMock = new Mock<IReferenceDataService>();
            _referenceDataServiceMock
                .Setup(x => x.GetAllDestinations(false))
                .ReturnsAsync(new List<DestinationItem>
                {
                    new DestinationItem
                    {
                        Code = "ES",
                        Name = "Spain",
                        Available = true,
                        AirportCodes = ["ES"],
                        Type = DestinationItemType.Country
                    }
                });

            _routeAvailabilityServiceMock = new Mock<IRouteAvailabilityService>();
            _routeAvailabilityServiceMock
                .Setup(x => x.GetArrivalAirports(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<int?>()))
                .ReturnsAsync(new List<string>() { "ES" });
        }

        #region Helper Methods for FilterBy Tests

        private Atcom.Mappers.Search.Filters.DestinationFilter CreateFilterWithDestinations(params DestinationItem[] destinations)
        {
            var destinationsServiceMock = new Mock<IDestinationsService>();
            destinationsServiceMock
                .Setup(x => x.GetDestinationsByCodes(It.IsAny<ICollection<string>>(), true))
                .ReturnsAsync(destinations);

            return new Atcom.Mappers.Search.Filters.DestinationFilter(
                _atcomSettings,
                destinationsServiceMock.Object,
                _referenceDataServiceMock.Object,
                _routeAvailabilityServiceMock.Object);
        }

        private List<Models.Extensions.AvCacheResultOffersOfferExtended> CreateOfferSet(params string[] accomCodes)
        {
            return accomCodes.Select(code => new Models.Extensions.AvCacheResultOffersOfferExtended(
                new Models.Internal.Search.AvCacheResultOffersOffer
                {
                    Accom = new[]
                    {
                        new Models.Internal.Search.AvCacheResultOffersOfferAccom { Code = code }
                    }
                },
                new List<Models.Extensions.AvCacheResultOffersOfferAccomExtended>
                {
                    new Models.Extensions.AvCacheResultOffersOfferAccomExtended(
                        new Models.Internal.Search.AvCacheResultOffersOfferAccom { Code = code })
                })).ToList();
        }

        private DestinationItem CreateHotel(string code, string parentRegionCode)
        {
            return new DestinationItem
            {
                Code = code,
                Type = DestinationItemType.Hotel,
                Parents = new List<DestinationItem>
                {
                    new DestinationItem { Code = parentRegionCode, Type = DestinationItemType.Region }
                }
            };
        }

        private DestinationItem CreateResort(string code, string parentRegionCode)
        {
            return new DestinationItem
            {
                Code = code,
                Type = DestinationItemType.Resort,
                Parents = new List<DestinationItem>
                {
                    new DestinationItem { Code = parentRegionCode, Type = DestinationItemType.Region }
                }
            };
        }

        private DestinationItem CreateVirtualResort(string code, params string[] relatedResorts)
        {
            return new DestinationItem
            {
                Code = code,
                Type = DestinationItemType.VirtualResort,
                RelatedResorts = relatedResorts
            };
        }

        private DestinationItem CreateVirtualCountry(string code, params string[] relatedRegions)
        {
            return new DestinationItem
            {
                Code = code,
                Type = DestinationItemType.VirtualCountry,
                RelatedRegions = relatedRegions
            };
        }

        private DestinationItem CreateVirtualRegion(string code, params string[] relatedRegions)
        {
            return new DestinationItem
            {
                Code = code,
                Type = DestinationItemType.VirtualRegion,
                RelatedRegions = relatedRegions
            };
        }

        private DestinationItem CreateRegion(string code, string parentCountryCode)
        {
            return new DestinationItem
            {
                Code = code,
                Type = DestinationItemType.Region,
                Parents = new List<DestinationItem>
                {
                    new DestinationItem { Code = parentCountryCode, Type = DestinationItemType.Country }
                }
            };
        }

        #endregion

        [Theory]
        [MemberData(nameof(DestinationFilterTestsData.GetOptionsGeneralData), MemberType = typeof(DestinationFilterTestsData))]
        public async Task GetOptions_General(PackagesSearchRequest request, FilterOptions expected)
        {
            var sut = new Atcom.Mappers.Search.Filters.DestinationFilter(
                _atcomSettings,
                _destinationsServiceMock.Object,
                _referenceDataServiceMock.Object,
                _routeAvailabilityServiceMock.Object
                );

            var result = await sut.GetOptions(
                new List<Models.Extensions.AvCacheResultOffersOfferExtended>(),
                request,
                (offers, request) => Task.FromResult(offers));

            result.Should().NotBeNull();
            result.Name.Should().Be(expected.Name);
            result.Options.Count.Should().Be(1);
            result.Options[0].Code.Should().Be(expected.Options[0].Code);
        }

        [Theory]
        [MemberData(nameof(DestinationFilterTestsData.GetOptionsPromoData), MemberType = typeof(DestinationFilterTestsData))]
        public async Task GetOptions_PromoPages(PackagesSearchRequest request, List<DestinationItem> promoDestinations, FilterOptions expected)
        {
            _destinationsServiceMock
                .Setup(x => x.GetPromoDestinations(It.IsAny<string>()))
                .ReturnsAsync(promoDestinations);

            var sut = new Atcom.Mappers.Search.Filters.DestinationFilter(
                _atcomSettings,
                _destinationsServiceMock.Object,
                _referenceDataServiceMock.Object,
                _routeAvailabilityServiceMock.Object
                );

            var result = await sut.GetOptions(
                new List<Models.Extensions.AvCacheResultOffersOfferExtended>(),
                request,
                (offers, request) => Task.FromResult(offers));

            result.Should().NotBeNull();
            result.Name.Should().Be(expected.Name);
            result.Options.Count.Should().Be(1);
            result.Options[0].Code.Should().Be(expected.Options[0].Code);
        }

        [Theory]
        [MemberData(nameof(DestinationFilterTestsData.ExtractDatesFromRequestData), MemberType = typeof(DestinationFilterTestsData))]
        public void MapWithFilters_PromoPage_ExtractDatesFromRequest(string because, PackagesSearchRequest request, DateTime? expectedStartDate, DateTime? expectedEndDate, int? expectedDuration)
        {
            Atcom.Mappers.Search.Filters.DestinationFilter.ExtractDatesFromRequest(request, out var startDate, out var endDate, out var duration);

            startDate.Should().Be(expectedStartDate, because);
            endDate.Should().Be(expectedEndDate, because);
            duration.Should().Be(expectedDuration, because);
        }

        [Theory]
        [MemberData(nameof(DestinationFilterTestsData.IsDestinationReachableData), MemberType = typeof(DestinationFilterTestsData))]
        public void MapWithFilters_PromoPage_IsDestinationReachable(string because, DestinationItem destinationItem, HashSet<string> availableDestinations, bool expectedResult)
        {
            var result = Atcom.Mappers.Search.Filters.DestinationFilter.IsDestinationReachable(destinationItem, availableDestinations);

            result.Should().Be(expectedResult, because);
        }

        [Theory]
        [MemberData(nameof(DestinationFilterTestsData.GetCountryFromDestinationItemData), MemberType = typeof(DestinationFilterTestsData))]
        public void MapWithFilters_PromoPage_GetCountryFromDestinationItem(string because, DestinationItem destinationItem, Dictionary<string, DestinationItem> relatedRegionCodeVirtualRegionMapping, string expectedCountryCode)
        {
            var result = Atcom.Mappers.Search.Filters.DestinationFilter.GetCountryFromDestinationItem(destinationItem, relatedRegionCodeVirtualRegionMapping, out var _);

            result?.Code.Should().Be(expectedCountryCode, because);
        }

        [Theory]
        [MemberData(nameof(DestinationFilterTestsData.GetRegionFromDestinationItemData), MemberType = typeof(DestinationFilterTestsData))]
        public void MapWithFilters_PromoPage_GetRegionFromDestinationItem(string because, DestinationItem destinationItem, string expectedRegionCode)
        {
            var result = Atcom.Mappers.Search.Filters.DestinationFilter.GetRegionFromDestinationItem(destinationItem);

            result?.Code.Should().Be(expectedRegionCode, because);
        }

        [Fact]
        public void MapWithFilters_PromoPage_GetRegionFromDestinationItem_WhenResortHasNoParents_ReturnsNull()
        {
            var destinationItem = new DestinationItem
            {
                Type = DestinationItemType.Resort,
                Code = "ESBABA"
            };

            var result = Atcom.Mappers.Search.Filters.DestinationFilter.GetRegionFromDestinationItem(destinationItem);

            result.Should().BeNull();
        }

        [Fact]
        public void MapWithFilters_PromoPage_GetRegionFromDestinationItem_WhenRegionHasNoParentsAndCountryExists_SetsCountryParent()
        {
            var region = new DestinationItem
            {
                Type = DestinationItemType.Region,
                Code = "ESBA"
            };

            var destinationItem = new DestinationItem
            {
                Type = DestinationItemType.Resort,
                Code = "ESBABA",
                Parents = new List<DestinationItem>
                {
                    region,
                    new DestinationItem
                    {
                        Type = DestinationItemType.Country,
                        Code = "ES"
                    }
                }
            };

            var result = Atcom.Mappers.Search.Filters.DestinationFilter.GetRegionFromDestinationItem(destinationItem);

            result.Should().BeSameAs(region);
            result.Parents.Should().NotBeNull();
            result.Parents.Should().ContainSingle(parent => parent.Type == DestinationItemType.Country && parent.Code == "ES");
        }

        [Fact]
        public void MapWithFilters_PromoPage_GetRegionFromDestinationItem_WhenRegionHasNoParentsAndCountryMissing_LeavesParentsNull()
        {
            var region = new DestinationItem
            {
                Type = DestinationItemType.Region,
                Code = "ESBA"
            };

            var destinationItem = new DestinationItem
            {
                Type = DestinationItemType.Resort,
                Code = "ESBABA",
                Parents = new List<DestinationItem>
                {
                    region
                }
            };

            var result = Atcom.Mappers.Search.Filters.DestinationFilter.GetRegionFromDestinationItem(destinationItem);

            result.Should().BeSameAs(region);
            result.Parents.Should().BeNull();
        }

        [Fact]
        public void MapWithFilters_PromoPage_GetRegionFromDestinationItem_WhenRegionAlreadyHasParents_DoesNotOverwriteParents()
        {
            var existingParent = new DestinationItem
            {
                Type = DestinationItemType.VirtualCountry,
                Code = "ALL"
            };

            var region = new DestinationItem
            {
                Type = DestinationItemType.Region,
                Code = "ESBA",
                Parents = new List<DestinationItem> { existingParent }
            };

            var destinationItem = new DestinationItem
            {
                Type = DestinationItemType.Resort,
                Code = "ESBABA",
                Parents = new List<DestinationItem>
                {
                    region,
                    new DestinationItem
                    {
                        Type = DestinationItemType.Country,
                        Code = "ES"
                    }
                }
            };

            var result = Atcom.Mappers.Search.Filters.DestinationFilter.GetRegionFromDestinationItem(destinationItem);

            result.Should().BeSameAs(region);
            result.Parents.Should().ContainSingle();
            result.Parents.Should().ContainSingle(parent => parent.Code == "ALL" && parent.Type == DestinationItemType.VirtualCountry);
        }


        [Theory]
        [MemberData(nameof(DestinationFilterTestsData.GetRegionAndResortCodesFromDestinationsData), MemberType = typeof(DestinationFilterTestsData))]
        public void MapWithFilters_PromoPage_GetCountryAndRegionCodesFromDestinations(
            string because,
            IEnumerable<DestinationItem> destinationItems,
            HashSet<string> expectedRegionCodes,
            HashSet<string> expectedResortCodes)
        {
            HashSet<string> regionCodes;
            HashSet<string> resortCodes;
            Atcom.Mappers.Search.Filters.DestinationFilter.GetRegionAndResortCodesFromDestinations(destinationItems, out regionCodes, out resortCodes);

            regionCodes.Should().Equal(expectedRegionCodes, because);
            resortCodes.Should().Equal(expectedResortCodes, because);
        }

        [Theory]
        [MemberData(nameof(DestinationFilterTestsData.GetRegionsFromDestinationItem), MemberType = typeof(DestinationFilterTestsData))]
        public void MapWithFilters_PromoPage_GetRegionsFromDestinationItem(string because, DestinationItem destinationItem, bool isResortUnderVirtualCountry, List<string> expectedRegionCodes)
        {
            var result = Atcom.Mappers.Search.Filters.DestinationFilter.GetRegionsFromDestinationItem(destinationItem, isResortUnderVirtualCountry);

            result.Select(i => i.Code).Should().Equal(expectedRegionCodes, because);
        }

        [Theory]
        [MemberData(nameof(DestinationFilterTestsData.GetResortsFromDestinationItemData), MemberType = typeof(DestinationFilterTestsData))]
        public void MapWithFilters_PromoPage_GetResortsFromDestinationItem(string because, DestinationItem destinationItem, Dictionary<string, DestinationItem> allRegions, Dictionary<string, DestinationItem> allResorts, List<string> expectedResortCodes)
        {
            var result = Atcom.Mappers.Search.Filters.DestinationFilter.GetResortsFromDestinationItem(destinationItem, allRegions, allResorts);

            result?.Select(i => i.Code).Should().Equal(expectedResortCodes, because);
        }


        [Theory]
        [MemberData(nameof(DestinationFilterTestsData.GenerateCountryRegionMappingItem), MemberType = typeof(DestinationFilterTestsData))]
        public void MapWithFilters_PromoPage_GenerateCountryRegionMapping(string because, List<DestinationItem> destinationItems, Dictionary<string, DestinationItem> relatedRegionCodeVirtualRegionMapping, Dictionary<DestinationItem, List<DestinationItem>> expectedCountryRegionMapping)
        {
            var result = Atcom.Mappers.Search.Filters.DestinationFilter.GenerateCountryRegionMapping(destinationItems, relatedRegionCodeVirtualRegionMapping);

            string GenerateKey(KeyValuePair<DestinationItem, List<DestinationItem>> pair)
            {
                return $"{pair.Key.Code}_{string.Join("|", pair.Value.Select(i => i.Code).ToList())}";
            }

            var expectedCountryRegionMappingKeys = expectedCountryRegionMapping.Select(GenerateKey).ToList();

            result.Select(GenerateKey).Should().Equal(expectedCountryRegionMappingKeys, because);
        }

        [Theory]
        [MemberData(nameof(DestinationFilterTestsData.GenerateRegionResortMappingItem), MemberType = typeof(DestinationFilterTestsData))]
        public void MapWithFilters_PromoPage_GenerateRegionResortMapping(string because, List<DestinationItem> destinationItems, Dictionary<string, DestinationItem> allRegions, Dictionary<string, DestinationItem> allResorts, Dictionary<DestinationItem, List<DestinationItem>> expectedRegionResortMapping)
        {
            var result = Atcom.Mappers.Search.Filters.DestinationFilter.GenerateRegionResortMapping(destinationItems, allRegions, allResorts);

            string GenerateKey(KeyValuePair<DestinationItem, List<DestinationItem>> pair)
            {
                return $"{pair.Key.Code}_{string.Join("|", pair.Value.Select(i => i.Code).ToList())}";
            }

            var expectedRegionResortMappingKeys = expectedRegionResortMapping.Select(GenerateKey).ToList();

            result.Select(GenerateKey).Should().Equal(expectedRegionResortMappingKeys, because);
        }

        [Theory]
        [MemberData(nameof(DestinationFilterTestsData.MapFilterOptionsItem), MemberType = typeof(DestinationFilterTestsData))]
        public void MapWithFilters_PromoPage_MapFilterOptions(string because, Dictionary<DestinationItem, List<DestinationItem>> countryRegionMapping, HashSet<string> availableDestinationCodesByRoute, List<FilterOption> expectedCountryCodes)
        {
            var result = Atcom.Mappers.Search.Filters.DestinationFilter.MapFilterOptions(countryRegionMapping, null, availableDestinationCodesByRoute);

            result.Should().BeEquivalentTo(expectedCountryCodes, because);
        }

        [Fact]
        public void MapFilterOptions_ShouldMapTrackingId_ForParentAndChildren()
        {
            // Arrange
            var parent = new DestinationItem
            {
                Code = "ES",
                Name = "Spain",
                TrackingId = "tracking-es"
            };
            var childWithTracking = new DestinationItem
            {
                Code = "ESBA",
                Name = "Barcelona",
                TrackingId = "tracking-esba"
            };
            var childWithoutTracking = new DestinationItem
            {
                Code = "ESMJ",
                Name = "Mallorca",
                TrackingId = null
            };

            var mapping = new Dictionary<DestinationItem, List<DestinationItem>>
            {
                { parent, new List<DestinationItem> { childWithTracking, childWithoutTracking } }
            };

            // Act
            var result = Atcom.Mappers.Search.Filters.DestinationFilter.MapFilterOptions(mapping, null, new HashSet<string>());

            // Assert
            var parentOption = result.Single();
            parentOption.Code.Should().Be("ES");
            parentOption.TrackingId.Should().Be("tracking-es");

            parentOption.Children.Single(c => c.Code == "ESBA").TrackingId.Should().Be("tracking-esba");
            parentOption.Children.Single(c => c.Code == "ESMJ").TrackingId.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(DestinationFilterTestsData.ShouldShowResorts), MemberType = typeof(DestinationFilterTestsData))]
        public void ShouldShowResorts(bool expectedResult, string because, HashSet<string> countryCodes, HashSet<string> regionCodes, HashSet<string> resortCodes)
        {
            var result = Atcom.Mappers.Search.Filters.DestinationFilter.ShouldShowResorts("ALL", countryCodes, regionCodes, resortCodes);

            result.Should().Be(expectedResult, because);
        }

        [Theory]
        [MemberData(nameof(DestinationFilterTestsData.ShouldShowResortsOriginalGeography), MemberType = typeof(DestinationFilterTestsData))]
        public void ShouldShowResorts_IfPassOriginalGeography(bool expectedResult, string because, string originalGeography)
        {
            var result = Atcom.Mappers.Search.Filters.DestinationFilter.ShouldShowResorts(null, originalGeography);

            result.Should().Be(expectedResult, because);
        }

        [Theory]
        [MemberData(nameof(DestinationFilterTestsData.BuildCodeDestinationMappingData), MemberType = typeof(DestinationFilterTestsData))]
        public void BuildCodeDestinationMapping_ReturnsCorrectMapping(string because, List<DestinationItem> allDestinations, DestinationItemType destinationItemType, Dictionary<string, string> expectedCodes)
        {
            // Act
            var result = Atcom.Mappers.Search.Filters.DestinationFilter.BuildCodeDestinationMapping(allDestinations, destinationItemType);

            // Assert
            result.Keys.Should().BeEquivalentTo(expectedCodes.Keys, because);
            foreach (var key in expectedCodes.Keys)
            {
                result[key].Code.Should().Be(expectedCodes[key], because);
            }
        }

        [Fact]
        public async Task FilterBy_WithVirtualResort_FiltersOutVirtualResort()
        {
            // Arrange
            var sut = CreateFilterWithDestinations(
                CreateHotel("HOTEL1", "ESBA"),
                CreateVirtualResort("VRESORT1", "RESORT1", "RESORT2")
            );

            var originalSet = CreateOfferSet("HOTEL1");
            var request = new PackagesSearchRequest
            {
                Geography = "ES,ESBA",
                AccomCodes = "HOTEL1,VRESORT1"
            };

            // Act
            var result = await sut.FilterBy(originalSet, request);

            // Assert
            result.Should().HaveCount(1);
            result[0].Accom.First().Code.Should().Be("HOTEL1");
        }

        [Fact]
        public async Task FilterBy_WithVirtualCountryAndVirtualRegion_FiltersThemOut()
        {
            // Arrange
            var sut = CreateFilterWithDestinations(
                CreateHotel("HOTEL1", "ESBA"),
                CreateVirtualCountry("VCOUNTRY1", "REGION1", "REGION2"),
                CreateVirtualRegion("VREGION1", "REGION3", "REGION4"),
                CreateVirtualResort("VRESORT1", "RESORT1", "RESORT2")
            );

            var originalSet = CreateOfferSet("HOTEL1");
            var request = new PackagesSearchRequest
            {
                Geography = "ES,ESBA",
                AccomCodes = "HOTEL1,VCOUNTRY1,VREGION1,VRESORT1"
            };

            // Act
            var result = await sut.FilterBy(originalSet, request);

            // Assert
            result.Should().HaveCount(1);
            result[0].Accom.First().Code.Should().Be("HOTEL1");
        }

        [Fact]
        public async Task FilterBy_WithOnlyVirtualResort_ReturnsEmptyList()
        {
            // Arrange
            var sut = CreateFilterWithDestinations(
                CreateVirtualResort("VRESORT1", "RESORT1", "RESORT2")
            );

            var originalSet = CreateOfferSet("VRESORT1");
            var request = new PackagesSearchRequest
            {
                Geography = "ES,ESBA",
                AccomCodes = "VRESORT1"
            };

            // Act
            var result = await sut.FilterBy(originalSet, request);

            // Assert
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task FilterBy_WithMixedDestinationTypes_OnlyKeepsNonVirtualTypes()
        {
            // Arrange
            var sut = CreateFilterWithDestinations(
                CreateHotel("HOTEL1", "ESBA"),
                CreateResort("RESORT1", "ESBA"),
                CreateVirtualResort("VRESORT1", "RESORT1", "RESORT2"),
                CreateRegion("REGION1", "ES")
            );

            var originalSet = CreateOfferSet("HOTEL1", "RESORT1");
            var request = new PackagesSearchRequest
            {
                Geography = "ES,ESBA",
                AccomCodes = "HOTEL1,RESORT1,VRESORT1,REGION1"
            };

            // Act
            var result = await sut.FilterBy(originalSet, request);

            // Assert
            result.Should().HaveCount(2);
            result.Select(x => x.Accom.First().Code).Should().Contain(new[] { "HOTEL1", "RESORT1" });
        }

        [Fact]
        public async Task FilterBy_WithVirtualResortNullRelatedResorts_HandlesGracefully()
        {
            // Arrange
            var sut = CreateFilterWithDestinations(
                CreateHotel("HOTEL1", "ESBA"),
                new DestinationItem
                {
                    Code = "VRESORT_NULL",
                    Type = DestinationItemType.VirtualResort,
                    RelatedResorts = null
                }
            );

            var originalSet = CreateOfferSet("HOTEL1");
            var request = new PackagesSearchRequest
            {
                Geography = "ES,ESBA",
                AccomCodes = "HOTEL1,VRESORT_NULL"
            };

            // Act
            var result = await sut.FilterBy(originalSet, request);

            // Assert - Should not throw and should return the hotel
            result.Should().HaveCount(1);
            result[0].Accom.First().Code.Should().Be("HOTEL1");
        }
    }

    public class DestinationFilterTestsData
    {
        public static IEnumerable<object[]> GetOptionsGeneralData()
        {
            yield return new object[]
            {
                new PackagesSearchRequest
                {
                    PromoPageId = null,
                    AccomCodes = null,
                    Geography = "ES",
                    OriginalGeography = "ES"

                },
                new FilterOptions
                {
                    Name = Atcom.Mappers.Search.Filters.DestinationFilter.DestinationVariantFilterName,
                    Options = new List<FilterOption>{ new FilterOption { Code = "ES" } }
                }
            };

            yield return new object[]
            {
                new PackagesSearchRequest
                {
                    PromoPageId = null,
                    AccomCodes = null,
                    Geography = "ES,ESBA",
                    OriginalGeography = "ES,ESBA"

                },
                new FilterOptions
                {
                    Name = Atcom.Mappers.Search.Filters.DestinationFilter.RegionVariantFilterName,
                    Options = new List<FilterOption>{ new FilterOption { Code = "ESBA" } }
                }
            };

            yield return new object[]
            {
                new PackagesSearchRequest
                {
                    PromoPageId = null,
                    AccomCodes = null,
                    Geography = "ES,ESBA",
                    OriginalGeography = "ES"

                },
                new FilterOptions
                {
                    Name = Atcom.Mappers.Search.Filters.DestinationFilter.DestinationVariantFilterName,
                    Options = new List<FilterOption>{ new FilterOption { Code = "ES" } }
                }
            };
        }

        public static IEnumerable<object[]> GetOptionsPromoData()
        {
            yield return new object[]
            {
                new PackagesSearchRequest
                {
                    PromoPageId = "isPromo",

                },
                new List<DestinationItem>
                {
                    new DestinationItem
                    {
                        Code = "ES",
                        Name = "Spain",
                        Available = true,
                        AirportCodes = new[] { "ES" },
                        Type = DestinationItemType.Country
                    }
                },
                new FilterOptions
                {
                    Name = Atcom.Mappers.Search.Filters.DestinationFilter.DestinationVariantFilterName,
                    Options = new List<FilterOption>{ new FilterOption { Code = "ES" } }
                }
            };
            yield return new object[]
            {
                new PackagesSearchRequest
                {
                    PromoPageId = "isPromo",

                },
                new List<DestinationItem>
                {
                    new DestinationItem
                    {
                        Code = "ESBA",
                        Name = "Barcelona",
                        Available = true,
                        AirportCodes = new[] { "ESBA" },
                        Type = DestinationItemType.Region
                    }
                },
                new FilterOptions
                {
                    Name = Atcom.Mappers.Search.Filters.DestinationFilter.RegionVariantFilterName,
                    Options = new List<FilterOption>{ new FilterOption { Code = "ESBA" } }
                }
            };
        }

        public static IEnumerable<object[]> ExtractDatesFromRequestData()
        {
            yield return new object[] {
                "No Start no end date no duration",
                new PackagesSearchRequest() {
                },
                null,
                null,
                null
            };

            yield return new object[] {
                "Start and end date no duration",
                new PackagesSearchRequest() {
                    StartDate = "2022-11-25",
                    EndDate = "2023-01-31"
                },
                DateTime.Parse("2022-11-25", CultureInfo.InvariantCulture),
                DateTime.Parse("2023-01-31", CultureInfo.InvariantCulture),
                null
            };

            yield return new object[] {
                "Start and duration",
                new PackagesSearchRequest() {
                    StartDate = "2022-11-25",
                    Duration = new List<int>(1) {3}
                },
                DateTime.Parse("2022-11-25", CultureInfo.InvariantCulture),
                DateTime.Parse("2022-11-28", CultureInfo.InvariantCulture),
                3
            };

            yield return new object[] {
                "Start and multiple duration",
                new PackagesSearchRequest() {
                    StartDate = "2022-11-25",
                    Duration = new List<int>(3) {3, 5, 9}
                },
                DateTime.Parse("2022-11-25", CultureInfo.InvariantCulture),
                DateTime.Parse("2022-11-28", CultureInfo.InvariantCulture),
                3
            };

            yield return new object[] {
                "Start and no end date no duration",
                new PackagesSearchRequest() {
                    StartDate = "2022-11-25",
                },
                DateTime.Parse("2022-11-25", CultureInfo.InvariantCulture),
                null,
                null
            };
        }

        public static IEnumerable<object[]> IsDestinationReachableData()
        {
            yield return new object[] {
                "No available destinations",
                null,
                null,
                false
            };

            yield return new object[] {
                "Single destination in available list",
                new DestinationItem()
                {
                    Type = DestinationItemType.Country,
                    Code = "CY",
                },
                new HashSet<string>() {"CY"},
                true
            };

            yield return new object[] {
                "Single destination not in available list",
                new DestinationItem()
                {
                    Type = DestinationItemType.Country,
                    Code = "CY",
                },
                new HashSet<string>() {"XX"},
                false
            };

            yield return new object[] {
                "Virtual country in available list",
                new DestinationItem()
                {
                    Type = DestinationItemType.VirtualCountry,
                    Code = "CY",
                    RelatedRegions = new []{"AA", "AB", "AC"}
                },
                new HashSet<string>() {"AB"},
                true
            };

            yield return new object[] {
                "Virtual country not in available list",
                new DestinationItem()
                {
                    Type = DestinationItemType.VirtualCountry,
                    Code = "CY",
                    RelatedRegions = new []{"AA", "AB", "AC"}
                },
                new HashSet<string>() {"XX"},
                false
            };

            yield return new object[] {
                "Virtual resort with RelatedResorts in available list",
                new DestinationItem()
                {
                    Type = DestinationItemType.VirtualResort,
                    Code = "VRESORT1",
                    RelatedResorts = new []{"RESORT1", "RESORT2", "RESORT3"}
                },
                new HashSet<string>() {"RESORT2"},
                true
            };

            yield return new object[] {
                "Virtual resort with all RelatedResorts in available list",
                new DestinationItem()
                {
                    Type = DestinationItemType.VirtualResort,
                    Code = "VRESORT2",
                    RelatedResorts = new []{"RESORT1", "RESORT2"}
                },
                new HashSet<string>() {"RESORT1", "RESORT2", "RESORT3"},
                true
            };

            yield return new object[] {
                "Virtual resort with no RelatedResorts in available list",
                new DestinationItem()
                {
                    Type = DestinationItemType.VirtualResort,
                    Code = "VRESORT3",
                    RelatedResorts = new []{"RESORT1", "RESORT2", "RESORT3"}
                },
                new HashSet<string>() {"RESORT4", "RESORT5"},
                false
            };

            yield return new object[] {
                "Virtual resort with null RelatedResorts",
                new DestinationItem()
                {
                    Type = DestinationItemType.VirtualResort,
                    Code = "VRESORT4",
                    RelatedResorts = null
                },
                new HashSet<string>() {"RESORT1", "RESORT2"},
                false
            };

            yield return new object[] {
                "Virtual resort with empty RelatedResorts",
                new DestinationItem()
                {
                    Type = DestinationItemType.VirtualResort,
                    Code = "VRESORT5",
                    RelatedResorts = Array.Empty<string>()
                },
                new HashSet<string>() {"RESORT1", "RESORT2"},
                false
            };

            yield return new object[] {
                "Virtual resort with null available destinations",
                new DestinationItem()
                {
                    Type = DestinationItemType.VirtualResort,
                    Code = "VRESORT6",
                    RelatedResorts = new []{"RESORT1", "RESORT2"}
                },
                null,
                false
            };
        }

        public static IEnumerable<object[]> ShouldShowResorts()
        {
            yield return new object[]
            {
                false,
                "Single country",
                new HashSet<string>() { "ES" },
                new HashSet<string>() { },
                new HashSet<string>() { }
            };
            yield return new object[]
            {
                false,
                "Multiple countries",
                new HashSet<string>() { "ES", "GB" },
                new HashSet<string>() { },
                new HashSet<string>() { }
            };
            yield return new object[]
            {
                false,
                "All destinations",
                new HashSet<string>() { "ALL" },
                new HashSet<string>() { },
                new HashSet<string>() { }
            };
            yield return new object[]
            {
                true,
                "Single region",
                new HashSet<string>() { "ES" },
                new HashSet<string>() { "ESBA" },
                new HashSet<string>() { }
            };
            yield return new object[]
            {
                true,
                "Multiple regions, same country",
                new HashSet<string>() { "ES" },
                new HashSet<string>() { "ESBA", "ESCY" },
                new HashSet<string>() { }
            };
            yield return new object[]
            {
                false,
                "Multiple regions, different countries",
                new HashSet<string>() { "ES", "GB" },
                new HashSet<string>() { "ESBA", "GBSC" },
                new HashSet<string>() { }
            };
            yield return new object[]
            {
                true,
                "Single resort",
                new HashSet<string>() { "ES" },
                new HashSet<string>() { "ESBA" },
                new HashSet<string>() { "ESBABA" }
            };
            yield return new object[]
            {
                true,
                "Multiple resorts, same region",
                new HashSet<string>() { "ES" },
                new HashSet<string>() { "ESMJ" },
                new HashSet<string>() { "ESMJCO", "ESMJCB" }
            };
            yield return new object[]
            {
                true,
                "Multiple resorts, different regions, same country",
                new HashSet<string>() { "ES" },
                new HashSet<string>() { "ESBA", "ESMJ" },
                new HashSet<string>() { "ESBABA", "ESMJCB" }
            };
            yield return new object[]
            {
                true,
                "Multiple resorts, different regions, different countries",
                new HashSet<string>() { "ES", "IT" },
                new HashSet<string>() { "ESBA", "ITSI" },
                new HashSet<string>() { "ESBABA", "ITSICE" }
            };
        }

        public static IEnumerable<object[]> IsCountryLevelSearch()
        {
            yield return new object[]
            {
                true,
                "Single country",
                new string[] { "country:ES" },
            };
            yield return new object[]
            {
                true,
                "Multiple countries",
                new string[] { "country:ES", "country:IT" },
            };
            yield return new object[]
            {
                false,
                "Empty destinations",
                new string[] { },
            };
            yield return new object[]
            {
                false,
                "Single region",
                new string[] { "region:ES" },
            };
            yield return new object[]
            {
                true,
                "Virtual country",
                new string[] { "virtualcountry:VGBEN" },
            };
        }

        public static IEnumerable<object[]> ShouldShowResortsOriginalGeography()
        {
            yield return new object[]
            {
                false,
                "Single country",
                "ES"
            };
            yield return new object[]
            {
                false,
                "Multiple countries",
                "ES|GB",
            };
            yield return new object[]
            {
                false,
                "All destinations",
                "ALL"
            };
            yield return new object[]
            {
                true,
                "Single region",
                "ES,ESBA"
            };
            yield return new object[]
            {
                true,
                "Multiple regions, same country",
                "ES,ESBA|ESCY"
            };
            yield return new object[]
            {
                false,
                "Multiple regions, different countries",
                "ES|GB,ESBA|GBSC"
            };
            yield return new object[]
            {
                true,
                "Single resort",
                "ES,ESBA,ESBABA"
            };
            yield return new object[]
            {
                true,
                "Multiple resorts, same region",
                "ES,ESMJ,ESMJCO|ESMJCB"
            };
            yield return new object[]
            {
                true,
                "Multiple resorts, different regions, same country",
                "ES,ESBA|ESMJ,ESBABA|ESMJCB",
            };
            yield return new object[]
            {
                true,
                "Multiple resorts, different regions, different countries",
                "ES|IT,ESBA|ITSI,ESBABA|ITSICE"
            };
        }

        public static IEnumerable<object[]> GetRegionFromDestinationItemData()
        {
            yield return new object[] {
                "Country",
                new DestinationItem()
                {
                    Type = DestinationItemType.Country,
                    Code = "ES",
                },
                null
            };

            yield return new object[] {
                "Virtual country",
                new DestinationItem()
                {
                    Type = DestinationItemType.VirtualCountry,
                    Code = "ES",
                },
                null
            };

            yield return new object[] {
                "Region",
                new DestinationItem()
                {
                    Type = DestinationItemType.Region,
                    Code = "ESBA",
                },
                "ESBA"
            };

            yield return new object[] {
                "Virtual region",
                new DestinationItem()
                {
                    Type = DestinationItemType.VirtualRegion,
                    Code = "ESBA",
                },
                "ESBA"
            };

            yield return new object[] {
                "Resort",
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "ESBABA",
                    Parents = new List<DestinationItem>
                    {
                        new DestinationItem
                        {
                            Code = "ESBA",
                            Type = DestinationItemType.Region
                        }
                    }
                },
                "ESBA"
            };
        }

        public static IEnumerable<object[]> GetCountryFromDestinationItemData()
        {
            yield return new object[] {
                "Country",
                new DestinationItem()
                {
                    Type = DestinationItemType.Country,
                    Code = "CY",
                },
                new Dictionary<string, DestinationItem>(),
                "CY"
            };

            yield return new object[] {
                "Virtual Country",
                new DestinationItem()
                {
                    Type = DestinationItemType.VirtualCountry,
                    Code = "CY",
                },
                new Dictionary<string, DestinationItem>(),
                "CY"
            };

            yield return new object[] {
                "region, parent is country",
                new DestinationItem()
                {
                    Type = DestinationItemType.Region,
                    Code = "A_AA",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Country,
                            Code = "A"
                        }
                    }
                },
                new Dictionary<string, DestinationItem>(),
                "A"
            };

            yield return new object[] {
                "region, parent is virtual country",
                new DestinationItem()
                {
                    Type = DestinationItemType.Region,
                    Code = "A_AA",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.VirtualCountry,
                            Code = "A"
                        }
                    }
                },
                new Dictionary<string, DestinationItem>(),
                "A"
            };
        }

        public static IEnumerable<object[]> GetRegionAndResortCodesFromDestinationsData()
        {
            yield return new object[] {
                "Region and Resort",
                new List<DestinationItem>()
                {
                    new DestinationItem()
                    {
                        Type = DestinationItemType.Hotel,
                        Code = "Hotel_A",
                        Parents = new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Type = DestinationItemType.Region,
                                Code = "Region_A"
                            }
                        }
                    },
                    new DestinationItem()
                    {
                        Type = DestinationItemType.Resort,
                        Code = "Hotel_B",
                        Parents = new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Type = DestinationItemType.Resort,
                                Code = "Resort_B"
                            },
                            new DestinationItem()
                            {
                                Type = DestinationItemType.Region,
                                Code = "Region_B"
                            }
                        }
                    },
                },
                new HashSet<string>(){ "Region_A", "Region_B" },
                new HashSet<string>(){ "Resort_B" }
            };
        }

        public static IEnumerable<object[]> GetRegionsFromDestinationItem()
        {
            yield return new object[] {
                "Region",
                new DestinationItem()
                {
                    Type = DestinationItemType.Region,
                    Code = "Region_AA",
                    RelatedRegions = Array.Empty<string>(),
                },
                false,
                new List<string>(1){ "Region_AA" }
            };

            yield return new object[] {
                "Virtual Region",
                new DestinationItem()
                {
                    Type = DestinationItemType.VirtualRegion,
                    Code = "VirtualRegion_AA",
                    RelatedRegions = new []{"Region_AA", "Region_BB"},
                },
                false,
                new List<string>() { "VirtualRegion_AA" }
            };

            yield return new object[] {
                "Country",
                new DestinationItem()
                {
                    Type = DestinationItemType.Country,
                    Code = "Country_AA",
                    Children = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "Region_AA",
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "Region_AB",
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "Region_AC",
                        }
                    }
                },
                false,
                new List<string>() { "Region_AA", "Region_AB", "Region_AC" }
            };

            yield return new object[] {
                "VirtualCountry",
                new DestinationItem()
                {
                    Type = DestinationItemType.VirtualCountry,
                    Code = "VirtualCountry_AA",
                    Children = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "Region_AA",
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "Region_AB",
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "Region_AC",
                        }
                    }
                },
                false,
                new List<string>() { "Region_AA", "Region_AB", "Region_AC" }
            };

            yield return new object[] {
                "Resort with no parent region",
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "Resort_AA",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Country,
                            Code = "Country_AA",
                        }
                    }
                },
                false,
                new List<string>() { }
            };

            yield return new object[] {
                "Resort",
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "Resort_AA",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Region,
                            Code = "Region_AA",
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Country,
                            Code = "Country_AA",
                        }
                    }
                },
                false,
                new List<string>() { "Region_AA" }
            };

            yield return new object[] {
                "Resort with virtual region parent",
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "Resort_AA",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Type = DestinationItemType.VirtualRegion,
                            Code = "VirtualRegion_AA",
                            RelatedRegions = new []{"Region_AA", "Region_BB"},
                        },
                        new DestinationItem()
                        {
                            Type = DestinationItemType.Country,
                            Code = "Country_AA",
                        }
                    }
                },
                false,
                new List<string>() { "VirtualRegion_AA" }
            };
        }

        public static IEnumerable<object[]> GetResortsFromDestinationItemData()
        {
            yield return new object[]
            {
                "Country",
                new DestinationItem
                {
                    Code = "ES",
                    Type = DestinationItemType.Country
                },
                new Dictionary<string, DestinationItem>(),
                new Dictionary<string, DestinationItem>(),
                null
            };

            yield return new object[]
            {
                "Virtual country",
                new DestinationItem
                {
                    Code = "ES",
                    Type = DestinationItemType.VirtualCountry
                },
                new Dictionary<string, DestinationItem>(),
                new Dictionary<string, DestinationItem>(),
                null
            };

            yield return new object[]
            {
                "Region",
                new DestinationItem
                {
                    Code = "ESBA",
                    Type = DestinationItemType.Region,
                    Children = new List<DestinationItem>()
                    {
                        new DestinationItem
                        {
                            Code = "ESBABA"
                        }
                    }
                },
                new Dictionary<string, DestinationItem>(),
                new Dictionary<string, DestinationItem>(),
                new List<string> { "ESBABA" }
            };

            yield return new object[]
            {
                "Virtual region",
                new DestinationItem
                {
                    Code = "VCBA",
                    Type = DestinationItemType.VirtualRegion,
                    RelatedRegions = new string[] { "ESBA" }
                },
                new Dictionary<string, DestinationItem>
                {
                    {
                        "ESBA",
                        new DestinationItem
                        {
                            Code = "ESBA"
                        }
                    }
                },
                new Dictionary<string, DestinationItem>(),
                new List<string> { "ESBA" }
            };

            yield return new object[]
            {
                "Virtual region with empty RelatedRegions",
                new DestinationItem
                {
                    Code = "VCBA_EMPTY",
                    Type = DestinationItemType.VirtualRegion,
                    RelatedRegions = Array.Empty<string>()
                },
                new Dictionary<string, DestinationItem>(),
                new Dictionary<string, DestinationItem>(),
                new List<string>()
            };

            yield return new object[]
            {
                "Resort",
                new DestinationItem
                {
                    Code = "ESBABA",
                    Type = DestinationItemType.Resort,
                },
                new Dictionary<string, DestinationItem>(),
                new Dictionary<string, DestinationItem>(),
                new List<string> { "ESBABA" }
            };

            yield return new object[]
            {
                "Virtual resort",
                new DestinationItem
                {
                    Code = "VRESORT1",
                    Type = DestinationItemType.VirtualResort,
                    RelatedResorts = new string[] { "RESORT1", "RESORT2" }
                },
                new Dictionary<string, DestinationItem>(),
                new Dictionary<string, DestinationItem>
                {
                    {
                        "RESORT1",
                        new DestinationItem
                        {
                            Code = "RESORT1"
                        }
                    },
                    {
                        "RESORT2",
                        new DestinationItem
                        {
                            Code = "RESORT2"
                        }
                    }
                },
                new List<string> { "RESORT1", "RESORT2" }
            };

            yield return new object[]
            {
                "Virtual resort with null RelatedResorts",
                new DestinationItem
                {
                    Code = "VRESORT2",
                    Type = DestinationItemType.VirtualResort,
                    RelatedResorts = null
                },
                new Dictionary<string, DestinationItem>(),
                new Dictionary<string, DestinationItem>(),
                new List<string>()
            };

            yield return new object[]
            {
                "Virtual resort with empty RelatedResorts",
                new DestinationItem
                {
                    Code = "VRESORT3",
                    Type = DestinationItemType.VirtualResort,
                    RelatedResorts = Array.Empty<string>()
                },
                new Dictionary<string, DestinationItem>(),
                new Dictionary<string, DestinationItem>(),
                new List<string>()
            };
        }

        public static IEnumerable<object[]> GenerateCountryRegionMappingItem()
        {
            yield return new object[] {
                "Two Countries",
                new List<DestinationItem>()
                {
                    new DestinationItem()
                    {
                        Type = DestinationItemType.Country,
                        Code = "Country_AA",
                        Children = new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Type = DestinationItemType.Region,
                                Code = "Region_AA",
                            },
                        },
                    },
                    new DestinationItem()
                    {
                        Type = DestinationItemType.Country,
                        Code = "Country_AA",
                        Children = new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Type = DestinationItemType.Region,
                                Code = "Region_AB",
                            },
                        },
                    },
                    new DestinationItem()
                    {
                        Type = DestinationItemType.Country,
                        Code = "Country_BA",
                        Children = new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Type = DestinationItemType.Region,
                                Code = "Region_BA",
                            },
                            new DestinationItem()
                            {
                                Type = DestinationItemType.Region,
                                Code = "Region_BB",
                            },
                        },
                    },
                },
                new Dictionary<string, DestinationItem>(),
                new Dictionary<DestinationItem, List<DestinationItem>>()
                {
                    {
                        new DestinationItem(){Code = "Country_AA" },
                        new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Code = "Region_AA"
                            },
                            new DestinationItem()
                            {
                                Code = "Region_AB"
                            }
                        }
                    },
                    {
                        new DestinationItem(){Code = "Country_BA" },
                        new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Code = "Region_BA"
                            },
                            new DestinationItem()
                            {
                                Code = "Region_BB"
                            }
                        }
                    },
                }
            };
        }

        public static IEnumerable<object[]> GenerateRegionResortMappingItem()
        {
            yield return new object[] {
                "Region with two resorts",
                new List<DestinationItem>
                {
                    new DestinationItem
                    {
                        Code = "Region_A",
                        Type = DestinationItemType.Region,
                        Children = new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Code = "Resort_A_A"
                            },
                            new DestinationItem
                            {
                                Code = "Resort_A_B"
                            }
                        }
                    }
                },
                new Dictionary<string, DestinationItem> (),
                new Dictionary<string, DestinationItem> (),
                new Dictionary<DestinationItem, List<DestinationItem>>
                {
                    {
                        new DestinationItem
                        {
                            Code = "Region_A"
                        },
                        new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Code = "Resort_A_A"
                            },
                            new DestinationItem
                            {
                                Code = "Resort_A_B"
                            }
                        }
                    }
                }
            };

            yield return new object[] {
                "Resort",
                new List<DestinationItem>
                {
                    new DestinationItem
                    {
                        Code = "Resort_B_A",
                        Type = DestinationItemType.Resort,
                        Parents = new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Code = "Region_B",
                                Type = DestinationItemType.Region
                            }
                        }
                    }
                },
                new Dictionary<string, DestinationItem>(),
                new Dictionary<string, DestinationItem>(),
                new Dictionary<DestinationItem, List<DestinationItem>>
                {
                    {
                        new DestinationItem
                        {
                            Code = "Region_B"
                        },
                        new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Code = "Resort_B_A"
                            }
                        }
                    }
                }
            };

            yield return new object[] {
                "Virtual region",
                new List<DestinationItem>
                {
                    new DestinationItem
                    {
                        Code = "VirtualRegion_C",
                        Type = DestinationItemType.VirtualRegion,
                        RelatedRegions = new string[] { "Region_C" }
                    }
                },
                new Dictionary<string, DestinationItem>
                {
                    {
                        "Region_C",
                        new DestinationItem
                        {
                            Code = "Region_C",
                            Type = DestinationItemType.Region,
                        }
                    }
                },
                new Dictionary<string, DestinationItem>(),
                new Dictionary<DestinationItem, List<DestinationItem>>
                {
                    {
                        new DestinationItem
                        {
                            Code = "VirtualRegion_C"
                        },
                        new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Code = "Region_C"
                            }
                        }
                    }
                }
            };

            yield return new object[] {
                "Virtual resort",
                new List<DestinationItem>
                {
                    new DestinationItem
                    {
                        Code = "VirtualResort_D",
                        Type = DestinationItemType.VirtualResort,
                        RelatedResorts = new string[] { "Resort_D_A", "Resort_D_B" },
                        Parents = new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Code = "Region_D",
                                Type = DestinationItemType.Region
                            }
                        }
                    }
                },
                new Dictionary<string, DestinationItem>(),
                new Dictionary<string, DestinationItem>
                {
                    {
                        "Resort_D_A",
                        new DestinationItem
                        {
                            Code = "Resort_D_A",
                            Type = DestinationItemType.Resort
                        }
                    },
                    {
                        "Resort_D_B",
                        new DestinationItem
                        {
                            Code = "Resort_D_B",
                            Type = DestinationItemType.Resort
                        }
                    }
                },
                new Dictionary<DestinationItem, List<DestinationItem>>
                {
                    {
                        new DestinationItem
                        {
                            Code = "Region_D"
                        },
                        new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Code = "Resort_D_A"
                            },
                            new DestinationItem
                            {
                                Code = "Resort_D_B"
                            }
                        }
                    }
                }
            };
        }

        public static IEnumerable<object[]> MapFilterOptionsItem()
        {
            yield return new object[] {
                "Multiple regions",
                new Dictionary<DestinationItem, List<DestinationItem>>()
                {
                    {
                        new DestinationItem()
                        {
                            Code = "Country_AA",
                            Name = "Country A",
                        },
                        new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Code = "Region_AA",
                                Name = "Region AA"
                            },
                            new DestinationItem()
                            {
                                Code = "Region_AB",
                                Name = "Region AB"
                            }
                        }
                    },
                    {
                        new DestinationItem()
                        {
                            Code = "Country_BA",
                            Name = "Country B"
                        },
                        new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Code = "Region_BA",
                                Name = "Region BA"
                            },
                            new DestinationItem()
                            {
                                Code = "Region_BB",
                                Name = "Region BB"
                            }
                        }
                    },
                },
                new HashSet<string>(){ "Region_AA", "Region_BB" },
                new List<FilterOption>()
                {
                    new FilterOption()
                    {
                        Name = "Country A",
                        Code = "Country_AA",
                        Count = 1,
                        DestinationInfo = new DestinationFilterInfo(),
                        Children = new List<FilterOption>(2)
                        {
                            new FilterOption()
                            {
                                Name = "Region AA",
                                Code = "Region_AA",
                                Count = 1,
                                DestinationInfo = new DestinationFilterInfo(),
                            },
                            new FilterOption()
                            {
                                Name = "Region AB",
                                Code = "Region_AB",
                                Count = 0,
                                DestinationInfo = new DestinationFilterInfo(),
                            }
                        }
                    },
                    new FilterOption()
                    {
                        Name = "Country B",
                        Code = "Country_BA",
                        Count = 1,
                        DestinationInfo = new DestinationFilterInfo(),
                        Children = new List<FilterOption>(2)
                        {
                            new FilterOption()
                            {
                                Name = "Region BA",
                                Code = "Region_BA",
                                Count = 0,
                                DestinationInfo = new DestinationFilterInfo(),
                            },
                            new FilterOption()
                            {
                                Name = "Region BB",
                                Code = "Region_BB",
                                Count = 1,
                                DestinationInfo = new DestinationFilterInfo(),
                            }
                        }
                    }
                }
            };
        }

        public static IEnumerable<object[]> BuildCodeDestinationMappingData()
        {
            yield return new object[]
            {
                "Empty list returns empty dictionary",
                new List<DestinationItem>(),
                DestinationItemType.Region,
                new Dictionary<string, string>()
            };

            yield return new object[]
            {
                "Countries with no children return empty dictionary",
                new List<DestinationItem>
                {
                    new DestinationItem
                    {
                        Code = "ES",
                        Type = DestinationItemType.Country,
                        Children = null
                    },
                    new DestinationItem
                    {
                        Code = "IT",
                        Type = DestinationItemType.Country,
                        Children = null
                    }
                },
                DestinationItemType.Region,
                new Dictionary<string, string>()
            };

            yield return new object[]
            {
                "Countries with regions returns region mapping",
                new List<DestinationItem>
                {
                    new DestinationItem
                    {
                        Code = "ES",
                        Type = DestinationItemType.Country,
                        Children = new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Code = "ESBA",
                                Type = DestinationItemType.Region,
                                Name = "Barcelona"
                            },
                            new DestinationItem
                            {
                                Code = "ESMJ",
                                Type = DestinationItemType.Region,
                                Name = "Mallorca"
                            }
                        }
                    },
                    new DestinationItem
                    {
                        Code = "IT",
                        Type = DestinationItemType.Country,
                        Children = new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Code = "ITSI",
                                Type = DestinationItemType.Region,
                                Name = "Sicily"
                            }
                        }
                    }
                },
                DestinationItemType.Region,
                new Dictionary<string, string>
                {
                    { "ESBA", "ESBA" },
                    { "ESMJ", "ESMJ" },
                    { "ITSI", "ITSI" }
                }
            };

            yield return new object[]
            {
                "Countries with resorts returns resort mapping",
                new List<DestinationItem>
                {
                    new DestinationItem
                    {
                        Code = "ES",
                        Type = DestinationItemType.Country,
                        Children = new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Code = "ESBABA",
                                Type = DestinationItemType.Resort,
                                Name = "Barcelona Beach"
                            },
                            new DestinationItem
                            {
                                Code = "ESMJPM",
                                Type = DestinationItemType.Resort,
                                Name = "Palma"
                            }
                        }
                    }
                },
                DestinationItemType.Resort,
                new Dictionary<string, string>
                {
                    { "ESBABA", "ESBABA" },
                    { "ESMJPM", "ESMJPM" }
                }
            };

            yield return new object[]
            {
                "Filters only specified type",
                new List<DestinationItem>
                {
                    new DestinationItem
                    {
                        Code = "ES",
                        Type = DestinationItemType.Country,
                        Children = new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Code = "ESBA",
                                Type = DestinationItemType.Region,
                                Name = "Barcelona"
                            },
                            new DestinationItem
                            {
                                Code = "ESBABA",
                                Type = DestinationItemType.Resort,
                                Name = "Barcelona Beach"
                            },
                            new DestinationItem
                            {
                                Code = "HOTEL001",
                                Type = DestinationItemType.Hotel,
                                Name = "Hotel Barcelona"
                            }
                        }
                    }
                },
                DestinationItemType.Region,
                new Dictionary<string, string>
                {
                    { "ESBA", "ESBA" }
                }
            };

            yield return new object[]
            {
                "Handles null children in list",
                new List<DestinationItem>
                {
                    new DestinationItem
                    {
                        Code = "ES",
                        Type = DestinationItemType.Country,
                        Children = new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Code = "ESBA",
                                Type = DestinationItemType.Region,
                                Name = "Barcelona"
                            },
                            null,
                            new DestinationItem
                            {
                                Code = "ESMJ",
                                Type = DestinationItemType.Region,
                                Name = "Mallorca"
                            }
                        }
                    }
                },
                DestinationItemType.Region,
                new Dictionary<string, string>
                {
                    { "ESBA", "ESBA" },
                    { "ESMJ", "ESMJ" }
                }
            };

            yield return new object[]
            {
                "Multiple countries flattens all children",
                new List<DestinationItem>
                {
                    new DestinationItem
                    {
                        Code = "ES",
                        Type = DestinationItemType.Country,
                        Children = new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Code = "ESBA",
                                Type = DestinationItemType.Region
                            }
                        }
                    },
                    new DestinationItem
                    {
                        Code = "IT",
                        Type = DestinationItemType.Country,
                        Children = new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Code = "ITSI",
                                Type = DestinationItemType.Region
                            }
                        }
                    },
                    new DestinationItem
                    {
                        Code = "FR",
                        Type = DestinationItemType.Country,
                        Children = new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Code = "FRPA",
                                Type = DestinationItemType.Region
                            }
                        }
                    }
                },
                DestinationItemType.Region,
                new Dictionary<string, string>
                {
                    { "ESBA", "ESBA" },
                    { "ITSI", "ITSI" },
                    { "FRPA", "FRPA" }
                }
            };

            yield return new object[]
            {
                "Includes VirtualRegion when filtering by Region type",
                new List<DestinationItem>
                {
                    new DestinationItem
                    {
                        Code = "ES",
                        Type = DestinationItemType.Country,
                        Children = new List<DestinationItem>
                        {
                            new DestinationItem
                            {
                                Code = "ESBA",
                                Type = DestinationItemType.Region
                            },
                            new DestinationItem
                            {
                                Code = "VREGION1",
                                Type = DestinationItemType.VirtualRegion
                            }
                        }
                    }
                },
                DestinationItemType.Region,
                new Dictionary<string, string>
                {
                    { "ESBA", "ESBA" }
                }
            };
        }
    }
}
