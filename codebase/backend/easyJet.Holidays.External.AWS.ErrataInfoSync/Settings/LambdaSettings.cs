namespace easyJet.Holidays.External.AWS.ErrataInfoSync.Settings;

/// <summary>
/// settings for the lambdas operation
/// </summary>
public class LambdaSettings
{
    /// <summary>
    /// Whether processing should continue when the retrieved data set is empty or not.
    /// </summary>
    public bool FailOnEmptyErrata { get; set; }

    /// <summary>
    /// service manager url
    /// </summary>
    public Uri AwsSecretManagerServiceUrl { get; set; }

    /// <summary>
    /// Name of the secret to load
    /// </summary>
    public string AtcomDbSecretName { get; set; }

    /// <summary>
    /// Gets parsed and used as the errata language map.
    /// Circumvents the type mismatch that would otherwise occur.
    /// </summary>
    public string RawLanguageMap { get; set; }
}