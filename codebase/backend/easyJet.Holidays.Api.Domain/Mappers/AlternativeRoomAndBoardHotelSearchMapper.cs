using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.Hotel;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using System.Globalization;

namespace easyJet.Holidays.Api.Domain.Mappers
{
    /// <summary>
    /// Map offer to cache search request
    /// </summary>
    public static class AlternativeRoomAndBoardHotelSearchMapper 
    {
        /// <summary>
        /// Map offer to cache search request
        /// </summary>
        /// <param name="bookingResponse"></param>
        /// <param name="amendHotelRequest"></param>
        /// <returns></returns>
        public static AlternativeRoomAndBoardHotelSearchRequest MapAlternativeRoomAndBoardRequest(this BookingResponse bookingResponse, AmendHotelRequest amendHotelRequest)
        {
            ArgumentNullException.ThrowIfNull(bookingResponse);
            ArgumentNullException.ThrowIfNull(amendHotelRequest);

            var dateFormat = "yyyy-MM-dd:HHmm";
            var outboundDepartureAirport = bookingResponse.Package.Transport.OutboundFlight.DepPt;
            var outboundArrivalAirport = bookingResponse.Package.Transport.OutboundFlight.ArrPt;
            var outboundFlightNo = $"{bookingResponse.Package.Transport.OutboundFlight.Car}{bookingResponse.Package.Transport.OutboundFlight.FltNo}";
            var outboundDepartureTime = bookingResponse.Package.Transport.OutboundFlight.DepDate?.ToString(dateFormat, CultureInfo.InvariantCulture) ?? string.Empty;
            var outboundArrivalTime = bookingResponse.Package.Transport.OutboundFlight.ArrDate?.ToString(dateFormat, CultureInfo.InvariantCulture) ?? string.Empty;
            var inboundDepartureAirport = bookingResponse.Package.Transport.ReturnFlight.DepPt;
            var inboundArrivalAirport = bookingResponse.Package.Transport.ReturnFlight.ArrPt;
            var inboundFlightNo = $"{bookingResponse.Package.Transport.ReturnFlight.Car}{bookingResponse.Package.Transport.ReturnFlight.FltNo}";
            var inboundDepartureTime = bookingResponse.Package.Transport.ReturnFlight.DepDate?.ToString(dateFormat, CultureInfo.InvariantCulture) ?? string.Empty;
            var inboundArrivalTime = bookingResponse.Package.Transport.ReturnFlight.ArrDate?.ToString(dateFormat, CultureInfo.InvariantCulture) ?? string.Empty;

            var rooms = new List<RoomAllocation>();

            foreach (var room in bookingResponse.Package.Accom.Rooms)
            {
                rooms.Add(new RoomAllocation
                {
                    Adults = room.Occupation.Adults,
                    Children = room.Occupation.Children,
                    Infants = room.Occupation.Infants,
                    RoomCode = room?.Code
                });
            }

            return new AlternativeRoomAndBoardHotelSearchRequest
            {
                OutboundDepartureAirport = outboundDepartureAirport,
                OutboundArrivalAirport = outboundArrivalAirport,
                OutboundFltNo = outboundFlightNo,
                OutboundDepartureDateTime = outboundDepartureTime,
                OutboundArrDateTime = outboundArrivalTime,

                InboundDepartureAirport = inboundDepartureAirport,
                InboundArrivalAirport = inboundArrivalAirport,
                InboundFltNo = inboundFlightNo,
                InboundDepartureDateTime = inboundDepartureTime,
                InboundArrDateTime = inboundArrivalTime,

                AcommodationCode = amendHotelRequest.AmendHotelOffer.Accom.PackageId,
                StartDate = bookingResponse.Package.Accom.StartDate,
                Duration = new List<int> { amendHotelRequest.AmendHotelOffer.Accom.Stay },
                TransferCode = amendHotelRequest.AmendHotelOffer.Transfers.FirstOrDefault()?.Code ?? string.Empty,
                Room = rooms
            };
        }

    }
}
