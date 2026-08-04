namespace easyJet.Holidays.Api.Domain.Data.SharedServices.Vouchers;

/// <summary>
/// Request for voucher creation through shared services
/// </summary>
public sealed class CreateAndPublishVoucherRequest : BaseRequestWithVoucherSource
{
    /// <summary>
    /// ID of the voucher to create
    /// </summary>
    public string VoucherId { get; set; }

    /// <summary>
    /// Amount to be 'attached' to the voucher (as Gift property in voucherify) <br />
    /// to be supplied in hundredths of currency
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// Currency of the voucher, e.g. GBP, EUR, ...
    /// </summary>
    public string Currency { get; set; }

    /// <summary>
    /// Either ID in voucherify if known or B2B UserId
    /// </summary>
    public string CustomerId { get; set; }

    /// <summary>
    /// Goodwill/Refund/Promo
    /// </summary>
    public string ReasonCode { get; set; }

    /// <summary>
    /// Pre-supplied metadata, later to be merged
    /// </summary>
    public Dictionary<string, object> MetaData { get; set; }

    /// <summary>
    /// Optional time of expiration for the newly created voucher.
    /// </summary>
    public DateTimeOffset? ExpirationDateTime { get; set; }
}