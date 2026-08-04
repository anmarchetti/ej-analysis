using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Mappers
{
    public class BookingResponseOfferMapperTests
    {
        private IFixture _fixture { get; set; }

        private readonly Mock<ILogger<BookingResponseOfferMapper>> _loggerMock =
            new Mock<ILogger<BookingResponseOfferMapper>>();

        private readonly IBookingResponseOfferMapper _bookingResponseOfferMapper;

        public BookingResponseOfferMapperTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _loggerMock = _fixture.Freeze<Mock<ILogger<BookingResponseOfferMapper>>>();
            _bookingResponseOfferMapper = new BookingResponseOfferMapper(_loggerMock.Object);
        }
        
        [Fact]
        public void Map_NullBookingResponse_returnNull()
        {
            // Act
            var offer = _bookingResponseOfferMapper.Map(null);

            // Assert
            using (new AssertionScope())
            {
                offer.Should().BeNull();
            }
        }
        
        [Fact]
        public void Map_InvalidEndDateFormat_returnNull()
        {
            //Arrange
            BookingResponse input = new BookingResponse
            {
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        Code = "code",
                        Rooms = new List<Unit>(),
                        IsExt = true,
                        StartDate = "2022-01-01",
                        EndDate = "2023-13-13", // month 13
                        Prom = String.Empty
                    }
                }
            };
            
            // Act
            var offer = _bookingResponseOfferMapper.Map(input);

            // Assert
            using (new AssertionScope())
            {
                offer.Should().BeNull();
            }
        }
        
        [Fact]
        public void Map_InvalidStartDateFormat_returnNull()
        {
            //Arrange
            BookingResponse input = new BookingResponse
            {
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        Code = "code",
                        Rooms = new List<Unit>(),
                        IsExt = true,
                        StartDate = "2022-13-13", // month 13
                        EndDate = "2023-01-08",
                        Prom = String.Empty
                    }
                }
            };
            
            // Act
            var offer = _bookingResponseOfferMapper.Map(input);

            // Assert
            using (new AssertionScope())
            {
                offer.Should().BeNull();
            }
        }


        [Theory]
        [MemberData(nameof(GetData))]
        public void Map_ValidInput_Success(BookingResponse input, Offer expectedOutput)
        {
            // Act
            var offer = _bookingResponseOfferMapper.Map(input);

            // Assert
            offer.Should().BeEquivalentTo(expectedOutput);
        }
        public static IEnumerable<object[]> GetData()
        {
            yield return new object[]
            {
                new BookingResponse
                {
                    BookingReference = "1",
                    Package = new BookingPackage
                    {
                        Accom = new BookingAccommodation
                        {
                            Code = "code",
                            Rooms = new List<Unit>(),
                            IsExt = true,
                            StartDate = "2022-01-01",
                            EndDate = "2022-01-08",
                            Prom = String.Empty
                        }
                    }
                },
                new Offer
                {
                   Accom = new Accom
                   {
                       Code = "code",
                       Unit = new List<Unit>(),
                       IsExternal = true,
                       Date  = new DateTime(2022,1,1),
                       Stay = 7,
                       Prom = String.Empty,
                       PackageId = "1",
                       Id = "code"
                   }
                }
            };
        }
    }
}
