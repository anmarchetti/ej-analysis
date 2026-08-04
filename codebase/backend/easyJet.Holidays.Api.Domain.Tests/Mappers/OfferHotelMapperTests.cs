using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.Hotels.Facilities;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Mappers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using RoomType = easyJet.Holidays.Api.Domain.Data.Hotels.RoomType;
using HotelBoardType = easyJet.Holidays.Api.Domain.Data.Hotels.BoardType;
using OfferBoardType = easyJet.Holidays.Api.Domain.Data.PackageOffers.BoardType;
using OfferRoomType = easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomType;

namespace easyJet.Holidays.Api.Domain.Tests.Mappers
{
    public class OfferHotelMapperTests
    {
        private readonly Mock<IReferenceDataService> _referenceDataServiceMock = new Mock<IReferenceDataService>();
        private readonly Mock<IHotelThemeService> _hotelThemeServiceMock = new Mock<IHotelThemeService>();
        private readonly OfferHotelMapper _sut;

        public OfferHotelMapperTests()
        {
            _sut = new OfferHotelMapper(_referenceDataServiceMock.Object, _hotelThemeServiceMock.Object, new Mock<ILogger<OfferHotelMapper>>().Object);
        }

        [Fact]
        public async Task MapWithoutBoardsRooms_NullValue_NoException()
        {
            // Act
            var result = await _sut.MapWithoutBoardsRooms(null, null, null);

            // Assert
            result.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(EnrichBoardTypeAndRoomTypeTestData))]
        public async Task EnrichBoardTypeAndRoomType_DataSet_ShouldMap(
            string because,
            HotelBoardType[] boardTypes, RoomType[] roomTypes,
            OfferBoardType expectedBoard, OfferRoomType expectedRoom
            )
        {
            // Arrange

            var unit = new Unit
            {
                Board = "BB",
                Code = "TW01"
            };
            var hotel = new Hotel
            {
                BoardTypes = boardTypes,
                RoomTypes = roomTypes
            };

            // Act
            await _sut.EnrichBoardTypeAndRoomType(hotel, unit, null, null);

            // Assert
            unit.BoardType.Should().BeEquivalentTo(expectedBoard, because);
            unit.RoomType.Should().BeEquivalentTo(expectedRoom, because);
        }

        [Fact]
        public async Task EnrichBoardTypeAndRoomType_RoomCodeWithRatePlan_ShouldMap()
        {
            // Arrange

            // Room code with "!" part(rate plan)
            var roomTypes = new[] {
                new RoomType { Code = "TST2", Content = "room type 2", Description = "room type descr 2", Name= "rt 2"},
                new RoomType { Code = "TW01", Content = "room type", Description = "room type descr", Name = "rt" },
            };

            var expectedRoomType = new OfferRoomType { Code = "TW01", Title = "rt", Content = "room type", Description = "room type descr" };

            var unit = new Unit
            {
                Code = "TW01!NO.CG-T RP"
            };
            var hotel = new Hotel
            {
                RoomTypes = roomTypes
            };

            // Act
            await _sut.EnrichBoardTypeAndRoomType(hotel, unit, null, null);

            // Assert
            unit.RoomType.Should().BeEquivalentTo(expectedRoomType);
        }

        [Fact]
        public async Task EnrichBoardTypeAndRoomType_RoomCodeWithBedGroupSuffix_ShouldMap()
        {
            // Arrange
            var roomTypes = new[]
            {
                new RoomType
                {
                    Code = "TW01",
                    Content = "room type",
                    Description = "room type descr",
                    Name = "rt",
                    BedGroups = new[]
                    {
                        new BedGroup { BedGroupId = "DB", Description = "Double bed" },
                    }
                }
            };

            var expectedRoomType = new OfferRoomType
            {
                Code = "TW01",
                Title = "rt",
                Content = "room type",
                Description = "room type descr",
                BedGroups = new[]
                {
                    new BedGroup { BedGroupId = "DB", Description = "Double bed" },
                }
            };

            var unit = new Unit
            {
                Code = "TW01.DB"
            };

            var hotel = new Hotel
            {
                RoomTypes = roomTypes
            };

            // Act
            await _sut.EnrichBoardTypeAndRoomType(hotel, unit, null, null);

            // Assert
            unit.RoomType.Should().BeEquivalentTo(expectedRoomType);
        }

        [Fact]
        public async Task EnrichBoardTypeAndRoomType_RoomCodeWithBedGroupSuffixCaseInsensitive_ShouldMap()
        {
            // Arrange
            var roomTypes = new[]
            {
                new RoomType
                {
                    Code = "TW01",
                    Name = "rt",
                    BedGroups = new[]
                    {
                        new BedGroup { BedGroupId = "DB", Description = "Double bed" },
                    }
                }
            };

            var unit = new Unit
            {
                Code = "tw01.db"
            };

            var hotel = new Hotel
            {
                RoomTypes = roomTypes
            };

            // Act
            await _sut.EnrichBoardTypeAndRoomType(hotel, unit, null, null);

            // Assert
            unit.RoomType.Should().NotBeNull();
            unit.RoomType.Code.Should().Be("TW01");
            unit.RoomType.BedGroups.Should().ContainSingle(bg => bg.BedGroupId == "DB" && bg.Description == "Double bed");
        }

