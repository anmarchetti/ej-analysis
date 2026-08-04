using easyJet.Holidays.External.AWS.Domain.Models;

namespace easyJet.Holidays.External.AWS.FeefoDataGenerator.Settings;

public class LambdaSettings : BaseLambdaSettings
{
    public string ServiceUrl { get; set; } = string.Empty;
    public string AwsSecretManagerServiceUrl { get; set; } = string.Empty;
    public string EskelSecretName { get; set; } = string.Empty;
    public string FeefoSecretName { get; set; } = string.Empty;
    public string MarketingSecretName { get; set; } = string.Empty;
    public bool VerboseLog { get; set; }
    public bool UseDebug { get; set; }
    public int SearchHotelChunkSize { get; set; } = 100;
    public string QueueUrl { get; set; } = string.Empty;
    public string WebsiteAgentCodes { get; set; }
}