using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.DatahubReplaySync.Models
{
    /// <summary>
    /// Input model for the Sync function.
    /// Contains information required to fetch and process a CSV file from S3.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class DatahubReplaySyncInput
    {
        /// <summary>
        /// The S3 object key (path) of the CSV file to process.
        /// </summary>
        public string CsvKey { get; init; } = string.Empty;
    }
}