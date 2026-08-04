using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Settings;

namespace easyJet.Holidays.Api.Domain.Data.SharedServices.Booking;

public class ModifyMemoRequest
{
    public string BookingReference { get; set; }
    public BookingMemo Memo { get; set; }
    public RequestedCode? RequestedCode { get; set; }
}

public static class ModifyMemoRequestExtensions
{
    public static void UpdateMemoCodeByRequestedCode(this ModifyMemoRequest instance, ApiSettings settingsToUse)
    {
        if (instance?.RequestedCode == null || instance.RequestedCode == RequestedCode.NONE)
        {
            return;
        }

        instance.Memo.Code = instance.RequestedCode switch
        {
            RequestedCode.Cred => settingsToUse.Vouchers.BookingMemos.Cred.Code,
            RequestedCode.MovedToCredit => settingsToUse.Vouchers.BookingMemos.MovedToCredit.Code,
            RequestedCode.MovedToCreditAndCash => settingsToUse.Vouchers.BookingMemos.MovedToCreditAndCash.Code,
            RequestedCode.CacheRefund25Percents => settingsToUse.Vouchers.BookingMemos.CacheRefund25Percents.Code,
            RequestedCode.CacheAndCreditRefund25Percents => settingsToUse.Vouchers.BookingMemos.CacheAndCreditRefund25Percents.Code,
            RequestedCode.CreditRefund25Percents => settingsToUse.Vouchers.BookingMemos.CreditRefund25Percents.Code,
            RequestedCode.CreditRefund50Percents => settingsToUse.Vouchers.BookingMemos.CreditRefund50Percents.Code,
        };
    }
}

public enum RequestedCode
{
    NONE,
    Cred,
    MovedToCredit,
    MovedToCreditAndCash,
    CacheRefund25Percents,
    CacheAndCreditRefund25Percents,
    CreditRefund25Percents,
    CreditRefund50Percents,
}