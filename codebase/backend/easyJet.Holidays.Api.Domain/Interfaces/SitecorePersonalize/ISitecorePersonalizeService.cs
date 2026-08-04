namespace easyJet.Holidays.Api.Domain.Interfaces.SitecorePersonalize;

/// <summary>
/// Sitecore personalize service
/// </summary>
public interface ISitecorePersonalizeService
{
    /// <summary>
    /// Retrieves the attribute value of a given experiment from the Sitecore Personalize service.
    /// </summary>
    /// <param name="experimentName">The name of the experiment for which the attribute value is being retrieved.</param>
    /// <param name="destinationCodes">A list of custom parameters to send with the request, providing additional context for the experiment.</param>
    /// <param name="deviceType">Device type that made the request, such as desktop, mobile, or tablet. This parameter can be used to personalize the experiment results based on the device type.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the attribute value of the specified experiment as a string.</returns>
    Task<string> GetExperimentFilterOrder(string experimentName, IEnumerable<string> destinationCodes, string deviceType);
}