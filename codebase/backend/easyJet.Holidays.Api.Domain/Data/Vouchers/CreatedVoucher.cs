using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;

namespace easyJet.Holidays.Api.Domain.Data.Vouchers;

public record CreatedVoucher
{
    /// <summary>
    /// Code of the voucher
    /// </summary>
    public string Code { get; init; }

    /// <summary>
    /// Reason of the voucher
    /// </summary>
    public string Reason { get; init; }

    /// <summary>
    /// Amount of the voucher
    /// </summary>
    public decimal Amount { get; init; }
}

internal record CreatedVoucherCode
{
    public string Code { get; init; }

    public decimal Amount { get; init; }
}

internal record PromoCreatedVoucherCode
{
    public string Code { get; init; }

    public decimal Amount { get; init; }
    
    public BookingCancellationPromoRefundBreakdownItem PromoRefundBreakdownItem { get; init; }
}