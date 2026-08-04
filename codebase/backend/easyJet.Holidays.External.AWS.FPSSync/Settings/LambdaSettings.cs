using easyJet.Holidays.External.AWS.Domain.Models;

namespace easyJet.Holidays.External.AWS.FPSSync.Settings;

public class LambdaSettings : BaseLambdaSettings
{
    public string[] Currencies { get; set; }
    public string ServiceUrl { get; set; } = string.Empty;
    public string QueueUrl { get; set; } = string.Empty;
    public string DynamoDbTableName { get; set; } = string.Empty;
}