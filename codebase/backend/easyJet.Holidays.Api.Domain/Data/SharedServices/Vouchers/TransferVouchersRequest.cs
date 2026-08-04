namespace easyJet.Holidays.Api.Domain.Data.SharedServices.Vouchers;

public class TransferVouchersRequest
{
    public string SourceId { get; set; }
    public string DestinationId { get; set; }
    public string Currency { get; set; }
    public decimal Amount { get; set; }
    public VoucherSelectionMode Mode { get; set; }
}

public enum VoucherSelectionMode
{
    SmallestSubset,
}