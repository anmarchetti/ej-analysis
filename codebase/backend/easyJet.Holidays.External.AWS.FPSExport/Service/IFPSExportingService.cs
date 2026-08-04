namespace easyJet.Holidays.External.AWS.FPSExport.Service;

/// <summary>
/// Retrieves updates from either dynamo for daily or sqs for more frequent invocations.
/// Persists them into s3 in csv format.
/// </summary>
public interface IFpsExportingService
{
    /// <summary>
    /// Handles the export flow.
    /// </summary>
    /// <param name="runType">whether the invocation is a daily run or the 5-min interval</param>
    /// <returns></returns>
    Task Export(string runType);
}