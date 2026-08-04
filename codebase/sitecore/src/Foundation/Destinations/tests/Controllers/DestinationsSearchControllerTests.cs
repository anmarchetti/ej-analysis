using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Queries;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Controllers;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Domain.Muzement;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using Newtonsoft.Json;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Controllers
{
    public class DestinationsSearchControllerTests
    {
        private readonly DestinationsSearchController destinationsSearchController;
        private readonly IDestinationsRepository mockRepository;
        private readonly IHotelFacilitiesService facilitiesService;
        private readonly IDestinationsSearchService searchService;
        private readonly IDestinationsLogger logger;

        public DestinationsSearchControllerTests()
        {
            // Arrange
            facilitiesService = Substitute.For<IHotelFacilitiesService>();
            mockRepository = Substitute.For<IDestinationsRepository>();
            searchService = Substitute.For<IDestinationsSearchService>();
            logger = Substitute.For<IDestinationsLogger>();
            destinationsSearchController = new DestinationsSearchController(mockRepository, searchService, facilitiesService, logger);
        }

        [Theory]
        [MemberData(nameof(EmptyResortByIdsRequest))]
        public void GetResorts_ReturnsData(ResortByIdsRequest request)
        {
            // Arrange
            var data = new List<ResortResponse>
            {
                new ResortResponse
                {
                    CountryCode = "countryCode",
                    ResortCode = "resortCode",
                    ResortName = "resortName",
                    Theme = "theme",
                    Hotels = new List<HotelResponse>
                    {
                        new HotelResponse
                        {
                            HotelCode = "hotelCode1",
                            HotelName = "hotelName1"
                        },
                        new HotelResponse
                        {
                            HotelName = "hotelName2",
                            HotelCode = "hotelCode2"
                        }
                    }
                },
                new ResortResponse
                {
                    ResortCode = "resortCode2",
                    ResortName = "resortName2",
                    Hotels = new List<HotelResponse>
                    {
                        new HotelResponse
                        {
                            HotelCode = "hotelCode3",
                            HotelName = "hotelName3"
                        }
                    }
                }
            };
            searchService.GetResorts(includeHotelCoordinates: false).Returns(data);

            // Act
            var actual = destinationsSearchController.GetResorts(request) as JsonResult;

            // Assert
            actual.Should().NotBeNull();
            actual.Data.Should().BeEquivalentTo(data);
            searchService.Received(1).GetResorts(includeHotelCoordinates: false);
            searchService.DidNotReceive().GetResortsByCodes(Arg.Any<string[]>(), Arg.Any<bool>());
        }

        [Fact]
        public void GetResorts_ShouldIncludeCoordinates_WhenRequested()
        {
            // Arrange
            var request = new ResortByIdsRequest { WithHotelCoordinates = true };
            var longitude = 12.34f;
            var latitude = 56.78f;
            var data = new List<ResortResponse>
            {
                new ResortResponse
                {
                    CountryCode = "countryCode",
                    ResortCode = "resortCode",
                    ResortName = "resortName",
                    Theme = "theme",
                    Hotels = new List<HotelResponse>
                    {
                        new HotelResponse
                        {
                            HotelCode = "hotelCode1",
                            HotelName = "hotelName1",
                            Longitude = longitude,
                            Latitude = latitude
                        }
                    }
                }
            };
            searchService.GetResorts(includeHotelCoordinates: true).Returns(data);

            // Act
            var actual = destinationsSearchController.GetResorts(request) as JsonResult;

            // Assert
            var resorts = actual?.Data as IEnumerable<ResortResponse>;
            resorts.Should().NotBeNull();
            searchService.Received(1).GetResorts(includeHotelCoordinates: true);
            resorts.First().Hotels.First().Longitude.Should().Be(longitude);
            resorts.First().Hotels.First().Latitude.Should().Be(latitude);
        }

        [Fact]
        public void GetResorts_ShouldClearCoordinates_WhenNotRequested()
        {
            // Arrange
            var request = new ResortByIdsRequest();
            var data = new List<ResortResponse>
            {
                new ResortResponse
                {
                    CountryCode = "countryCode",
                    ResortCode = "resortCode",
                    ResortName = "resortName",
                    Theme = "theme",
                    Hotels = new List<HotelResponse>
                    {
                        new HotelResponse
                        {
                            HotelCode = "hotelCode1",
                            HotelName = "hotelName1"
                        }
                    }
                }
            };
            searchService.GetResorts(includeHotelCoordinates: false).Returns(data);

            // Act
            var actual = destinationsSearchController.GetResorts(request) as JsonResult;

            // Assert
            var resorts = actual?.Data as IEnumerable<ResortResponse>;
            resorts.Should().NotBeNull();
            searchService.Received(1).GetResorts(includeHotelCoordinates: false);
            resorts.First().Hotels.First().Longitude.Should().BeNull();
            resorts.First().Hotels.First().Latitude.Should().BeNull();
            JsonConvert.SerializeObject(resorts, new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore })
                .Should().NotContain("Longitude")
                .And.NotContain("Latitude");
        }

        [Theory]
        [MemberData(nameof(ValidResortByIdsRequest))]
        public void GetResorts_ReturnsData2(ResortByIdsRequest request)
        {
            // Arrange
            var data = new List<ResortResponse>
            {
                new ResortResponse
                {
                    CountryCode = "countryCode",
                    ResortCode = "resortCode",
                    ResortName = "resortName",
                    Theme = "theme",
                    Hotels = new List<HotelResponse>
                    {
                        new HotelResponse
                        {
                            HotelCode = "hotelCode1",
                            HotelName = "hotelName1"
                        },
                        new HotelResponse
                        {
                            HotelName = "hotelName2",
                            HotelCode = "hotelCode2"
                        }
                    }
                },
                new ResortResponse
                {
                    CountryCode = "countryCode2",
                    ResortCode = "resortCode2",
                    ResortName = "resortName2",
                    Theme = "theme2",
                    Hotels = new List<HotelResponse>
                    {
                        new HotelResponse
                        {
                            HotelCode = "hotelCode3",
                            HotelName = "hotelName3"
                        }
                    }
                }
            };
            searchService.GetResortsByCodes(request.AtcomIds, false).Returns(data);

            // Act
            var actual = destinationsSearchController.GetResorts(request) as JsonResult;

            // Assert
            actual.Should().NotBeNull();
            actual.Data.Should().BeEquivalentTo(data);
            searchService.Received(1).GetResortsByCodes(request.AtcomIds, false);
            searchService.DidNotReceive().GetResorts(includeHotelCoordinates: Arg.Any<bool>());
        }

        [Fact]
        public void GetResorts_ShouldPassIncludeCoordinatesToGetResortsByCodes_WhenRequested()
        {
            // Arrange
            var request = new ResortByIdsRequest
            {
                AtcomIds = new[] { "atcom1" },
                WithHotelCoordinates = true,
            };

            searchService.GetResortsByCodes(request.AtcomIds, true).Returns(new List<ResortResponse>());

            // Act
            var actual = destinationsSearchController.GetResorts(request) as JsonResult;

            // Assert
            actual.Should().NotBeNull();
            searchService.Received(1).GetResortsByCodes(request.AtcomIds, true);
            searchService.DidNotReceive().GetResorts(includeHotelCoordinates: Arg.Any<bool>());
        }

        [Theory]
        [MemberData(nameof(NotValidHotelsByIdsRequest))]
        public void GetHotels_ThrowArgumentException_IfRequestIsNotValid(HotelsByIdsRequest request)
        {
            // Act
            Action actual = () => destinationsSearchController.GetHotels(request);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [MemberData(nameof(ValidHotelsByIdsRequest))]
        public void GetHotels_ShouldBeNotNull_IfSearchResultHasData(HotelsByIdsRequest request)
        {
            // Arrange
            var hints = new List<SearchHit<HotelSearchResultItem>>()
            {
                {
                    new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem()
                    {
                        SourceCodes = new[] { "code" },
                        ItemName = "itemName"
                    })
                }
            };
            var results = new SearchResults<HotelSearchResultItem>(hints, 1);

            mockRepository.SearchHotelsByCodes(Arg.Any<string[]>())
                .Returns(results);

            // Act
            var actual = destinationsSearchController.GetHotels(request) as JsonResult;

            // Assert
            actual.Data.Should().NotBeNull();
        }

        [Theory]
        [MemberData(nameof(NotValidBaseByCodesRequest))]
        public void GetAtcomIdsByGiataCodes_ShouldThrowArgumentException_IfRequestIsNotValid(BaseByCodesRequest request)
        {
            // Act
            Action actual = () => destinationsSearchController.GetAtcomIdsByGiataCodes(request);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Fact]
        public void GetAtcomIdsByGiataCodes_ShouldReturnMappingBetweenGiataAndAtcomIds()
        {
            // Arrange
            var request = new BaseByCodesRequest
            {
                Codes = new[] { "G1", "G2", "G3" }
            };
            var data = new List<BaseHotelSearchResultItem>
            {
                new BaseHotelSearchResultItem
                {
                    GiataCode = "G1",
                    SourceCodes = new[] { "A1", "A2" }
                },
                new BaseHotelSearchResultItem
                {
                    GiataCode = "G1",
                    SourceCodes = new[] { "A2", "A3" }
                },
                new BaseHotelSearchResultItem
                {
                    GiataCode = "G2",
                    SourceCodes = new[] { "B1" }
                }
            };
            searchService.GetHotelsByGiataCodes(Arg.Any<string[]>()).Returns(data);

            // Act
            var actual = (destinationsSearchController.GetAtcomIdsByGiataCodes(request) as JsonResult)?.Data as Dictionary<string, string[]>;

            // Assert
            actual.Should().NotBeNull();
            actual.Should().ContainKey("G1");
            actual["G1"].Should().BeEquivalentTo(new[] { "A1", "A2", "A3" });
            actual.Should().ContainKey("G2");
            actual["G2"].Should().BeEquivalentTo(new[] { "B1" });
            actual.Should().ContainKey("G3");
            actual["G3"].Should().BeEmpty();
            searchService.Received(1).GetHotelsByGiataCodes(Arg.Is<string[]>(x => x.SequenceEqual(request.Codes)));
        }

        [Fact]
        public void Search_DestinationShouldBeNotEmpty_IfSearchResultHasData()
        {
            var destinations = new List<ChildDestination>()
            {
                new ChildDestination()
                {
                    Code = "code"
                }
            };

            // Arrange
            searchService.SearchByName(Arg.Any<string>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<DestinationFilter>(), Arg.Any<bool>())
                .Returns(destinations);

            // Act
            var actual = destinationsSearchController.Search("search") as JsonResult;

            // Assert
            (actual.Data as DestinationsSearchResponse).Destinations.Count().Should().Be(1);
        }

        [Fact]
        public void Search_DestinationShouldBeNotNull_IfSearchResultIsNull()
        {
            // Arrange
            List<ChildDestination> results = null;

            searchService.SearchByName(Arg.Any<string>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<DestinationFilter>(), Arg.Any<bool>())
                .Returns(results);

            // Act
            var actual = destinationsSearchController.Search(Arg.Any<string>()) as JsonResult;

            // Assert
            (actual.Data as DestinationsSearchResponse).Destinations.Should().NotBeNull();
        }

        [Fact]
        public void Search_DestinationShouldBeNotNull_IfSearchResultHasNoData()
        {
            // Arrange
            List<ChildDestination> results = new List<ChildDestination>();

            searchService.SearchByName(Arg.Any<string>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<DestinationFilter>(), Arg.Any<bool>())
                .Returns(results);

            // Act
            var actual = destinationsSearchController.Search(Arg.Any<string>()) as JsonResult;

            // Assert
            (actual.Data as DestinationsSearchResponse).Destinations.Should().NotBeNull();
        }

        [Theory]
        [MemberData(nameof(NotValidHotelsByIdsRequest))]
        public void GetHotelsFacilities_ThrowArgumentException_IfRequestIsNotValid(HotelsByIdsRequest request)
        {
            // Act
            Action actual = () => destinationsSearchController.GetHotelsFacilities(request);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [MemberData(nameof(ValidHotelsByIdsRequest))]
        public void GetHotelsFacilities_ShouldBeNotNull_IfSearchResultHasData(HotelsByIdsRequest request)
        {
            // Arrange
            var hints = new List<SearchHit<HotelFacilitiesSearchResultItem>>()
            {
                {
                    new SearchHit<HotelFacilitiesSearchResultItem>(1, new HotelFacilitiesSearchResultItem()
                    {
                        SourceCodes = new[] { "code" },
                        ItemName = "itemName"
                    })
                }
            };
            var results = new SearchResults<HotelFacilitiesSearchResultItem>(hints, 1);

            mockRepository.SearchHotelsFacilitiesByIds(Arg.Any<List<string>>())
                .Returns(results);
            facilitiesService.GetHotelsFacilities(Arg.Any<string[]>())
                .Returns(new Dictionary<string, List<FacilityType>>());

            // Act
            var actual = destinationsSearchController.GetHotelsFacilities(request) as JsonResult;

            // Assert
            actual.Data.Should().NotBeNull();
        }

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        public void GetImage_ThrowArgumentException_IfRequestIsNotValid(string request)
        {
            // Act
            Action actual = () => destinationsSearchController.GetImage(request);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [AutoData]
        public void GetImage_ShouldBeEqualToImageUrl(string code, string imageUrl)
        {
            // Arrange
            searchService.GetImage(code).Returns(imageUrl);

            // Act
            var actual = (destinationsSearchController.GetImage(code) as JsonResult).Data;

            // Assert
            actual.Should().BeEquivalentTo(imageUrl);
        }

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        public void GetHotelImage_ThrowArgumentException_IfRequestIsNotValid(string request)
        {
            // Act
            Action actual = () => destinationsSearchController.GetHotelImage(request);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [InlineData("HTL123")]
        [InlineData("  ")]
        public void GetHotelImage_ShouldReturnImageData(string code)
        {
            // Arrange
            var imageData = new ImageData
            {
                Small = "small",
                Medium = "medium",
                Large = "large",
                Description = "description"
            };
            searchService.GetHotelImage(code).Returns(imageData);

            // Act
            var actual = destinationsSearchController.GetHotelImage(code) as JsonResult;

            // Assert
            actual.Should().NotBeNull();
            actual.Data.Should().BeEquivalentTo(imageData);
            actual.JsonRequestBehavior.Should().Be(JsonRequestBehavior.AllowGet);
            searchService.Received(1).GetHotelImage(code);
        }

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        public void GetDestinationCodeByName_ThrowArgumentException_IfRequestIsNotValid(string name)
        {
            // Act
            Action actual = () => destinationsSearchController.GetDestinationCodeByName(name);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [AutoData]
        public void GetDestinationCodeByName_ShouldReturnDestinationCodeByName_IfDataExisting(string name)
        {
            // Arrange
            var hints = new List<SearchHit<BaseDatasourceSearchResultItem>>()
            {
                {
                    new SearchHit<BaseDatasourceSearchResultItem>(1, new BaseDatasourceSearchResultItem() { Code = "Code" })
                }
            };
            var results = new SearchResults<BaseDatasourceSearchResultItem>(hints, 1);

            mockRepository.GetDestinationCodeByName(name)
                .Returns(results.FirstOrDefault().Document.Code);

            // Act
            var actual = (destinationsSearchController.GetDestinationCodeByName(name) as JsonResult).Data;

            // Assert
            actual.Should().BeEquivalentTo("Code");
        }

        [Fact]
        public void GetDestinations_ShouldBeNotNull()
        {
            // Arrange
            var hints = new List<SearchHit<BaseDestinationsSearchResultItem>>()
            {
                {
                    new SearchHit<BaseDestinationsSearchResultItem>(1, new BaseDestinationsSearchResultItem())
                }
            };
            var results = new SearchResults<BaseDestinationsSearchResultItem>(hints, 1);

            mockRepository.GetAllCountries(false, false)
                .Returns(results);

            // Act
            var actual = destinationsSearchController.GetAllCountries();

            // Assert
            actual.Should().NotBeNull();
        }

        [Theory]
        [AutoData]
        public void GetDestinations_ShouldReturnCountries_IfCountriesExists(string countryCode)
        {
            // Arrange
            var expectedResponse = new DestinationsSearchResponse(new List<ChildDestination>()
            {
                new ChildDestination(new BaseDestinationsSearchResultItem()
                {
                    Code = countryCode,
                    TemplateId = Constants.TemplateIds.Country,
                    TemplateName = Constants.TemplateNames.Country
                })
            });

            searchService.GetAllCountries(Arg.Any<bool>(), Arg.Any<bool>()).Returns(expectedResponse);
            // Act
            var actual = (DestinationsSearchResponse)((JsonResult)destinationsSearchController.GetAllCountries(true, true)).Data;

            // Assert
            actual.Should().NotBeNull();
            actual.Destinations.Should().HaveCount(1);
            actual.Destinations.ElementAt(0).Code.Should().Be(countryCode);
            searchService.Received().GetAllCountries(Arg.Any<bool>(), Arg.Any<bool>());
        }

        [Theory]
        [MemberData(nameof(NotValidDestianationsIdsRequest))]
        public void GetItineraries_ThrowArgumentException_IfRequestIsNotValid(BaseByCodesRequest request)
        {
            // Act
            Action actual = () => destinationsSearchController.GetItineraries(request);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [AutoData]
        public void GetItineraries_ShouldBeNotNull_IfRequestValid(BaseByCodesRequest request)
        {
            var hints = new List<SearchHit<ItinerarySearchResultItem>>()
            {
                {
                    new SearchHit<ItinerarySearchResultItem>(1, new ItinerarySearchResultItem())
                }
            };
            var results = new SearchResults<ItinerarySearchResultItem>(hints, 1);

            mockRepository.SearchItinerary(Arg.Any<List<string>>())
                .Returns(results);

            // Act
            var actual = destinationsSearchController.GetItineraries(request);

            // Assert
            actual.Should().NotBeNull();
        }

        [Theory]
        [MemberData(nameof(NotValidDestianationsIdsRequest))]
        public void GetTitles_ThrowArgumentException_IfRequestIsNotValid(BaseByCodesRequest request)
        {
            // Act
            Action actual = () => destinationsSearchController.GetTitles(request);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [AutoData]
        public void GetTitles_ShouldBeNotNull_IfRequestValid(BaseByCodesRequest request)
        {
            var hints = new List<SearchHit<BaseDestinationsSearchResultItem>>()
            {
                {
                    new SearchHit<BaseDestinationsSearchResultItem>(1, new BaseDestinationsSearchResultItem())
                }
            };
            var results = new SearchResults<BaseDestinationsSearchResultItem>(hints, 1);

            mockRepository.SearchByCodes(Arg.Any<List<string>>(), Arg.Any<bool>(), Arg.Any<bool>())
                .Returns(results);

            // Act
            var actual = destinationsSearchController.GetTitles(request);

            // Assert
            actual.Should().NotBeNull();
        }

        [Fact]
        public void GetHotelsCoordinatesByParentCode_ShouldThrowException_IfCodeNotProvided()
        {
            // Act
            Action actual = () => destinationsSearchController.GetHotelsCoordinatesByParentCode(null);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [AutoData]
        public void GetHotelsCoordinatesByCode_ShouldNotBeNull_IfHitExists(string parentCode, ID itemId, string hotelCode, string hotelName, float latitude, float longitude)
        {
            // Arrange
            BaseDatasourceSearchResultItem destination = new BaseDatasourceSearchResultItem()
            {
                ItemId = itemId
            };
            mockRepository.GetDestinationItemByCode(parentCode).Returns(destination);

            var hotelsCoordinatesHints = new List<SearchHit<HotelSearchResultItem>>()
            {
                new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem()
                {
                    SourceCodes = new[] { hotelCode },
                    Name = hotelName,
                    Latitude = latitude,
                    Longitude = longitude
                })
            };

            var hotelsCoordinates = new SearchResults<HotelSearchResultItem>(hotelsCoordinatesHints, 1);

            mockRepository.GetHotelsCoordinatesByHotelsParentsPath(Arg.Any<ID[]>()).Returns(hotelsCoordinates);

            // Act
            var actual = (destinationsSearchController.GetHotelsCoordinatesByParentCode(parentCode) as JsonResult).Data;

            // Assert
            actual.Should().NotBeNull();
        }

        [Theory]
        [AutoData]
        public void GetHotelsByEntryInPolygonBorders_ShouldThrowException_IfSameLatitudesAreSupplied(float latitude, float longitudeLeftAngle, float longitudeRightAngle)
        {
            // Act
            Action actual = () => destinationsSearchController.GetHotelsByEntryInPolygonBorders(
                new PolyCoordinates()
                {
                    TopLeftAngle = new Point()
                    {
                        Latitude = latitude,
                        Longitude = longitudeLeftAngle
                    },
                    BottomRightAngle = new Point()
                    {
                        Latitude = latitude,
                        Longitude = longitudeRightAngle
                    }
                });

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [AutoData]
        public void GetHotelsByEntryInPolygonBorders_ShouldThrowException_IfSameLongitudesAreSupplied(float longitude, float latitudeLeftAngle, float latitudeRightAngle)
        {
            // Act
            Action actual = () => destinationsSearchController.GetHotelsByEntryInPolygonBorders(
                new PolyCoordinates()
                {
                    BottomRightAngle = new Point()
                    {
                        Longitude = longitude,
                        Latitude = latitudeLeftAngle
                    },
                    TopLeftAngle = new Point()
                    {
                        Longitude = longitude,
                        Latitude = latitudeRightAngle
                    }
                });

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [AutoData]
        public void GetHotelsByEntryInPolygonBorders_ShouldNotBeNull_IfHitExists(Point topLeftAngle, Point bottomRightAngle, string hotelCode, string hotelName, float latitude, float longitude)
        {
            // Arrange
            var hotelsCoordinates = new List<SearchHit<HotelSearchResultItem>>()
            {
                new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem()
                {
                    SourceCodes = new[] { hotelCode },
                    Name = hotelName,
                    Latitude = latitude,
                    Longitude = longitude
                })
            };

            var results = new SearchResults<HotelSearchResultItem>(hotelsCoordinates, 1);

            mockRepository.GetHotelsInsideCoordinateGrid(topLeftAngle, bottomRightAngle).Returns(results);

            // Act
            var actual = (destinationsSearchController.GetHotelsByEntryInPolygonBorders(new PolyCoordinates() { TopLeftAngle = topLeftAngle, BottomRightAngle = bottomRightAngle }) as JsonResult).Data;

            // Assert
            actual.Should().NotBeNull();
        }

        [Theory]
        [MemberData(nameof(NotValidHotelsByIdsRequest))]
        public void GetHotelTransfers_ShouldThrowArgumentException_IfRequestIsNotValid(HotelsByIdsRequest request)
        {
            // Act
            Action actual = () => destinationsSearchController.GetHotelTransfers(request);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [MemberData(nameof(ValidHotelsByIdsRequest))]
        public void GetHotelTransfers_ShouldNotBeNull_IfHitExists(HotelsByIdsRequest request)
        {
            // Arrange
            var hotelTransfers = new List<SearchHit<HotelSearchResultItem>>()
            {
                new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem()
                {
                    SourceCodes = new[] { "code" },
                    Name = "name"
                })
            };

            var results = new SearchResults<HotelSearchResultItem>(hotelTransfers, 1);

            mockRepository.SearchHotelTransfersByIds(Arg.Any<string[]>()).Returns(results);

            // Act
            var actual = (destinationsSearchController.GetHotelTransfers(request) as JsonResult).Data;

            // Assert
            actual.Should().NotBeNull();
        }

        [Theory]
        [MemberData(nameof(NotValidBaseByCodesRequest))]
        public void GetByAirportCodes_ShouldThrowArgumentException_IfRequestIsNotValid(BaseByCodesRequest request)
        {
            // Act
            Action actual = () => destinationsSearchController.GetByAirportCodes(request);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [MemberData(nameof(ValidBaseByCodesRequest))]
        public void GetByAirportCodes_ShouldNotBeNull_IfHitExists(BaseByCodesRequest request)
        {
            // Arrange
            var destinations = new List<SearchHit<BaseDestinationsSearchResultItem>>()
            {
                new SearchHit<BaseDestinationsSearchResultItem>(1, new BaseDestinationsSearchResultItem()
                {
                    Children = new string[2] { "1", "2" },
                    ImageUrl = "fakeurl"
                })
            };

            var results = new SearchResults<BaseDestinationsSearchResultItem>(destinations, 1);

            mockRepository.GetDestinationsByAirportCodes(Arg.Any<string[]>()).Returns(results);

            // Act
            var actual = (destinationsSearchController.GetByAirportCodes(request) as JsonResult).Data;

            // Assert
            actual.Should().NotBeNull();
        }

        [Theory]
        [MemberData(nameof(ValidBaseByCodesRequest))]
        public void GetByAirportCodes_ShouldBeEmpty_IfHitNotExists(BaseByCodesRequest request)
        {
            // Arrange
            SearchResults<BaseDestinationsSearchResultItem> searchResults = null;
            mockRepository.GetDestinationsByAirportCodes(Arg.Any<string[]>()).Returns(searchResults);

            // Act
            var actual = (destinationsSearchController.GetByAirportCodes(request) as JsonResult).Data as IEnumerable<ChildDestination>;

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [MemberData(nameof(NotValidDestinationsByAirportCodesRequest))]
        public void GetDestinationsByAirportCodes_ShouldThrowException_IfRequestIsNotValid(DestinationsByAirportCodesRequest request)
        {
            // Act
            Action actual = () => destinationsSearchController.GetDestinationsByAirportCodes(request);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [MemberData(nameof(ValidDestinationsByAirportCodesRequest))]
        public void GetDestinationsByAirportCodes_ShouldNotBeNull_IfHitExists(DestinationsByAirportCodesRequest request)
        {
            // Arrange
            var response = new DestinationsByAirportCodesResponse()
            {
                Page = 1,
                Take = 1
            };

            searchService.GetDestinationsByAirportCodes(Arg.Any<DestinationByCodeQueryArgs>()).Returns(response);

            // Act
            var actual = destinationsSearchController.GetDestinationsByAirportCodes(request) as JsonResult;

            // Assert
            actual.Data.Should().NotBeNull();
        }

        [Theory]
        [MemberData(nameof(NotValidBaseByCodesRequest))]
        public void GetHierarchyByAirportCodes_ShouldThrowException_IfRequestIsNotValid(BaseByCodesRequest request)
        {
            // Act
            Action actual = () => destinationsSearchController.GetHierarchyByAirportCodes(request);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [MemberData(nameof(NotValidBaseByCodesRequest))]
        public void GetDestinationsByCodes_ShouldThrowException_IfRequestIsNotValid(BaseByCodesRequest request)
        {
            // Act & Assert
            Assert.Throws<ArgumentException>(() => destinationsSearchController.GetDestinationsByCodes(request));
        }

        [Theory]
        [MemberData(nameof(ValidBaseByCodesRequest))]
        public void GetDestinationsByCodes_ShouldNotBeNull_IfDestinationExists(BaseByCodesRequest request)
        {
            // Arrange
            var results = new List<BaseDestinationsSearchResultItem>()
            {
                new BaseDestinationsSearchResultItem()
                {
                    Code = "code",
                    Name = "name"
                }
            };

            var response = new List<BaseDestinationsSearchResultItem>(results);
            searchService.GetDestinationsByCodes(Arg.Any<string[]>(), Arg.Any<bool>())
                .Returns(response);

            // Act
            var actual = (destinationsSearchController.GetDestinationsByCodes(request) as JsonResult).Data;

            // Assert
            actual.Should().NotBeNull();
        }

        [Theory]
        [AutoData]
        public void GetDestinationsByCodes_ShouldReturnCorrecResult_IfDestinationExists(BaseByCodesRequest request, string code)
        {
            // Arrange
            var results = new List<BaseDestinationsSearchResultItem>()
            {
                new BaseDestinationsSearchResultItem()
                {
                    Code = code,
                    TrackingId = "en-tracking",
                }
            };

            var response = new List<BaseDestinationsSearchResultItem>(results);
            searchService.GetDestinationsByCodes(Arg.Any<string[]>(), Arg.Any<bool>())
                .Returns(response);

            // Act
            var actual = (destinationsSearchController.GetDestinationsByCodes(request) as JsonResult).Data as IEnumerable<ChildDestination>;

            // Assert
            actual.Should().HaveCount(1);
            actual.ElementAt(0).Code.Should().Be(code);
            actual.ElementAt(0).TrackingId.Should().Be("en-tracking");
        }

        [Theory]
        [MemberData(nameof(NotValidBaseByCodesRequest))]
        public void GetAllNotExistHotelCodesByCodes_ThrowArgumentException_IfRequestIsNotValid(BaseByCodesRequest request)
        {
            // Act
            Action actual = () => destinationsSearchController.GetMissingCodes(request);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Fact]
        public void GetAllNotExistHotelCodesByCodes_ShouldNotBeNull_IfHitExistsAsync()
        {
            // Arrange
            var request = new BaseByCodesRequest
            {
                Codes = new[] { "fake code" }
            };

            var hints = new List<SearchHit<SourcesSearchResultItem>>()
            {
                {
                    new SearchHit<SourcesSearchResultItem>(1, new SourcesSearchResultItem()
                    {
                        SourceCodes = new[] { "code" }
                    })
                }
            };
            var data = new SearchResults<SourcesSearchResultItem>(hints, 1);

            mockRepository.GetAllExistHotelsCodes(Arg.Any<string[]>()).Returns(data);

            searchService.GetHotelsCodes(Arg.Any<string[]>()).Returns(new[] { "code" });

            // Act
            var actual = destinationsSearchController.GetMissingCodes(request) as JsonResult;

            // Assert
            actual.Should().NotBeNull();
        }

        [Theory]
        [AutoData]
        public void GetHotelsIds_ShouldNotBeNull_IfHitsExist(HotelsCodesByDateRequest args, string[] hotelsIds)
        {
            // Arrange
            mockRepository.GetHotelsCodes(Arg.Any<int>(), Arg.Any<int>(), Arg.Any<DateTime?>()).Returns(hotelsIds);

            // Act
            var actual = destinationsSearchController.GetHotelsCodes(args) as JsonResult;

            // Assert
            actual.Should().NotBeNull();
        }

        [Fact]
        public void GetAccommodationResortInfoByCode_ShouldThrowException_IfCodeNotSupplied()
        {
            // Arrange
            Action actual = () => destinationsSearchController.GetHotelResortInfoByHotelCode(null);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Fact]
        public void GetAccommodationResortInfoByCode_ShouldNotBeNull_IfHitExist()
        {
            // Arrange
            var searchResultItem = new AccommodationResortInfo();
            searchService.GetHotelResortInfoByHotelCode(Arg.Any<string>()).Returns(searchResultItem);

            // Act
            var actual = (destinationsSearchController.GetHotelResortInfoByHotelCode("fakecode") as JsonResult).Data;

            // Assert
            actual.Should().NotBeNull();
        }

        [Theory]
        [AutoData]
        public void GetPromoPageDestinations_OnPromoPageWithDestinations_ReturnsCorrectResult(
            string code,
            string name,
            string templateName,
            string[] airportCodes,
            bool showOnSearchPod,
            List<Destination> parents,
            string[] relatedRegions,
            string[] relatedResorts,
            ID promoPageId)
        {
            // Arrange
            var serializedParents = parents.Select(x => JsonConvert.SerializeObject(x)).ToArray();

            var destinationSearchResultItem = new DestinationSearchResultItem()
            {
                Code = code,
                ItemName = name,
                TemplateName = templateName,
                AirportCodes = airportCodes,
                ShowOnSearchPod = showOnSearchPod,
                Parents = serializedParents,
                RelatedRegions = relatedRegions,
                RelatedResorts = relatedResorts
            };

            var childDestinations = new List<ChildDestination> { DestinationsMapper.MapFromDestinationSearchResultItem(code, destinationSearchResultItem) };
            searchService.GetPromoPageDestinations(Arg.Any<ID>()).Returns(childDestinations);

            // Act
            var promoPageDestinations = destinationsSearchController.GetPromoPageDestinations(promoPageId.ToString());
            var actual = (promoPageDestinations as JsonResult)?.Data as IEnumerable<ChildDestination>;

            // Assert
            actual.Should().NotBeNull();
            actual.Should().BeEquivalentTo(childDestinations);
        }

        [Theory]
        [AutoData]
        public void GetPromoPageDestinations_OnPromoPageWithoutDestinations_ReturnsEmptyCollection(ID promoPageId)
        {
            // Arrange
            searchService.GetPromoPageDestinations(Arg.Any<ID>()).Returns(Enumerable.Empty<ChildDestination>());

            // Act
            var promoPageDestinations = destinationsSearchController.GetPromoPageDestinations(promoPageId.ToString());
            var actual = (promoPageDestinations as JsonResult)?.Data as IEnumerable<ChildDestination>;

            // Assert
            actual.Should().NotBeNull();
            Assert.Empty(actual);
        }

        [Fact]
        public void GetMuzementData_ShouldGetMuzementData_IfMuzementIdsAreExist()
        {
            // Arrange
            var muzement = new Muzement();
            searchService.GetMuzement(Arg.Any<string>()).Returns(muzement);

            // Act
            var muzementData = destinationsSearchController.GetMuzementData("code");
            var actual = (muzementData as JsonResult)?.Data as Muzement;

            // Assert
            actual.Should().NotBeNull();
        }

        [Fact]
        public void GetPromoPageDestinations_NullPromoPageIdArgument_ArgumentExceptionThrown()
        {
            // Arrange
            string fakePromoPageId = null;

            // Act
            Action act = () => destinationsSearchController.GetPromoPageDestinations(fakePromoPageId);

            // Assert
            Assert.Throws<ArgumentException>(act);
        }

        [Fact]
        public void GetPromoPageDestinations_EmptyPromoPageIdArgument_ArgumentExceptionThrown()
        {
            // Arrange
            string fakePromoPageId = string.Empty;

            // Act
            Action act = () => destinationsSearchController.GetPromoPageDestinations(fakePromoPageId);

            // Assert
            Assert.Throws<ArgumentException>(act);
        }

        [Theory]
        [InlineData("{8E5F9E9C-0584-4788-985F-9484D852DE0}")]
        [InlineData("test")]
        [InlineData("{111C-11-1111-11-9484D852DE0}")]
        [InlineData("{0-0-0-0-0}")]
        public void GetPromoPageDestinations_NotValidPageIdArgument_ArgumentExceptionThrown(string promoPageId)
        {
            // Act
            Action act = () => destinationsSearchController.GetPromoPageDestinations(promoPageId);

            // Assert
            Assert.Throws<ArgumentException>(act);
        }

        [Theory]
        [InlineData("")]
        [InlineData("  ")]
        [InlineData(null)]
        public void GetDestinationInfo_IfCodeIsNullOrEmpty_ArgumentExceptionThrown(string code)
        {
            // Act
            Action act = () => destinationsSearchController.GetDestinationInfo(code);

            // Assert
            Assert.Throws<ArgumentException>(act);
        }

        [Theory]
        [AutoData]
        public void GetDestinationInfo_ShouldBeNotNull_IfServiceReturnsData(string code, DestinationInfo expected)
        {
            // Arrange
            searchService.GetDestinationInfo(code).Returns(expected);

            // Act
            var actual = destinationsSearchController.GetDestinationInfo(code);

            // Assert
            actual.Should().NotBeNull();
        }

        [Fact]
        public void GetHotelHighlightsByHotelCode_ShouldBeNotNull_IfSearchResultHasData()
        {
            // Arrange
            var code = "code";
            var highlights = new List<HotelHighlights>()
            {
                new HotelHighlights
                {
                    Title = "title1",
                    Subtitle = "subtitle1",
                    Description = "description1 ",
                    Image = "imageUrl1",
                }
            };

            searchService.GetHotelHighlightsByHotelCode(Arg.Any<string>())
                .Returns(highlights);

            // Act
            var actual = destinationsSearchController.GetHotelHighlightsByHotelCode(code) as JsonResult;

            // Assert
            actual.Should().NotBeNull();
        }

        [Theory]
        [InlineData("")]
        [InlineData("  ")]
        [InlineData(null)]
        public void GetHotelHighlightsByHotelCode_IfCodeIsNullOrEmpty_ArgumentExceptionThrown(string code)
        {
            // Act
            Action act = () => destinationsSearchController.GetHotelHighlightsByHotelCode(code);

            // Assert
            Assert.Throws<ArgumentException>(act);
        }

        [Fact]
        public void GetExpediaHotel_ReturnsJsonResult_WhenHotelFound()
        {
            // Arrange
            var giata = "GIATA123";
            var expected = new HotelByGiataResponse(new Hotel
            {
                Code = "W123456",
                Name = "Test Hotel"
            });
            searchService.GetExpediaHotelByGiataCode(giata).Returns(expected);

            // Act
            var result = destinationsSearchController.GetExpediaHotel(giata) as JsonResult;

            // Assert
            result.Should().NotBeNull();
            result.Data.Should().BeEquivalentTo(expected);
        }

        [Fact]
        public void GetExpediaHotel_ReturnsNotFound_WhenServiceReturnsNull()
        {
            // Arrange
            var giata = "GIATA_NOT_FOUND";
            searchService.GetExpediaHotelByGiataCode(giata).Returns((HotelByGiataResponse)null);

            // Act
            var result = destinationsSearchController.GetExpediaHotel(giata);

            // Assert
            result.Should().BeOfType<HttpNotFoundResult>();
            var notFound = (HttpNotFoundResult)result;
            notFound.StatusCode.Should().Be(404);
        }

        [Fact]
        public void GetExpediaHotel_Returns500_WhenServiceThrows()
        {
            // Arrange
            var giata = "GIATA_ERROR";
            searchService.GetExpediaHotelByGiataCode(Arg.Any<string>()).Throws(new Exception("boom"));

            // Act
            var result = destinationsSearchController.GetExpediaHotel(giata);

            // Assert
            result.Should().BeOfType<HttpStatusCodeResult>();
            var status = (HttpStatusCodeResult)result;
            status.StatusCode.Should().Be(500);
            status.StatusDescription.Should().Be("Internal Server Error.");
        }

        [Fact]
        public void GetExpediaHotel_ThrowsArgumentException_WhenCodeIsNullOrWhiteSpace()
        {
            // Act
            Action act = () => destinationsSearchController.GetExpediaHotel(" ");

            // Assert
            act.Should().Throw<ArgumentException>()
                .WithMessage("Argument code cannot be null or empty");
        }

        public static IEnumerable<object[]> ValidResortByIdsRequest
        {
            get { return new[] { new object[] { new ResortByIdsRequest() { AtcomIds = new string[1] { "1" } } } }; }
        }

        public static IEnumerable<object[]> EmptyResortByIdsRequest
        {
            get
            {
                return new[]
                {
                    new object[] { new ResortByIdsRequest() },
                    new object[]
                    {
                        new ResortByIdsRequest() { AtcomIds = new string[0] }
                    }
                };
            }
        }

        public static IEnumerable<object[]> ValidHotelsByIdsRequest
        {
            get { return new[] { new object[] { new HotelsByIdsRequest() { AtcomIds = new string[1] { "1" } } } }; }
        }

        public static IEnumerable<object[]> NotValidHotelsByIdsRequest
        {
            get
            {
                return new[]
                {
                    new object[] { new HotelsByIdsRequest() },
                    new object[]
                    {
                        new HotelsByIdsRequest() { AtcomIds = new string[0] }
                    }
                };
            }
        }

        public static IEnumerable<object[]> NotValidDestianationsIdsRequest
        {
            get
            {
                return new[]
                {
                    new object[] { new BaseByCodesRequest() },
                    new object[]
                    {
                        new BaseByCodesRequest() { Codes = new string[0] }
                    }
                };
            }
        }

        public static IEnumerable<object[]> NotValidBaseByCodesRequest
        {
            get
            {
                return new[]
                {
                    new object[] { new BaseByCodesRequest() },
                    new object[]
                    {
                        new BaseByCodesRequest() { Codes = new string[0] }
                    }
                };
            }
        }

        public static IEnumerable<object[]> ValidBaseByCodesRequest
        {
            get
            {
                return new[]
                {
                    new object[]
                    {
                        new BaseByCodesRequest()
                        {
                            Codes = new string[1] { "1" }
                        }
                    }
                };
            }
        }

        public static IEnumerable<object[]> NotValidDestinationsByAirportCodesRequest
        {
            get
            {
                return new[]
                {
                    new object[]
                    {
                        new DestinationsByAirportCodesRequest()
                    }
                };
            }
        }

        public static IEnumerable<object[]> ValidDestinationsByAirportCodesRequest
        {
            get
            {
                return new[]
                {
                    new object[]
                    {
                        new DestinationsByAirportCodesRequest()
                        {
                            Codes = new string[1] { "1" }
                        }
                    }
                };
            }
        }
    }
}