        public static IEnumerable<object[]> EnrichBoardTypeAndRoomTypeTestData()
        {
            // Test data prerequisites:
            // Board = "BB",
            // Code = "TW01"

            yield return new object[] { "no data in hotel: use default values", null, null,
                new OfferBoardType { Code = "BB", Title = "BB"},
                new OfferRoomType { Code = "TW01" }
            };

            yield return new object[] { "empty arrays in hotel: use default values", new HotelBoardType[0], new RoomType[0],
                new OfferBoardType { Code = "BB", Title = "BB"},
                new OfferRoomType { Code = "TW01" }
            };

            yield return new object[] {
                "data exists, but codes are different: use default values",
                new[] {
                    new HotelBoardType { Code = "TST" }
                },
                new[] {
                    new RoomType { Code = "TST"}
                },
                new OfferBoardType { Code = "BB", Title = "BB"},
                new OfferRoomType { Code = "TW01" }
            };

            yield return new object[] {
                "data exists: should be mapped",
                new[] {
                    new HotelBoardType { Code = "BB2", Content = "board type 2", Name = "bed and b 2" },
                    new HotelBoardType { Code = "BB", Content = "board type", Name = "bed and b" },
                }, new[] {
                    new RoomType { Code = "TST2", Content = "room type 2", Description = "room type descr 2", Name= "rt 2"},
                    new RoomType { Code = "TW01", Content = "room type", Description = "room type descr", Name = "rt", Images = new List<HotelImage>() { new HotelImage { Small= "http://ggg.png" } } },
                },
                new OfferBoardType { Code = "BB", Title = "bed and b", Content = "board type"},
                new OfferRoomType { Code = "TW01", Title = "rt", Content = "room type", Description = "room type descr", Images = new List<HotelImage>() { new HotelImage { Small= "http://ggg.png" } }}
            };

            yield return new object[] {
                "data exists with boardGroup: should be mapped",
                new[] {
                    new HotelBoardType { Code = "BB2", Content = "board type 2", Name = "bed and b 2" },
                    new HotelBoardType { Code = "BB", Content = "board type", Name = "bed and b", BoardGroup = new BoardGroup(){ Name = "all inclusive", Code = "Al" } },
                }, new[] {
                    new RoomType { Code = "TST2", Content = "room type 2", Description = "room type descr 2", Name= "rt 2"},
                    new RoomType { Code = "TW01", Content = "room type", Description = "room type descr", Name = "rt", Images = new List<HotelImage>() { new HotelImage { Small= "http://ggg.png" } } },
                },
                new OfferBoardType { Code = "BB", Title = "bed and b", Content = "board type", BoardGroup = new BoardGroup(){ Name = "all inclusive", Code = "Al" }},
                new OfferRoomType { Code = "TW01", Title = "rt", Content = "room type", Description = "room type descr", Images = new List<HotelImage>() { new HotelImage { Small= "http://ggg.png" } }}
            };
        }

        [Theory]
        [MemberData(nameof(EnrichAltBoardsNullTestData))]
        public async Task EnrichAltBoards_NullValues_NotThrowException(
            Offer offer,
            Hotel hotel,
            Offer expectedOffer
           )
        {
            // Act
            await _sut.EnrichAltBoards(hotel, offer);

            // Assert
            offer.Should().BeEquivalentTo(expectedOffer);
        }

        public static IEnumerable<object[]> EnrichAltBoardsNullTestData()
        {
            yield return new object[] { null, null, null };
            yield return new object[] { new Offer(), null, new Offer() };
        }

        [Theory]
        [MemberData(nameof(EnrichAltBoardsHappyPathTestData))]
        public async Task EnrichAltBoards_HappyPath_ShouldUpdateBoards(
           HotelBoardType[] boardTypes,
           List<AltBoardType> altBoards,
           List<AltBoardType> expectedAltBoards
          )
        {
            // Arrange
            var hotel = new Hotel
            {
                BoardTypes = boardTypes,
            };

            var offer = new Offer
            {
                AltBoards = altBoards
            };

            // Act
            await _sut.EnrichAltBoards(hotel, offer);

            // Assert
            offer.AltBoards.Should().BeEquivalentTo(expectedAltBoards);
        }


