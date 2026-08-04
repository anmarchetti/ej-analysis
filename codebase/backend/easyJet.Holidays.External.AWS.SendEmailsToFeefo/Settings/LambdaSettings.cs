using easyJet.Holidays.External.AWS.Domain.Models;

namespace easyJet.Holidays.External.AWS.SendEmailsToFeefo.Settings;

public class LambdaSettings : BaseLambdaSettings
{
    public string AwsSecretManagerServiceUrl { get; set; } = string.Empty;
    public string FeefoSecretName { get; set; } = string.Empty;
    public string TokensTable { get; set; } = string.Empty;
    /// <summary>
    /// Sample Rate
    /// </summary>
    public double SampleRate { get; set; } = 0.2;
}