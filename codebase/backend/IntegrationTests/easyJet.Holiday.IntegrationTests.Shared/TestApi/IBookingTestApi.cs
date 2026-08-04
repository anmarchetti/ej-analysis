using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using Microsoft.AspNetCore.Mvc;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.TestApi;

public interface IBookingTestApi
{
    [Obsolete]
    [Post("/booking/create-booking")]
    Task<ApiResponse<CreateBookingResponse>> CreateBooking(CreateBookingRequest request);

    [Post("/booking/random-booking")]
    Task<ApiResponse<CreateBookingResponse>> CreateRandomBooking(CreateBookingRequest request);

    [Post("/booking/booking-with-alt-rooms")]
    Task<ApiResponse<CreateBookingResponse>> CreateBookingWithAltRooms(CreateBookingRequest request);

    [Post("/booking/pay-remaining-balance")]
    Task<PayRemainingBalanceResponse> PayRemainingBalance([FromQuery] PayRemainingBalanceRequest request);

    [Post("/bookingcancellation/customer-led-summary")]
    Task<ApiResponse<BookingCancellationSummaryResponse>> CustomerLedSummary(easyJet.Holiday.IntegrationTests.Shared.Models.Booking.BookingCancellationSummaryRequest request);
    
    [Put("/bookingcancellation/customer-led-cancel-booking-override-fee")]
    Task<ApiResponse<CancellationResponse>> CancellationCustomerLedCancelBookingOverrideFee(easyJet.Holiday.IntegrationTests.Shared.Models.Booking.BookingCancellationWithFeeOverrideRequest request);
}