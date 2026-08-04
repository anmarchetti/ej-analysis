using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holiday.IntegrationTests.Shared.Models.TradePortals;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Data.Seats;
using Route = easyJet.Holidays.Api.Domain.Data.PackageOffers.Route;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.Booking
{
    public interface IBookingApiService
    {
        Task<BookingResponse> CommitBooking(Offer offer, ValidateBookingResponse validateResponse,
            BookingCreationParams bookingParams, Customer? customer, Payment? payment, Agent? agent,
            bool isTradePortal = false);
        Task<AlternativeFlightsResponse> GetAlternativeFlights(Offer offer);
        Task<RoomVariantsSearchResponse> GetAlternativeRoomsAndBoards(Offer offer);
        Task<Offer[]> GetOffers(BookingCreationParams bookingParams);
        Task<List<SeatMapSeat>> GetSeats(Route route, BookingCreationParams bookingParams);
        Task<bool> IsPromocodeValid(string promocode);
        void SetLanguage(string language);
        Task<ValidateBookingResponse> ValidatePackage(Offer offer, BookingCreationParams bookingParams,
            List<SeatMap>? seatSelection = null, Agent? agent = null, bool isTradePortal = false);
    }
}