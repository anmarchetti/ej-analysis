using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.RoomAndBoard;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Transfers;

using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Api;

public interface IAmendBookingApi
{
    [Post("/amend/commit")]
    Task<ApiResponse<BookingResponse>> AmmendBooking(
        AmendBookingRequest amendBookingRequest,
        [Header("X-ejh-Idempotency-Key")] string idempotancyHeader,
        [Header("Cookie")] string cookie);

    [Post("/amend/alternative-transfers/price")]
    Task<ApiResponse<AmendBookingTransfersResponse>> AlternativeTransferRequest(AlternativeTransfersSearchRequest request, [Header("Cookie")] string cookie);

    [Post("/amend/alternative-flights/validate")]
    Task<ApiResponse<AlternativeFlightFullPriceResponse>> ValidateAlternativeFlightsRequest(AlternativeFlightFullPriceRequest request, [Header("Cookie")] string cookie);

    [Get("/amend/alternative-flights")]
    Task<ApiResponse<AmendFlightOfferResponse>> AlternativeFlightsRequest(string bookingReference, [Header("Cookie")] string cookie);

    [Post("/amend/amend-ssr")]
    Task<ApiResponse<BookingResponse>> AmendSSR(AmendSsrRequest request, [Header("Cookie")] string cookie);

    [Get("/amend/amend-date/info")]
    Task<ApiResponse<AmendDateInfoResponse>> GetAmendDatesCalendarData(
        [AliasAs("StartDate")] DateTime startDate,
        [AliasAs("EndDate")] DateTime endDate,
        [AliasAs("Duration")] int duration,
        [AliasAs("Departure")] string departure,
        [AliasAs("AccommodationId")] string accommodationId,
        [AliasAs("room[0].children")] int children,
        [AliasAs("room[0].infants")] int infants,
        [AliasAs("room[0].adults")] int adults,
        [AliasAs("room[0].roomCode")] string roomCode,
        [Header("Cookie")] string cookie
        );

    [Get("/amend/amend-dates/summary")]
    Task<ApiResponse<AmendDatesOffer>> GetAmendDatesSummary(
        [AliasAs("bookingRef")] string bookingRef,
        [AliasAs("selectedDate")] string selectedDate,
        [AliasAs("Duration")] int duration,
        [AliasAs("accomId")] string accommodationId,
        [AliasAs("room[0].children")] int children,
        [AliasAs("room[0].infants")] int infants,
        [AliasAs("room[0].adults")] int adults,
        [AliasAs("room[0].roomCode")] string roomCode,
        [AliasAs("boardType")] string board,
        [AliasAs("transferCode")] string transferCode,
        [AliasAs("outboundDepTime")] DateTimeOffset? outboundDepTime,
        [AliasAs("inboundDepTime")] DateTimeOffset? inboundDepTime,
        [Header("Cookie")] string cookie);

    [Post("/amend/amend-dates/transfer")]
    Task<ApiResponse<IEnumerable<AmendDatesOffer>>> GetAvailableTransferOptionForChangeDateFlow(AmendDatesOffer request, [Header("Cookie")] string cookie);

    [Post("/amend/amend-dates/flights")]
    Task<ApiResponse<IEnumerable<AmendDatesOffer>>> GetAlternativeFlightOptionForChangeDateFlow(AmendDatesOffer request, [Header("Cookie")] string cookie);

    [Post("/amend/amend-dates/validate")]
    Task<ApiResponse<IEnumerable<AmendDatesOffer>>> ValidateOffersForChangeDate(IEnumerable<AmendDatesOffer> request, [Header("Cookie")] string cookie);

    [Get("/amend/amend-room-and-board/info")]
    Task<ApiResponse<AmendRoomVariantsResponse>> GetAlternativeRoomAndBoardsFromCache([AliasAs("bookingReference")] string bookingRef, [Header("Cookie")] string cookie);

    [Post("/amend/amend-room-and-board/validate")]
    Task<ApiResponse<List<AmendRoomVariant>>> ValidateAlternativeRoomAndBoard(AmendRoomValidationRequest amendRoomValidationRequest);

    [Post("/amend/seats")]
    Task<ApiResponse<AmendSeatsResponse>> AmendSeats(AmendSeatsRequest amendSeatsRequest, [Header("Cookie")] string cookie);

    [Post("/amend/amend-hotel/hotel-list")]
    Task<ApiResponse<GetAmendHotelListResponse>> GetAmendHotelList(GetAmendHotelListRequest amendHotelListRequest, [Header("Cookie")] string cookie);

    [Post("/amend/amend-hotel/validate")]
    Task<ApiResponse<AmendHotelResponse>> ValidateAlternativeHotel(AmendHotelRequest amendHotelRequest,
        [Header("Cookie")] string cookie);

    [Post("/amend/amend-hotel/alternative-rooms-and-boards")]
    Task<ApiResponse<GetAmendHotelRoomsResponse>> GetAlternativeRoomAndBoardForHotel(
        AmendHotelRequest amendHotelRequest, [Header("Cookie")] string cookie);

    [Post("/amend/amend-hotel/alternative-transfers")]
    Task<ApiResponse<IEnumerable<AmendHotelResponse>>> GetAlternativeTransfersForHotel(
        AmendHotelRequest amendHotelRequest, [Header("Cookie")] string cookie);
}
