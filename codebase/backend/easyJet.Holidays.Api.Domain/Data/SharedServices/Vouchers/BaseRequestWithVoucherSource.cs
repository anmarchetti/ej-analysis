using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Settings;

namespace easyJet.Holidays.Api.Domain.Data.SharedServices.Vouchers;

public abstract class BaseRequestWithVoucherSource
{
    public VoucherSource Source { get; set; }
}

public enum VoucherSource
{
    Web,
    BulkTool,
    CallCentre
}

public static class BaseRequestWithVouchersExtensions
{
    public static string GetSourceValueFromSettings(this VoucherSource instance, ApiSettings settingsToUse)
    {
        return instance switch
        {
            VoucherSource.Web => settingsToUse.Vouchers.Source.Web,
            VoucherSource.BulkTool => settingsToUse.Vouchers.Source.BulkTool,
            VoucherSource.CallCentre => settingsToUse.Vouchers.Source.CallCentre,
            _ => null
        };
    }

    public static void AddSourceToMetaData(this Dictionary<string, object> instance, VoucherSource source, ApiSettings settingsToUse)
    {
        instance.Add(VoucherifyMetaKeys.Source, source.GetSourceValueFromSettings(settingsToUse));
    }
}