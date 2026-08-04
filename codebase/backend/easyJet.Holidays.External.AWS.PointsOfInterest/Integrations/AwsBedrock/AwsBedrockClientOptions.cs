namespace PointsOfInterest.Integrations.AwsBedrock;

internal sealed class AwsBedrockClientOptions
{
    public required string ModelId { get; init; }
    public required string InferenceProfileArn { get; init; }
    public required string AnthropicVersion { get; init; }
}