        public static IEnumerable<object[]> EnrichAltBoardsHappyPathTestData()
        {
            // data exists, but codes are different: no maping
            yield return new object[] {
                new[] {
                    new HotelBoardType { Code = "TST", Name = "test board" }
                },
                new List<AltBoardType>(){
                    new AltBoardType {
                        Code="BB",
                        Price = 12,
                        PricePP = 6,
                    }
                },
                new List<AltBoardType>(){
                    new AltBoardType {
                        Title="BB",
                        Code="BB",
                        Price = 12,
                        PricePP = 6,
                    }
                },
            };

            // data exists: all fields should be mapped
            yield return new object[] {
                new[] {
                    new HotelBoardType { Code = "BB2", Content = "board type 2", Name = "bed and b 2" },
                    new HotelBoardType { Code = "BB", Content = "board type", Name = "bed and b", Description = "bb descr", IconUrl = "i" },
                },
                 new List<AltBoardType>(){
                    new AltBoardType {
                        Code="BB",
                        Price = 12,
                        PricePP = 6,
                    }
                },
                new List<AltBoardType>(){
                    new AltBoardType {
                        Code="BB",
                        Price = 12,
                        PricePP = 6,
                        Content = "board type", Title = "bed and b", Description = "bb descr", IconUrl = "i"
                    }
                },
            };
        }

        [Theory]
        [AutoData]
        public async Task GetRoomType_NoRoomSeasonFacilities_MapRoomFacilities(string roomCode, string roomFacilityName, string roomFacilityCode)
        {
            // Arrange

            var hotel = new Hotel
            {
                RoomTypes = new List<RoomType>()
                {
                    new RoomType()
                    {
                        Code = roomCode,
                        Facilities = new List<RoomFacility>()
                        {
                            new RoomFacility()
                            {
                                Name = roomFacilityName,
                                FacilityCode = roomFacilityCode
                            }
                        }
                    }
                }
            };

            var resultRoomType = new OfferRoomType()
            {
                Code = roomCode,
                Facilities = new List<HotelFacility>()
                {
                    new HotelFacility()
                    {
                        Code = roomFacilityCode,
                        Name = roomFacilityName
                    }
                }
            };
            //Act
            var roomType = await _sut.GetRoomType(roomCode, null, hotel, null, null);

            //Assert
            roomType.Should().BeEquivalentTo(resultRoomType);
        }

        [Theory]
        [AutoData]
        public async Task GetRoomType_SuitableRoomSeasonFacilities_MapRoomFacilities(string roomCode, string roomFacilityName, string roomFacilityCode, int offerDuration)
        {
            // Arrange
            var now = DateTime.UtcNow;

            var hotel = new Hotel
            {
                RoomTypes = new List<RoomType>()
                {
                    new RoomType()
                    {
                        Code = roomCode,
                        Facilities = new List<RoomFacility>()
                        {
                            new RoomFacility()
                            {
                                Name = roomFacilityName,
                                FacilityCode = roomFacilityCode,
                                SeasonalFacilitiesDataRange = new List<SeasonalFacilityDateRange>()
                                {
                                    new SeasonalFacilityDateRange()
                                    {
                                        Start = now, End = now.AddDays(offerDuration)
                                    }
                                }
                            }
                        }
                    }
                }
            };

            var resultRoomType = new OfferRoomType()
            {
                Code = roomCode,
                Facilities = new List<HotelFacility>()
                {
                    new HotelFacility() {Code = roomFacilityCode, Name = roomFacilityName}
                }
            };

            //Act
            var roomTypeDatesExactMatch =
                await _sut.GetRoomType(roomCode, null, hotel, now, offerDuration);

            var roomTypeDatesInInterval =
                await _sut.GetRoomType(roomCode, null, hotel, now, offerDuration - 2);

            //Assert
            roomTypeDatesExactMatch.Should().BeEquivalentTo(resultRoomType);
            roomTypeDatesInInterval.Should().BeEquivalentTo(resultRoomType);
        }

        [Theory]
        [AutoData]
        public async Task GetRoomType_NotSuitableRoomSeasonFacilities_NotMapRoomFacilities(string roomCode, string roomFacilityName, string roomFacilityCode, int offerDuration)
        {
            // Arrange
            var now = DateTime.UtcNow;

            var hotel = new Hotel
            {
                RoomTypes = new List<RoomType>()
                {
                    new RoomType()
                    {
                        Code = roomCode,
                        Facilities = new List<RoomFacility>()
                        {
                            new RoomFacility()
                            {
                                Name = roomFacilityName,
                                FacilityCode = roomFacilityCode,
                                SeasonalFacilitiesDataRange = new List<SeasonalFacilityDateRange>()
                                {
                                    new SeasonalFacilityDateRange()
                                    {
                                        Start = now, End = now.AddDays(offerDuration)
                                    }
                                }
                            }
                        }
                    }
                }
            };

            var resultRoomType = new OfferRoomType()
            {
                Code = roomCode,
                //no facilities 
                Facilities = new List<HotelFacility>()
            };

            //Act
            var roomTypeIncorrectStartOfferDate =
                await _sut.GetRoomType(roomCode, null, hotel, now.AddDays(-1), offerDuration);

            var roomTypeIncorrectEndOfferDates =
                await _sut.GetRoomType(roomCode, null, hotel, now, offerDuration + 2);

            //Assert
            roomTypeIncorrectStartOfferDate.Should().BeEquivalentTo(resultRoomType);
            roomTypeIncorrectEndOfferDates.Should().BeEquivalentTo(resultRoomType);
        }
    }
}
