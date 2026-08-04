using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.BreakdownStrategies;

internal class FeeCalculator(IOptions<ApiSettings> apiSettings): IFeeCalculator
{
    private readonly VoucherSettings _voucherSettings = apiSettings?.Value.Vouchers ?? throw new ArgumentNullException(nameof(apiSettings));

    public decimal CalculateFee(BookingResponse bookingResponse)
    {
        var bookingValue = bookingResponse.PaymentInfo?.TotalPrice ?? 0;
        var daysBeforeDeparture = BookingUtils.DaysToDeparture(bookingResponse);
        var numberOfPassengers = bookingResponse.Guests.Count(x => x.Type != PersonType.Infant);

        return daysBeforeDeparture switch
        {
            > 27 => _voucherSettings.DefaultDepositPerPerson * numberOfPassengers,
            > 20 and <= 27 => bookingValue * 0.75m,
            _ => bookingValue
        };
    }
}