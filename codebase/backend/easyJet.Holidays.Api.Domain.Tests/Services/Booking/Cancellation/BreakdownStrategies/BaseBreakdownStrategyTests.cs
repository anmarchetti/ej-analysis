using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Utils;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation.BreakdownStrategies;

public abstract class BaseBreakdownStrategyTests : BaseCancellationTests
{
#if DEBUG
    private static readonly Object Obj = new ();
    private static bool _firstLineAdded;
    private static readonly string LogFileName = $"CancellationUnitTests_{DateTime.UtcNow.Ticks}.csv";
    protected static void Log(BookingResponse request, BookingCancellationRefundBreakdown response, object objThis)
    {
        lock (Obj)
        {
            if (!_firstLineAdded)
            {
                File.AppendAllLines(LogFileName,
                    new string[]
                    {
                        $"Type,TotalPrice,PaidInOneTimeCredit,PaidInOthersMethod,DaysBeforeDeparture,GuestsCount,CancelFeeAmount,OneTimeUseCreditKeptAmount,OneTimeUseCreditRefundAmount,TotalRefundAmount,TotalRefundAmountExceptOneTimeUseCreditRefundAmount"
                    });
                _firstLineAdded = true;
            }

            File.AppendAllLines(LogFileName, new []
            {
#pragma warning disable CA1062
                $"{objThis.GetType().Name}," +
                $"{request.PaymentInfo?.TotalPrice}," +
                $"{request.PaymentInfo?.PaymentHistory?.Where(x => x.IsOneTimeUseCredit).Sum(x => x.Amount)}," +
                $"{request.PaymentInfo?.PaymentHistory?.Where(x => !x.IsOneTimeUseCredit).Sum(x => x.Amount)}," +
                $"{BookingUtils.DaysToDeparture(request)}," +
                $"{request.Guests.Count}," +
                $"{response.CancelFeeAmount}," +
                $"{response.OneTimeUseCreditKeptAmount}," +
                $"{response.OneTimeUseCreditRefundAmount}," +
                $"{response.TotalRefundAmount}," +
                $"{response.TotalRefundAmountExceptOneTimeUseCreditRefundAmount}"
#pragma warning restore CA1062
            });
        }
    }
#endif
}