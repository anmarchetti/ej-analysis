using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Mappers.Builders;
using easyJet.Holidays.Api.Domain.Utils;

namespace easyJet.Holidays.Api.Domain.Mappers
{
    /// <summary>
    /// AlternativeFlightsSearchRequest mapper
    /// </summary>
    public static class AmendFlightsSearchRequestMapper
    {
        private const char separator = ',';

        /// <summary>
        /// Maps booking response to AlternativeFlightsSearchRequest
        /// </summary>
        /// <param name="bookingResponse"></param>
        /// <param name="type">Type of mapping</param>
        /// <returns></returns>
        public static AmendFlightSearchRequest Map(this BookingResponse bookingResponse, AmendFlightSearchRequestMapType type) =>
            type switch
            {
                AmendFlightSearchRequestMapType.Flight => MapForFlightsChange(bookingResponse),
                AmendFlightSearchRequestMapType.RoomAndBoard => MapForRoomAndBoardChange(bookingResponse),
                _ => MapForFlightsChange(bookingResponse)
            };


        private static AmendFlightSearchRequest MapForRoomAndBoardChange(BookingResponse bookingResponse)
        {
            var amendFlightSearchRequest = MapToFlightRequest(bookingResponse);
            amendFlightSearchRequest.Room = bookingResponse.Package?.Accom.Rooms?.Select(unit => RoomAllocationBuilder.Create(unit, false)).ToList();
            return amendFlightSearchRequest;
        }

        private static AmendFlightSearchRequest MapForFlightsChange(BookingResponse bookingResponse)
        {
            var amendFlightSearchRequest = MapToFlightRequest(bookingResponse);

            amendFlightSearchRequest.Room = bookingResponse.Package?.Accom.Rooms?.Select(unit => RoomAllocationBuilder.Create(unit)).ToList();
            amendFlightSearchRequest.BoardType = string.Join(separator, bookingResponse.Package.Accom.Rooms.Select(unit => unit.Board).Distinct());
            amendFlightSearchRequest.OriginalAirport = bookingResponse.Package?.Transport.OutboundFlight.DepPt;

            return amendFlightSearchRequest;
        }

        private static AmendFlightSearchRequest MapToFlightRequest(BookingResponse bookingResponse)
        {
            return new AmendFlightSearchRequest
            {
                AccommodationId = bookingResponse.Package.Accom.Code,

                StartDate = bookingResponse.Package.Accom.StartDate,
                Duration = new List<int>()
                {
                    (DateFormatUtils.Parse(bookingResponse.Package.Accom.EndDate) -
                     DateFormatUtils.Parse(bookingResponse.Package.Accom.StartDate)).Days
                },
                ChildAges = string.Join(separator,
                               bookingResponse.Package.Accom.Rooms.SelectMany(unit =>
                                   unit.Occupation.ChildAges.Select(u => u.ToString()))),
                Transfer = bookingResponse.Transfers.FirstOrDefault()?.Code,
                OutboundFlightNo = bookingResponse?.Package?.Transport?.Routes?[0]?.FltNo,
                InboundFlightNo = bookingResponse?.Package?.Transport?.Routes?[1]?.FltNo,
                DiscountCode = bookingResponse?.DiscountCode,
                MarketCode = bookingResponse?.MarketCode
            };
        }

        public static AmendFlightSearchRequest Map(this Offer offer, string discountCode)
        {
            return new AmendFlightSearchRequest
            {
                AccommodationId = offer.Accom.Code,
                BoardType = string.Join(separator, offer.Accom.Unit.Select(unit => unit.Board).Distinct()),
                StartDate = DateFormatUtils.DateOnly(offer.Accom.Date),
                Duration = new List<int>()
                {
                    (int)offer.Accom.Stay
                },
                Room = offer.Accom.Unit?.Select(unit => RoomAllocationBuilder.Create(unit)).ToList(),
                ChildAges = string.Join(separator, offer.Accom.Unit.SelectMany(unit => unit.Occupation.ChildAges.Select(u => u.ToString()))),
                Transfer = offer.Transfers.FirstOrDefault()?.Code,
                OutboundFlightNo = offer.Transport?.Routes?[0]?.FlightNumberWithoutCar,
                InboundFlightNo = offer.Transport?.Routes?[1]?.FlightNumberWithoutCar,
                DiscountCode = discountCode,
                OriginalAirport = offer.Transport?.OutboundFlight?.DepPt
            };
        }
    }
}
