using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.BreakdownStrategies;

/// <summary>
/// Trade portal Fee Calculator
/// </summary>
public interface IFeeCalculator
{
    /// <summary>
    /// Calculates the cancellation fee based on the booking response
    /// </summary>
    /// <param name="bookingResponse"></param>
    /// <returns></returns>
    public decimal CalculateFee(BookingResponse bookingResponse);
}