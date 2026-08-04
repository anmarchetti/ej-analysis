using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.BreakdownStrategies;

internal interface IRefundBreakdownStrategy
{
    BookingCancellationReason BookingCancellationReason { get; }

    string PromotionName { get; }

    /// <summary>
    /// Set priority of the strategy, in case multiple strategies are eligible, the one with the highest priority will be selected. Priority should be set in a way that more specific strategies have higher priority than more general ones.
    /// </summary>
    ushort Priority { get; }

    Task<BookingCancellationRefundBreakdown> GetCancellationRefundBreakdown(BookingResponse bookingResponse,
        decimal? feeToOverride, CancellationToken cancellationToken);

    bool ShouldRefund(BookingCancellationReason reason, List<string> promotionNames);
}