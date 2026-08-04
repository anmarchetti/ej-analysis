using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Services.Vouchers;

namespace easyJet.Holidays.Api.Domain.Data.SharedServices.Vouchers;

/// <summary>
/// Request holding parameters for <see cref="IVouchersService.AddCreditToBooking"/>
/// </summary>
public class AddCreditToBookingRequest : BaseRequestWithVoucherSource
{
    public string CustomerId { get; set; }
    public CreditBreakdown CreditBreakdown { get; set; }
    public string VoucherId { get; set; }
    public BookingResponse Booking { get; set; }
    public Dictionary<string, object> MetaData { get; set; }
    public bool? MarkBookingAsCancelled { get; set; }
}