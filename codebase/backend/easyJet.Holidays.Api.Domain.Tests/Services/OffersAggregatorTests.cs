using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Mappers;
using easyJet.Holidays.Api.Domain.Services;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using FluentAssertions;
using Moq;
using System.Collections;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services
{
    public class OffersAggregatorTests
    {
        private OffersAggregator _sut;
        private readonly Mock<IOfferHotelMapper> _offerHotelMapperMock = new Mock<IOfferHotelMapper>();
        
        public OffersAggregatorTests()
        {
            var mapper = new OfferHotelMapper(new Mock<IReferenceDataService>().Object, new Mock<IHotelThemeService>().Object, null);
            _sut = new OffersAggregator(mapper);
        }

        [Theory]
        [ClassData(typeof(NullPackageOffersTestData))]
        public async Task Combine_NullValuesInPackage_ExceptionNotThrown(SearchOffersResponse packages, Hotel[] hotels)
        {
            // Act
            Func<Task> act = async () => await _sut.Combine(
                packages,
                hotels);

            // Assert
            await act.Should().NotThrowAsync();
        }

        [Theory]
        [ClassData(typeof(HappyPathTestData))]
        public async Task Combine_HappyPathData_Calculated(string because, List<Offer> offers, Hotel[] hotels, List<Offer> expected)
        {
            // Arrange
            SearchOffersResponse packages = new SearchOffersResponse
            {
                Offers = offers
            };

            _offerHotelMapperMock
                .Setup(x => x.MapWithoutBoardsRooms(It.IsAny<Hotel>(), It.IsAny<string>(), It.IsAny<BaseSearchRequest>()))
                .ReturnsAsync(new OfferHotel());

            // Act
            var result = await _sut.Combine(
                packages,
                hotels);

            // Assert
            result.Offers.Should().BeEquivalentTo(expected, because);
        }
        
        [Fact]
        public async Task EnrichAccomWithHotelInfo_ShouldReturnNull_WhenAccomCodeIsNull()
        {
            // Arrange
            var accom = new Accom { Code = null };

            // Act
            var result = await _sut.EnrichAccomWithHotelInfo(accom, []);

            // Assert
            result.Should().BeNull();
        }
        
        [Fact]
        public async Task EnrichAccomWithHotelInfo_ShouldReturnNull_WhenHotelIsNotFound()
        {
            // Arrange
            var accom = new Accom { Code = "H1" };

            // Act
            var result = await _sut.EnrichAccomWithHotelInfo(accom, []);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task EnrichAccomWithHotelInfo_ShouldCallMapper_WhenAccomCodeAndHotelExist()
        {
            // Arrange
            var accom = new Accom { Code = "H1", Prom = "Prom1", Unit = new List<Unit> { new Unit() } };
            var hotel = new Hotel { Code = "H1" };
            var hotels = new List<Hotel> { hotel };

            _offerHotelMapperMock
                .Setup(m => m.MapWithoutBoardsRooms(It.IsAny<Hotel>(), It.IsAny<string>(), It.IsAny<BaseSearchRequest>()))
                .ReturnsAsync(new OfferHotel());

            _offerHotelMapperMock
                .Setup(m => m.EnrichBoardTypeAndRoomType(It.IsAny<Hotel>(), It.IsAny<Unit>(), It.IsAny<DateTime?>(),It.IsAny<int?>()))
                .Returns(Task.CompletedTask);

            // Act
            _sut = new OffersAggregator(_offerHotelMapperMock.Object);
            var result = await _sut.EnrichAccomWithHotelInfo(accom, hotels);

            // Assert
            _offerHotelMapperMock.Verify(m => m.MapWithoutBoardsRooms(hotel, accom.Prom, It.IsAny<BaseSearchRequest>()), Times.Once);
            _offerHotelMapperMock.Verify(m => m.EnrichBoardTypeAndRoomType(hotel, accom.Unit.First(), It.IsAny<DateTime?>(),It.IsAny<int?>()), Times.Once);
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task EnrichAccomWithHotelInfo_ShouldNotCallEnrichBoardTypeAndRoomType_WhenUnitsAreNull()
        {
            // Arrange
            var accom = new Accom { Code = "H1", Prom = "Prom1", Unit = null };
            var hotel = new Hotel { Code = "H1" };
            var hotels = new List<Hotel> { hotel };

            _offerHotelMapperMock
                .Setup(m => m.MapWithoutBoardsRooms(It.IsAny<Hotel>(), It.IsAny<string>(), It.IsAny<BaseSearchRequest>()))
                .ReturnsAsync(new OfferHotel());

            // Act
            _sut = new OffersAggregator(_offerHotelMapperMock.Object);
            var result = await _sut.EnrichAccomWithHotelInfo(accom, hotels);

            // Assert
            _offerHotelMapperMock.Verify(m => m.MapWithoutBoardsRooms(hotel, accom.Prom, It.IsAny<BaseSearchRequest>()), Times.Once);
            _offerHotelMapperMock
                .Verify(m => m.EnrichBoardTypeAndRoomType(It.IsAny<Hotel>(), It.IsAny<Unit>(), It.IsAny<DateTime?>(),It.IsAny<int?>()), Times.Never);
            result.Should().NotBeNull();
        }
    }

    class NullPackageOffersTestData : IEnumerable<object[]>
    {
        public IEnumerator<object[]> GetEnumerator()
        {
            yield return new object[] {null, null};
            yield return new object[] {new SearchOffersResponse(), null};
            yield return new object[]
            {
                new SearchOffersResponse
                {
                    Offers = new List<Offer>()
                },
                new[]
                {
                    new Hotel {Code = "1"}
                }
            };
        }

        IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
    }

    class HappyPathTestData : IEnumerable<object[]>
    {
        public IEnumerator<object[]> GetEnumerator()
        {
            // Offers
            // Hotels
            // Result

            yield return new object[] {
                "No hotels. Should be no offers",
                new List<Offer>() {
                    new Offer {
                        Accom = new Accom {
                            Code = "1"
                        }
                    }
                },
                new Hotel[]
                {
                },
                new List<Offer>(),
            };

            yield return new object[]
            {
                "Hotel should be mapped",
                new List<Offer>()
                {
                    new Offer
                    {
                        Accom = new Accom
                        {
                            Code = "1"
                        }
                    }
                },
                new[]
                {
                    new Hotel
                    {
                        Code = "1",
                        Name = "hotel 1",
                        Description = "desc 1",
                        NumberOfReviews = 123,
                        Rating = 1.45,
                        Country = new Country
                        {
                            Code = "HOT123",
                            Name = "Cyprus",
                            Url = "/Cyprus"
                        }
                    }
                },
                new List<Offer>()
                {
                    new Offer
                    {
                        Accom = new Accom
                        {
                            Code = "1"
                        },
                        Hotel = new OfferHotel
                        {
                            Description = "desc 1",
                            Name = "hotel 1",
                            NumberOfReviews = 123,
                            TripAdvisorRating = 1.45,
                            Country = new HotelCountry
                            {
                                Code = "HOT123",
                                Name = "Cyprus",
                                Url = "/Cyprus"
                            },
                            Airports = new List<string>(),
                            Facilities = new List<HotelFacilityGroup>(),
                            Images = new List<HotelImage>()
                        }
                    }
                },
            };

            yield return new object[]
            {
                "Hotel should be mapped with Unit boards and rooms",
                new List<Offer>()
                {
                    new Offer
                    {
                        Accom = new Accom
                        {
                            Code = "1",
                            Unit = new List<Unit>()
                            {
                                new Unit
                                {
                                    Board = "BB",
                                    Code = "TW"
                                }
                            },
                        }
                    }
                },
                new[]
                {
                    new Hotel
                    {
                        Code = "1",
                        Name = "hotel 1",
                        Description = "desc 1",
                        NumberOfReviews = 123,
                        Country = new Country
                        {
                            Code = "HOT123",
                            Name = "Cyprus",
                            Url = "/Cyprus"
                        },
                        BoardTypes = new[]
                        {
                            new Domain.Data.Hotels.BoardType
                            {
                                Code = "BB",
                                Name = "Bed & breakfest"
                            }
                        },
                        RoomTypes = new[]
                        {
                            new Domain.Data.Hotels.RoomType
                            {
                                Code = "TW",
                                Name = "Twin Room"
                            }
                        }
                    }
                },
                new List<Offer>()
                {
                    new Offer
                    {
                        Accom = new Accom
                        {
                            Code = "1",
                            Unit = new List<Unit>()
                            {
                                new Unit
                                {
                                    Board = "BB",
                                    BoardType = new()
                                    {
                                        Code = "BB",
                                        Title = "Bed & breakfest"
                                    },
                                    Code = "TW",
                                    RoomType = new()
                                    {
                                        Code = "TW",
                                        Title = "Twin Room"
                                    }
                                }
                            },
                        },
                        Hotel = new OfferHotel
                        {
                            Description = "desc 1",
                            Name = "hotel 1",
                            NumberOfReviews = 123,
                            Country = new HotelCountry
                            {
                                Code = "HOT123",
                                Name = "Cyprus",
                                Url = "/Cyprus"
                            },
                            Airports = new List<string>(),
                            Facilities = new List<HotelFacilityGroup>(),
                            Images = new List<HotelImage>()
                        }
                    }
                },
            };

            yield return new object[]
            {
                "Multiple hotels with same code. First should be mapped",
                new List<Offer>()
                {
                    new Offer
                    {
                        Accom = new Accom
                        {
                            Code = "1"
                        }
                    }
                },
                new[]
                {
                    new Hotel
                    {
                        Code = "1",
                        Name = "hotel 1",
                        Description = "desc 1",
                        Country = new Country
                        {
                            Code = "HOT123",
                            Name = "Cyprus",
                            Url = "/Cyprus"
                        },
                        NumberOfReviews = 45
                    },
                    new Hotel
                    {
                        Code = "1",
                        Name = "hotel 2",
                        Description = "desc 2"
                    }
                },
                new List<Offer>()
                {
                    new Offer
                    {
                        Accom = new Accom
                        {
                            Code = "1"
                        },
                        Hotel = new OfferHotel
                        {
                            Description = "desc 1",
                            Name = "hotel 1",
                            NumberOfReviews = 45,
                            Country = new HotelCountry
                            {
                                Code = "HOT123",
                                Name = "Cyprus",
                                Url = "/Cyprus"
                            },
                            Airports = new List<string>(),
                            Facilities = new List<HotelFacilityGroup>(),
                            Images = new List<HotelImage>()
                        }
                    }
                },
            };
        }

        IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
    }
}