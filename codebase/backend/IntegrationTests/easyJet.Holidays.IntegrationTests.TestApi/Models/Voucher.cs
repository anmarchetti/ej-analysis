namespace easyJet.Holidays.IntegrationTests.TestApi.Models;

public class Voucher
{
    public string? Email { get; set; }
    public string? Password { get; set; }
        
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "GBP";
    public string MarketCode { get; set; } = "UK";
    public string ReasonCode { get; set; } = string.Empty;
    public string MetaData { get; set; } = "BookingReference:TestApiUI;";
        
    public string? Vouchers { get; set; }
    public string? Logs { get; set; }
}

public class VoucherResponse
{
    public required string Email { get; set; }
    public string? Password { get; set; }
        
    public string? VoucherId { get; set; }
}