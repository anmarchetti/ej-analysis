using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Time;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.Api.Domain.Services.Booking;

/// <inheritdoc />
public class BookingCreditExpiryStateService : IBookingCreditExpiryStateService
{
    private readonly VoucherSettings _voucherSettings;
    private readonly ITimeProvider _timeProvider;
    private readonly IVouchersRepository _vouchersRepository;
    private readonly ILogger<BookingCreditExpiryStateService> _logger;

    /// <summary>
    /// Creates a new credit expiry evaluator.
    /// </summary>
    public BookingCreditExpiryStateService(
        IOptions<ApiSettings> apiSettings,
        ITimeProvider timeProvider,
        IVouchersRepository vouchersRepository = null,
        ILogger<BookingCreditExpiryStateService> logger = null)
    {
        ArgumentNullException.ThrowIfNull(apiSettings);
        if (apiSettings.Value == null)
        {
            throw new ArgumentNullException(nameof(apiSettings));
        }
        _voucherSettings = apiSettings.Value.Vouchers ?? throw new ArgumentNullException(nameof(apiSettings));
        _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));
        _vouchersRepository = vouchersRepository;
        _logger = logger;
    }

    /// <inheritdoc />

    /// <summary>
    /// Asynchronous implementation which may call external voucher repository.
    /// </summary>
    public async Task<BookingCreditExpiryState> GetCreditExpiryStateAsync(BookingResponse booking)
    {
        if (booking?.PaymentInfo?.PaymentHistory == null || booking.PaymentInfo.PaymentHistory.Length == 0)
        {
            return BookingCreditExpiryState.None;
        }

        var now = _timeProvider.UtcNow;
        var nowOffset = new DateTimeOffset(now);
        var expiringBefore = nowOffset.AddDays(Math.Max(_voucherSettings.ExpiringCreditsThresholdDays, 0));

        var creditPayments = booking.PaymentInfo.PaymentHistory.Where(p => p.IsCredit).ToArray();
        var paymentToVoucherCode = new Dictionary<PaymentHistoryItem, string>();
        var voucherCodesToLookup = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var creditPayment in creditPayments)
        {
            var voucherCode = (creditPayment.TransNo ?? creditPayment.PayId)?.Trim();
            if (!string.IsNullOrEmpty(voucherCode))
            {
                paymentToVoucherCode[creditPayment] = voucherCode;
                voucherCodesToLookup.Add(voucherCode);
            }
            else
            {
                _logger?.LogDebug("Payment has no voucher code (TransNo/PayId) and will be skipped for expiry evaluation: {Payment}", creditPayment);
            }
        }

        var (hasExpired, hasExpiring) = await EvaluateVoucherExpiryAsync(paymentToVoucherCode, voucherCodesToLookup, nowOffset, expiringBefore);

        if (hasExpired && hasExpiring)
        {
            return BookingCreditExpiryState.Both;
        }
        if (hasExpired)
        {
            return BookingCreditExpiryState.ExpiredOnly;
        }
        if (hasExpiring)
        {
            return BookingCreditExpiryState.ExpiringOnly;
        }

        return BookingCreditExpiryState.None;
    }

    private async Task<(bool hasExpired, bool hasExpiring)> EvaluateVoucherExpiryAsync(
        Dictionary<PaymentHistoryItem, string> paymentToVoucherCode,
        HashSet<string> voucherCodesToLookup,
        DateTimeOffset nowOffset,
        DateTimeOffset expiringBefore)
    {
        var hasExpired = false;
        var hasExpiring = false;

        if (voucherCodesToLookup.Count == 0 || _vouchersRepository == null)
        {
            return (false, false);
        }

        try
        {
            var vouchers = await _vouchersRepository.Get(voucherCodesToLookup);
            var voucherMap = (vouchers ?? Enumerable.Empty<easyJet.Holidays.Api.Domain.Data.Vouchers.Voucher>())
                .Where(v => !string.IsNullOrEmpty(v?.Code))
                .ToDictionary(v => v.Code?.Trim() ?? string.Empty, v => v.ExpirationDate, StringComparer.OrdinalIgnoreCase);

            foreach (var code in paymentToVoucherCode.Values)
            {
                if (!voucherMap.TryGetValue(code, out var expDt) || !expDt.HasValue)
                {
                    continue;
                }

                var expirationDate = new DateTimeOffset(DateTime.SpecifyKind(expDt.Value, DateTimeKind.Utc));
                if (expirationDate <= nowOffset)
                {
                    hasExpired = true;
                }
                else if (expirationDate <= expiringBefore)
                {
                    hasExpiring = true;
                }

                if (hasExpired && hasExpiring)
                {
                    return (true, true);
                }
            }
        }
        catch (Exception ex)
        {
            _logger?.LogDebug(ex, "Failed to batch get vouchers while evaluating credit expiry");
        }

        return (hasExpired, hasExpiring);
    }

}
