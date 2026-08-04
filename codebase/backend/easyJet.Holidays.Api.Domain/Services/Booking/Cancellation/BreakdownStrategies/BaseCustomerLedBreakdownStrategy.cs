using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.BreakdownStrategies;

internal abstract class BaseCustomerLedBreakdownStrategy(
    IInfoCancellationService infoCancellationService,
    IBookingCancellationCreditRulesEngine bookingCancellationRulesEngine,
    IFeeCalculator feeCalculator) : BaseRefundBreakdownStrategy(infoCancellationService, feeCalculator)
{
    protected async Task<bool> HasMatchingDestinationRule(BookingResponse bookingResponse)
    {
        var eligibleCreditOnlyRules = await bookingCancellationRulesEngine.FindEligibleRule(bookingResponse);
        return eligibleCreditOnlyRules is { Count: > 0 };
    }

    protected static decimal GetRefundCashAmount(decimal cashRefundAmountInBooking, bool hasMatchingDestinationRule)
    {
        //If the destination rule matches, we don't need to refund cash because the user can only refund in credit.
        if (hasMatchingDestinationRule)
            return 0;

        return cashRefundAmountInBooking;
    }
}
