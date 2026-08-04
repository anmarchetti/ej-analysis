using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;

namespace easyJet.Holidays.Api.Domain.Mappers.Builders
{
    /// <summary>
    /// Class To build RoomVariantsSearchRequest 
    /// </summary>
    public static class RoomVariantsSearchRequestBuilder
    {
        /// <summary>
        /// Build RoomVariantsSearchRequest
        /// </summary>
        /// <param name="alternativeFlightsSearchRequest"></param>
        /// <param name="currentOffer"></param>
        /// <param name="booking"></param>
        /// <returns>RoomVariantsSearchRequest object</returns>
        public static RoomVariantsSearchRequest BuildRoomVariantsRequest(BookingResponse booking, AmendFlightSearchRequest alternativeFlightsSearchRequest, Offer currentOffer)
        {
            var currentRoom = booking.Package.Accom.Rooms.FirstOrDefault();

            return new RoomVariantsSearchRequest
            {
                PackageId = currentOffer.Accom.PackageId,
                AccommodationId = currentOffer.Accom.Id,
                Duration = alternativeFlightsSearchRequest.Duration,
                StartDate = alternativeFlightsSearchRequest.StartDate,
                Room = new List<RoomAllocation> {
                    new RoomAllocation {
                        Adults = alternativeFlightsSearchRequest.Adults(),
                        Children = alternativeFlightsSearchRequest.Children(),
                        Infants = alternativeFlightsSearchRequest.Infants(),
                        RoomCode = currentRoom?.Code
                    }},
                DepartureAirport = alternativeFlightsSearchRequest.DepartureAirport,
                BoardType = currentRoom?.Board,
                OutboundRouteId = currentOffer.Transport.Routes[0].Id,
                InboundRouteId = currentOffer.Transport.Routes[1].Id,
                MarketCode = booking.MarketCode
            };
        }
    }
}
