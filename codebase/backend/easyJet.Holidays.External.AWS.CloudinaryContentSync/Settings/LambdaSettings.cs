using easyJet.Holidays.External.AWS.Domain.Models;

namespace easyJet.Holidays.External.AWS.CloudinaryContentSync.Settings;

public class LambdaSettings : BaseLambdaSettings
{
    public string AwsSecretManagerServiceUrl { get; set; } = string.Empty;
    public string CloudinarySettingsName { get; set; } = string.Empty;
}