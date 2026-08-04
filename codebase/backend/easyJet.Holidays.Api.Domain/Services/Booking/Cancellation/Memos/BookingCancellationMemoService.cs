#nullable enable

using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Monitoring;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.Memos;

internal sealed class BookingCancellationMemoService(
    IBookingRepository bookingRepository,
    IBookingCancellationRepCodeService bookingCancellationRepCodeService,
    IOptions<ApiSettings> apiSettings,
    IBookingBlockCheckerService bookingBlockCheckerService,
    ILogger<BookingCancellationMemoService> logger,
    IMetricsService metricsService) : IBookingCancellationMemoService
{
    private const string MemoTypeLabel = "memo_type";
    private const string StatusLabel = "status";

    public async ValueTask AddMemosToBooking(BookingResponse bookingResponse,
        BookingCancellationReason bookingCancellationReason, double daysToDeparture, decimal? creditRefundAmount,
        decimal? cashRefundAmount, CancellationReason? reason, string? reasonNote, string? agentName, string source, 
        decimal? retainedAmountOtuc, decimal? issuedAmountOtuc, CancellationToken cancellationToken = default)
    {
        try
        {
            logger.LogInformation(
                "Generating memos: BookingReference={BookingReference}, BookingCancellationReason={BookingCancellationReason}, DaysToDeparture={DaysToDeparture}, CreditRefundAmount={CreditRefundAmount}, CashRefundAmount={CashRefundAmount}, CancellationReason={Reason}, ReasonNote={ReasonNote}, AgentName={AgentName}, Source={Source}, RetainedAmountOtuc={RetainedAmountOtuc}, IssuedAmountOtuc={IssuedAmountOtuc}",
                bookingResponse.BookingReference, bookingCancellationReason, daysToDeparture, creditRefundAmount,
                cashRefundAmount, reason, reasonNote, agentName, source, retainedAmountOtuc, issuedAmountOtuc);
            var bookingMemoSettings = apiSettings.Value.BookingsMemos;
            
            IList<BookingMemo> memos = new List<BookingMemo>();
            var repCodeMemo = ApplyRepCodeStrategies(bookingResponse, bookingCancellationReason, daysToDeparture,
                creditRefundAmount, cashRefundAmount);
            if (repCodeMemo != null)
            {
                memos.Add(repCodeMemo);
            }

            var reasonMemo = CreateMemoWithReason(reason, reasonNote);
            if (reasonMemo != null)
            {
                memos.Add(reasonMemo);
            }

            if (!string.IsNullOrEmpty(agentName))
            {
                memos.Add(new BookingMemo() { Code = "CA", Description = agentName });
            }

            if (!string.IsNullOrEmpty(source))
            {
                memos.Add(new BookingMemo() { Code = "BS", Description = source });
            }
            
            if (retainedAmountOtuc > 0)
            {
                memos.Add(new BookingMemo()
                {
                    Code = bookingMemoSettings.RetainedOtuc.Code,
                    Description = $"{bookingMemoSettings.RetainedOtuc.Description} {retainedAmountOtuc} {bookingResponse.Currency.Code}"
                });
            }
            
            if (issuedAmountOtuc > 0)
            {
                memos.Add(new BookingMemo()
                {
                    Code = bookingMemoSettings.IssuedOtuc.Code,
                    Description = $"{bookingMemoSettings.IssuedOtuc.Description} {issuedAmountOtuc} {bookingResponse.Currency.Code}"
                });
            }
            
            await SaveMemo(bookingResponse, memos, cancellationToken);

            foreach (var memo in memos)
            {
                var memoType = GetMemoType(memo.Code);
                metricsService.IncrementCounter(CancellationMetricConstants.MemoAddedTotal, 1,
                    new KeyValuePair<string, object>(MemoTypeLabel, memoType),
                    new KeyValuePair<string, object>(StatusLabel, MetricConstants.SuccessMetricStatus));
            }
        }
        catch (Exception ex)
        {
            metricsService.IncrementCounter(CancellationMetricConstants.MemoAddedTotal, 1,
                new KeyValuePair<string, object>(MemoTypeLabel, "unknown"),
                new KeyValuePair<string, object>(StatusLabel, MetricConstants.FailureMetricStatus));
            logger.LogWarning(ex, "Adding memos to bookingReference: {BookingReference} failed after cancellation and refund. Continuing without blocking the process.", bookingResponse.BookingReference);
        }
    }

    public async ValueTask AddFailedCancellationMemo(BookingResponse bookingResponse, CancellationToken cancellationToken = default)
    {
        try
        { 
            metricsService.IncrementCounter(CancellationMetricConstants.RetryTotal, 1);

            var bookingMemoSettings = apiSettings.Value.BookingsMemos;
            var failedCancellationCount = 1;

            var memo = bookingResponse.Memo?.LastOrDefault(x => x.Code == bookingMemoSettings.FailedCancellation.Code);
            if (memo != null)
            {
                failedCancellationCount = bookingBlockCheckerService.GetTrailingNumberFromMemoText(memo.Text) + 1;
            }

            var failedCancellationMemo = new BookingMemo()
            {
                Code = bookingMemoSettings.FailedCancellation.Code,
                Description = $"{bookingMemoSettings.FailedCancellation.Description} {failedCancellationCount}"
            };

            await SaveMemo(bookingResponse, [failedCancellationMemo], cancellationToken);

            metricsService.IncrementCounter(CancellationMetricConstants.MemoAddedTotal, 1,
                new KeyValuePair<string, object>(MemoTypeLabel, "failed_cancellation"),
                new KeyValuePair<string, object>(StatusLabel, MetricConstants.SuccessMetricStatus));
        }
        catch (Exception ex)
        {
            metricsService.IncrementCounter(CancellationMetricConstants.MemoAddedTotal, 1,
                new KeyValuePair<string, object>(MemoTypeLabel, "failed_cancellation"),
                new KeyValuePair<string, object>(StatusLabel, MetricConstants.FailureMetricStatus));
            logger.LogWarning(ex, "Adding memo with fails amount failure to bookingReference: {BookingReference} failed. Continuing without blocking the process.", bookingResponse.BookingReference);
        }
    }

    private BookingMemo? ApplyRepCodeStrategies(BookingResponse bookingResponse,
        BookingCancellationReason bookingCancellationReason, double daysToDeparture, decimal? creditRefundAmount,
        decimal? cashRefundAmount)
    {
        logger.LogDebug(
            "Applying rep code strategies with parameters: BookingReference={BookingReference}, BookingCancellationReason={BookingCancellationReason}, DaysToDeparture={DaysToDeparture}, CreditRefundAmount={CreditRefundAmount}, CashRefundAmount={CashRefundAmount}, IsDestinationRulesApplied={IsDestinationRulesApplied}",
            bookingResponse.BookingReference, bookingCancellationReason, daysToDeparture, creditRefundAmount,
            cashRefundAmount, bookingResponse.IsDestinationRulesApplied);

        var repCode = bookingCancellationRepCodeService.GetRepCode(bookingCancellationReason,
            daysToDeparture, creditRefundAmount, cashRefundAmount, bookingResponse.IsDestinationRulesApplied);

        logger.LogInformation(
            "Applied {RepCode} rep code for parameters: BookingReference={BookingReference}, BookingCancellationReason={BookingCancellationReason}, DaysToDeparture={DaysToDeparture}, CreditRefundAmount={CreditRefundAmount}, CashRefundAmount={CashRefundAmount}, IsDestinationRulesApplied={IsDestinationRulesApplied}",
            repCode, bookingResponse.BookingReference, bookingCancellationReason, daysToDeparture, creditRefundAmount,
            cashRefundAmount, bookingResponse.IsDestinationRulesApplied);
        if (repCode == null)
        {
            return null;
        }

        var memo = CreateMemoWithRepCode(repCode, creditRefundAmount, cashRefundAmount);
        return memo;
    }

    private static BookingMemo CreateMemoWithRepCode(string repCode, decimal? creditRefundAmount,
        decimal? cashRefundAmount)
    {
        var memoDescription = string.Create(CultureInfo.InvariantCulture,
            $"Refund £{cashRefundAmount ?? 0} cash, £{creditRefundAmount ?? 0} credit");
        return new BookingMemo { Code = repCode, Description = memoDescription };
    }

    [System.Diagnostics.CodeAnalysis.SuppressMessage("SonarLint", "S1172:Unused method parameters should be removed",
        Justification = "Parameter required for method signature consistency.")]
    private async ValueTask SaveMemo(BookingResponse bookingResponse, IList<BookingMemo> memos,
        // ReSharper disable once UnusedParameter.Local
        CancellationToken cancellationToken = default)
    {
        foreach (var memo in memos)
        {
            await bookingRepository.ModifyMemo(bookingResponse.BookingReference, memo);
        }
    }

    private static BookingMemo? CreateMemoWithReason(CancellationReason? reason, string? note) =>
        reason switch
        {
            CancellationReason.CustomerCancellation => new BookingMemo
            {
                Code = "CC", Description = note ?? "Customer cancellation"
            },
            CancellationReason.Bereavement => new BookingMemo
            {
                Code = "CB", Description = note ?? "Customer Bereavement"
            },
            CancellationReason.SignificantChangeDisruption => new BookingMemo
            {
                Code = "CFD", Description = note ?? "Significant Change (Disruption)"
            },
            CancellationReason.SignificantChangeOverbooking => new BookingMemo
            {
                Code = "CHD", Description = note ?? "Significant Change (Overbooking)"
            },
            CancellationReason.Illness => new BookingMemo { Code = "CI", Description = note ?? "Customer Illness" },
            CancellationReason.Fraud => new BookingMemo { Code = "RPT", Description = note ?? "deny RPT" },
            CancellationReason.NonPayment => new BookingMemo { Code = "CNP", Description = note ?? "Non Payment" },
            CancellationReason.TestBooking => new BookingMemo { Code = "TB", Description = note ?? "Test booking" },
            _ => GetDefault(note)
        };

    private static BookingMemo? GetDefault(string? note)
    {
        if (string.IsNullOrEmpty(note))
            return null;

        return new BookingMemo() { Code = "BC", Description = note };
    }

    private static string GetMemoType(string code)
    {
        return code switch
        {
            "CA" => "agent",
            "BS" => "source",
            "CC" or "CB" or "CFD" or "CHD" or "CI" or "RPT" or "CNP" or "TB" or "BC" => "reason",
            _ when code.StartsWith('R') => "repcode",
            _ => "other"
        };
    }
}