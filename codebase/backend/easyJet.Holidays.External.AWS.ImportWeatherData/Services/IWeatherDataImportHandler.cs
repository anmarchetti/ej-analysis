namespace easyJet.Holidays.External.AWS.ImportWeatherData.Services;

/// <summary>
/// Loads weather data from file and persists it in dynamoDb
/// </summary>
public interface IWeatherDataImportHandler
{
    /// <summary>
    /// Processes the import of weather data
    /// </summary>
    /// <returns></returns>
    Task Handle();
}