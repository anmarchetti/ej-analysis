using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Mappers;
using FluentAssertions;
using Xunit;
using static easyJet.Holidays.Api.Domain.Mappers.AmendFlightsSearchRequestMapper;

namespace easyJet.Holidays.Api.Domain.Tests.Mappers
{
    public class AmendFlightsSearchRequestMapperTests
    {
        private readonly BookingResponse _bookingResponse = new BookingResponse
        {
            Package = new BookingPackage
            {
                Accom = new BookingAccommodation
                {
                    Code = "ACCOM01",
                    StartDate = "2023-11-11",
                    EndDate = "2023-11-19",
                    Rooms = new List<Unit>
                        {
                            new Unit
                            {
                                Code = "DB01",
                                Occupation = new Occupation
                                {
                                    Adults = 2,
                                    ChildAges = new List<uint>()
                                },
                                Board = "HB"
                            }
                        }
                },
                Transport = new Transport
                {
                    Routes = new List<Route> {
                        new Route
                        {
                            FltNo = "001"
                        },
                        new Route
                        {
                            FltNo = "002"
                        }}
                }
            },
            Transfers = new List<TransferItem> { new TransferItem { Code = "TR01" } }
        };

        [Fact]
        public void Map_ForFlight_Success()
        {
            // Arrange
            //Act
            AmendFlightSearchRequest result = _bookingResponse.Map(AmendFlightSearchRequestMapType.Flight);

            // Assert
            result.Room[0].RoomCode.Should().NotBeNull();
            result.BoardType.Should().NotBeNull();
        }

        [Fact]
        public void Map_ForRoomAndBoard_Success()
        {
            // Arrange
            //Act
            AmendFlightSearchRequest result = _bookingResponse.Map(AmendFlightSearchRequestMapType.RoomAndBoard);

            // Assert
            result.Room[0].RoomCode.Should().BeNull();
            result.BoardType.Should().BeNull();
        }
    }
}
