using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Mappers;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Mappers
{
    public class AlternativeRoomAndBoardHotelSearchMapperTests
    {

        [Fact]
        public void MapAlternativeRoomAndBoardRequest_ReturnsAlternativeRoomAndBoardHotelSearchRequest()
        {
            var bookingResponse = new BookingResponse
            {
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        Id = "1",                        
                        StartDate = "startDate",
                        Rooms = new()
                        {
                            new ()
                            {
                                Occupation = new ()
                                {
                                    Adults = 2
                                }
                            }
                        }
                    },
                    Transport = new ()
                    {
                        Routes =
                        [
                            new()
                            {
                                Direction = Direction.Outbound,
                                Car = "EZY",
                                FltNo = "001",
                                DepPt = "LGW",
                                ArrPt = "ALC",
                                DepDate = new DateTimeOffset(2024, 1, 1, 10, 10, 0, TimeSpan.Zero),
                                ArrDate = new DateTimeOffset(2024, 1, 1, 20, 10, 0, TimeSpan.Zero)
                            },

                            new()
                            {
                                Direction = Direction.Inbound,
                                Car = "EZY",
                                FltNo = "001",
                                DepPt = "ALC",
                                ArrPt = "LGW",
                                DepDate = new DateTimeOffset(2024, 1, 8, 10, 10, 0, TimeSpan.Zero),
                                ArrDate = new DateTimeOffset(2024, 1, 8, 20, 10, 0, TimeSpan.Zero)
                            }
                        ]
                    }
                }
            };
            var amendHotelRequest = new AmendHotelRequest
            {
                AmendHotelOffer = new AmendHotelOffer
                {
                    Accom = new()
                    {
                        Id = "1",
                        PackageId = "1",
                        Stay = 7
                    },
                    Transfers = new List<TransferItem> { new TransferItem { Id = "2", Code = "S"} }
                }
            };

            var response = bookingResponse.MapAlternativeRoomAndBoardRequest(amendHotelRequest);
            response.Should().NotBeNull();

            response.OutboundDepartureAirport.Should().NotBeNull();
            response.OutboundArrivalAirport.Should().NotBeNull();
            response.OutboundFltNo.Should().NotBeNull();
            response.OutboundDepartureDateTime.Should().NotBeNull();
            response.OutboundArrDateTime.Should().NotBeNull();

            response.InboundDepartureAirport.Should().NotBeNull();
            response.InboundArrivalAirport.Should().NotBeNull();
            response.InboundFltNo.Should().NotBeNull();
            response.InboundDepartureDateTime.Should().NotBeNull();
            response.InboundArrDateTime.Should().NotBeNull();

            response.AcommodationCode.Should().NotBeNull();
            response.StartDate.Should().NotBeNull();
            response.TransferCode.Should().NotBeNull();
        }
    }
}
