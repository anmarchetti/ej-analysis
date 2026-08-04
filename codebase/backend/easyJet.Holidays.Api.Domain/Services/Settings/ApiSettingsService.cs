#nullable enable

using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Settings;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Settings;

public class ApiSettingsService : IApiSettingsService
{
    private readonly AtcomSettings _atcomSettings;
    private readonly ILogger<ApiSettingsService> _logger;

    /// <summary>
    /// Service for logic based solely on application settings
    /// </summary>
    public ApiSettingsService(IOptions<AtcomSettings> atcomSettings, ILogger<ApiSettingsService> logger)
    {
        _atcomSettings = atcomSettings.Value;
        _logger = logger;
    }

    public PaymentCodesSettings GetPaymentCodesSettingsByPaymentCode(string paymentCode)
    {
        var paymentCodeSettings = _atcomSettings.PaymentCodes.Values.ToList();
        var result = paymentCodeSettings.FirstOrDefault(x =>
            paymentCode.Equals(x.Redeemed.Code, StringComparison.OrdinalIgnoreCase) || paymentCode.Equals(x.Issued.Code, StringComparison.OrdinalIgnoreCase));

        if (result == null)
        {
            _logger.LogError("Cannot find reason code for payment code {PaymentCode} in app setting", paymentCode);
            throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
        }

        return result;
    }

    public PaymentCodesSettings GetPaymentCodesSettingsByReason(string reason)
    {
        var paymentCodeSettings = _atcomSettings.PaymentCodes.Values.ToList();
        var result = paymentCodeSettings.FirstOrDefault(x =>
            reason.Equals(x.Reason, StringComparison.OrdinalIgnoreCase));

        if (result == null)
        {
            _logger.LogError("Cannot find payment code settings for reason {Reason}", reason);
            throw new ApiException(ApiExceptionCodes.BookingCreditInconsistentError);
        }

        return result;
    }
}
