using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Mvc;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Controllers;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch.Linq;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Controllers
{
    public class ReferenceDataControllerTests
    {
        private readonly IRoomTypesRepository roomTypesRepository;
        private readonly ReferenceDataController controller;
        private readonly ITransferTypesRepository transferRepository;
        private readonly ITransferInfoRepository transferInfoRepository;
        private readonly IFiltredFacilitiesService filtredFacilitiesService;
        private readonly IHotelThemesService hotelThemesService;
        private readonly IDestinationsLogger logger;
        private readonly IVirtualFacilityGroupingService virtualFacilityGroupingService;
        private readonly IReferenceDataService referenceDataService;

        public ReferenceDataControllerTests()
        {
            roomTypesRepository = Substitute.For<IRoomTypesRepository>();
            transferRepository = Substitute.For<ITransferTypesRepository>();
            transferInfoRepository = Substitute.For<ITransferInfoRepository>();
            filtredFacilitiesService = Substitute.For<IFiltredFacilitiesService>();
            hotelThemesService = Substitute.For<IHotelThemesService>();
            virtualFacilityGroupingService = Substitute.For<IVirtualFacilityGroupingService>();
            referenceDataService = Substitute.For<IReferenceDataService>();

            logger = Substitute.For<IDestinationsLogger>();

            controller = new ReferenceDataController(roomTypesRepository, transferRepository, transferInfoRepository, filtredFacilitiesService, hotelThemesService, logger, virtualFacilityGroupingService, referenceDataService);
        }

        [Theory]
        [AutoData]
        public void GetAllCountries_ShouldHasData(string countryName, string countryCode, string iso2)
        {
            // Arrange
            var results = new List<UserCountry>()
            {
                {
                    new UserCountry()
                    {
                        Name = countryName,
                        Code = countryCode,
                        Iso2 = iso2
                    }
                },
            };
            referenceDataService.GetAllCountries().Returns(results);

            // Act
            var actual = ((controller.GetAllCountries() as JsonResult).Data as IEnumerable<UserCountry>).FirstOrDefault();

            // Assert
            actual.Name.Should().Be(countryName);
            actual.Code.Should().Be(countryCode);
            actual.Iso2.Should().Be(iso2);
        }

        [Theory]
        [AutoData]
        public void GetAllDialingCodes_ShouldHasData(string areaName, float areaCode)
        {
            // Arrange
            var results = new List<DialingCode>()
            {
                {
                    new DialingCode()
                    {
                        Name = areaName,
                        Code = areaCode
                    }
                }
            };

            referenceDataService.GetAllDialingCodes().Returns(results);

            // Act
            var actual = ((controller.GetAllDialingCodes() as JsonResult).Data as IEnumerable<DialingCode>).FirstOrDefault();

            // Assert
            actual.Name.Should().Be(areaName);
            actual.Code.Should().Be(areaCode);
        }

        [Theory]
        [AutoData]
        public void GetAllBoardTypes_ShouldHasData(string code, string name, string itemName, string content, string description, string iconUrl)
        {
            // Arrange
            var results = new List<BoardType>()
            {
                {
                    new BoardType()
                    {
                        Code = code,
                        Name = name,
                        ItemName = itemName,
                        TrackingId = itemName,
                        Content = content,
                        Description = description,
                        IconUrl = iconUrl
                    }
                }
            };

            referenceDataService.GetAllBoardTypes().Returns(results);

            // Act
            var actual = ((controller.GetAllBoardTypes() as JsonResult).Data as IEnumerable<BoardType>).FirstOrDefault();

            // Assert
            actual.Code.Should().Be(code);
            actual.Name.Should().Be(name);
            actual.ItemName.Should().Be(itemName);
            actual.TrackingId.Should().Be(itemName);
            actual.Content.Should().Be(content);
            actual.Description.Should().Be(description);
            actual.IconUrl.Should().Be(iconUrl);
        }

        [Theory]
        [AutoData]
        public void GetAllRoomTypes_ShouldHasData(string code, string name, string itemName, string content, string description)
        {
            // Arrange
            var results = new List<RoomType>()
            {
                {
                    new RoomType()
                    {
                        Code = code,
                        Name = name,
                        ItemName = itemName,
                        TrackingId = itemName,
                        Content = content,
                        Description = description
                    }
                }
            };

            referenceDataService.GetAllRoomTypes().Returns(results);

            // Act
            var actual = ((controller.GetAllRoomTypes() as JsonResult).Data as IEnumerable<RoomType>).FirstOrDefault();

            // Assert
            actual.Code.Should().Be(code);
            actual.Name.Should().Be(name);
            actual.ItemName.Should().Be(itemName);
            actual.TrackingId.Should().Be(itemName);
            actual.Content.Should().Be(content);
            actual.Description.Should().Be(description);
        }

        [Theory]
        [AutoData]
        public void GetRoomTypesWithParameters_ShouldHasData(string code, string name, string itemName, string content, string description, int page, int take)
        {
            // Arrange
            var results = new RoomTypesPaged
            {
                TotalSearchResults = 1,
                Rooms = new List<RoomType>()
                {
                    new RoomType()
                    {
                        Code = code,
                        Name = name,
                        ItemName = itemName,
                        TrackingId = itemName,
                        Content = content,
                        Description = description
                    }
                }
            };

            referenceDataService.GetRoomTypes(Arg.Any<int>(), Arg.Any<int>()).Returns(results);

            // Act
            var actual = ((controller.GetRoomTypes(page, take) as JsonResult).Data as RoomTypesResponse).RoomTypes.FirstOrDefault();

            // Assert
            actual.Code.Should().Be(code);
            actual.Name.Should().Be(name);
            actual.ItemName.Should().Be(itemName);
            actual.TrackingId.Should().Be(itemName);
            actual.Content.Should().Be(content);
            actual.Description.Should().Be(description);
        }

        [Theory]
        [AutoData]
        public void GetRoomTypesByCodes_ShouldHasData(string code, string name, string title, string content, string description, BaseByCodesRequest request)
        {
            // Arrange
            var hits = new List<SearchHit<RoomTypeSearchResultItem>>()
            {
                {
                    new SearchHit<RoomTypeSearchResultItem>(1, new RoomTypeSearchResultItem()
                    {
                        Code = code,
                        Title = title,
                        Name = name,
                        RichTextContent = content,
                        Description = description
                    })
                }
            };

            var results = new SearchResults<RoomTypeSearchResultItem>(hits, 1);

            roomTypesRepository.GetByCodes(Arg.Any<string[]>()).Returns(results);
            // Act
            var actual = ((controller.GetRoomTypesByCodes(request) as JsonResult).Data as IEnumerable<RoomType>).FirstOrDefault();

            // Assert
            actual.Code.Should().Be(code);
            actual.Name.Should().Be(title);
            actual.ItemName.Should().Be(name);
            actual.Content.Should().Be(content);
            actual.Description.Should().Be(description);
        }

        [Theory]
        [MemberData(nameof(NotValidCodesRequest))]
        public void GetRoomTypesByCodes_ShouldThrowExceptionIfRequestCodesEmpty(BaseByCodesRequest request)
        {
            // Act
            Action actual = () => controller.GetRoomTypesByCodes(request);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Fact]
        public void GetHotelThemes_ShouldReturnJsonObject()
        {
            // Arrange
            var data = Enumerable.Empty<HotelThemeResponseItem>();
            hotelThemesService.GetHotelThemes().Returns(data);

            // Act
            var actual = controller.GetHotelThemes();

            // Assert
            actual.Should().BeOfType<JsonResult>();
        }

        [Theory]
        [AutoData]
        public void GetAllTransfers_ShouldNotBeNull_IfDataExists(IEnumerable<TransferType> transferTypes)
        {
            // Arrange
            transferRepository.GetAll().Returns(transferTypes);

            // Act
            var actual = (controller.GetAllTransfers() as JsonResult).Data;

            // Assert
            actual.Should().BeSameAs(transferTypes);
        }

        [Theory]
        [AutoData]
        public void GetFiltredFacilities_ShouldNotBeNull_IfDataExists(List<FacilityExtended> facilityExtendeds)
        {
            // Arrange
            filtredFacilitiesService.GetFiltredFacilities().Returns(facilityExtendeds);

            // Act
            var actual = (controller.GetFiltredFacilities() as JsonResult).Data;

            // Assert
            actual.Should().BeSameAs(facilityExtendeds);
        }

        [Theory]
        [MemberData(nameof(InvalidGiataToAccomMappingRequest))]
        public void GetAccommodationToGiataMapping_ShouldThrowArgumentException_IfRequestIsInvalid(GiataToAccomMappingRequest request)
        {
            // Act
            Func<Task> sut = async () =>
            {
                await controller.GetAccommodationToGiataMapping(request);
            };

            // Assert
            sut.Should().Throw<ArgumentException>();
        }

        [Theory]
        [AutoData]
        public void GetAllTransferDurations_ShouldReturnData(Dictionary<string, int> transferDurations)
        {
            // Arrange
            transferInfoRepository.GetAllTransferDurations().Returns(transferDurations);

            // Act
            var result = controller.GetAllTransferDurations() as JsonResult;
            var actual = result.Data as Dictionary<string, int>;

            // Assert
            actual.Should().BeSameAs(transferDurations);
        }

        public static IEnumerable<object[]> InvalidGiataToAccomMappingRequest => new[]
        {
            new object[]
            {
                new GiataToAccomMappingRequest()
            }
        };

        public static IEnumerable<object[]> NotValidCodesRequest
        {
            get
            {
                return new[]
                {
                    new object[] { new BaseByCodesRequest() },
                    new object[]
                    {
                        new BaseByCodesRequest()
                                       {
                                            Codes = new string[0],
                                       }
                    }
                };
            }
        }

        [Fact]
        public void GetFilterPillsConfig_ReturnsJsonResultWithConfig()
        {
            // Arrange
            var expectedConfig = new FilterPillsConfig
            {
                RecommendedFilterConfig = new RecommendedFilterConfig
                {
                    MinNumberOfOffers = 5,
                    Options = new List<FilterPillOption>
                    {
                        new FilterPillOption { FilterCode = "boardType", Code = "AI", Name = "All Inclusive" }
                    }
                },
                Options = new List<FilterPillOption>
                {
                    new FilterPillOption { FilterCode = "starRating", Code = "5", Name = "5 Star" }
                }
            };
            referenceDataService.GetFilterPillsConfig().Returns(expectedConfig);

            // Act
            var result = controller.GetFilterPillsConfig() as JsonResult;

            // Assert
            result.Should().NotBeNull();
            result.JsonRequestBehavior.Should().Be(JsonRequestBehavior.AllowGet);
            result.Data.Should().Be(expectedConfig);
        }
    }
}
