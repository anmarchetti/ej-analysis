using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using Refit;
using CancelBookingRequest = easyJet.Holiday.IntegrationTests.Shared.Models.Booking.CancelBookingRequest;
using PayRemainingBalanceRequest = easyJet.Holiday.IntegrationTests.Shared.Models.Booking.PayRemainingBalanceRequest;

namespace easyJet.Holiday.IntegrationTests.Shared.Api;

public interface IBookingApi
{
    [Post("/booking/validate-package")]
    Task<ApiResponse<ValidateBookingResponse>> ValidatePackage(ValidateBookingRequest validateBookingRequest,
        [Header("Cookie")] string cookie = null,
        [Header("Authorization")] string? authorization = null,
        [Header("X-Ej-Sc-Site")] string? site = null);

    [Post("/booking/commit")]
    Task<ApiResponse<BookingResponse>> Commit(
        BookingRequest bookingRequest,
        [Header("X-ejh-Idempotency-Key")] string idempotancyHeader,
        [Header("Cookie")] string cookie,
        [Header("Authorization")] string? authorization = null,
        [Header("X-Ej-Sc-Site")] string? site = null);

    [Get("/booking")]
    Task<ApiResponse<BookingResponse>> DisplayBooking(
        DisplayBookingRequest displayBookingRequest,
        [Header("Cookie")] string cookie = null);

    [Put("/booking/cancel")]
    Task<ApiResponse<BookingResponse>> CancelBooking(
        CancelBookingRequest request,
        [Header("Cookie")] string cookie);

    [Post("/booking/pay-remaining-balance")]
    Task<ApiResponse<BookingResponse>> PayRemainingBalance(
        PayRemainingBalanceRequest payRemainingBalanceRequest,
        [Header("X-ejh-Idempotency-Key")] string idempotancyHeader);

    [Post("/booking/cancellation/summary/customer")]
    Task<BookingCancellationSummaryResponse> CustomerLedCancellationSummary(
        Holidays.Api.Domain.Data.Booking.Cancellation.BookingCancellationSummaryRequest request,
        [Header("Cookie")] string cookie);
    
    [Put("/shared-services/booking/cancellation/customer/override-fee")]
    Task<CancellationResponse> CancelBookingCustomerLedOverrideFee(
        Holidays.Api.Domain.Data.Booking.Cancellation.BookingCancellationWithFeeOverrideRequest request,
        [Header("Authorization")] string authorization);
}