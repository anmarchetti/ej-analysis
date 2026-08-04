namespace easyJet.Holidays.External.AWS.RequestedPriceSyncRunner.Services;

/// <summary>
/// Interface for CMS service to retrieve requested price count.
/// </summary>
public interface ICmsService
{
    /// <summary>  
    /// Retrieves the count of settings for a specific market code and language.  
    /// </summary>  
    /// <param name="marketCode">The market code to filter settings.</param>  
    /// <param name="marketLanguage">The language of the market to filter settings.</param>  
    /// <returns>The count of settings matching the specified market code and language.</returns>  
    Task<int> GetSettingsCount(string marketCode, string marketLanguage);
}
