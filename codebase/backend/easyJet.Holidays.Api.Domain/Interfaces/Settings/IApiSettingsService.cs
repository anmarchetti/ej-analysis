using easyJet.Holidays.Api.Domain.Settings;

namespace easyJet.Holidays.Api.Domain.Interfaces.Settings;

public interface IApiSettingsService
{
    PaymentCodesSettings GetPaymentCodesSettingsByPaymentCode(string paymentCode);
    PaymentCodesSettings GetPaymentCodesSettingsByReason(string reason);
}