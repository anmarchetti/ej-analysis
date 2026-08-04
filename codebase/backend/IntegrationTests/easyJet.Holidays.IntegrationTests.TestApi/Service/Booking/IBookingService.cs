using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.Booking;

public interface IBookingService
{
    Task<CreateBookingResponse> CreateBookingWithRoom(CreateBookingRequest createBookingRequest);

    Task<CreateBookingsResponse> CreateRandomBooking(CreateBookingRequest createBookingRequest);

    Task<CreateBookingResponse> CreateCancelledWithCreditBooking();

    Task<CreateBookingResponse> CreateCancelledBooking();
    Task<CreateBookingResponse> CreateDepositOnlyBooking();

    [Obsolete]
    Task<CreateBookingResponse> CreateBooking(CreateBookingRequest createBookingRequest);

    Task<DisplayBookingResponse> GetBooking(DisplayBookingRequest createBookingRequest);

    Task<PayRemainingBalanceResponse> PayRemainingBalance(PayRemainingBalanceRequest createBookingRequest);

    Task<BookingCancellationSummaryResponse> CancellationCustomerLedSummary(Holiday.IntegrationTests.Shared.Models.Booking.BookingCancellationSummaryRequest request);
    
    Task<CancellationResponse> CancelBookingCustomerLedOverrideFee(Holiday.IntegrationTests.Shared.Models.Booking.BookingCancellationWithFeeOverrideRequest request);
}