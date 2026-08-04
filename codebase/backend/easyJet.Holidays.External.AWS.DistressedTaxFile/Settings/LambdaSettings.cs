using easyJet.Holidays.External.AWS.Domain.Models;

namespace easyJet.Holidays.External.AWS.DistressedTaxFile.Settings;

/// <summary>
/// Settings for the Lambda function related to tax file processing.
/// </summary>
public class LambdaSettings : BaseLambdaSettings
{
    /// <summary>
    /// Gets or sets the folder path in the upload bucket where files will be uploaded.
    /// </summary>
    public string UploadBucketFolders { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the name of the upload bucket.
    /// </summary>
    public string UploadBucketName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets a value indicating whether tax calculation is enabled.
    /// </summary>
    public bool EnableTaxCalculation { get; set; }

    /// <summary>
    /// Gets or sets the name of the S3 bucket used for tax file storage.
    /// </summary>
    public string S3BucketName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the object key for the tax file in the S3 bucket.
    /// </summary>
    public string S3TaxFileObjectKey { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the departure airports that are child tax-free.
    /// </summary>
    public string DepartureAirportsChildTaxFree { get; set; } = string.Empty;
    
    /// <summary>
    /// File Size Tolerance Percentage
    /// </summary>
    public int FileSizeTolerancePercentage { get; set; } = 10;
    /// <summary>
    /// If false, lambda will use legacy behavior.
    /// If true, lambda will act according to requirements of new fare class phase 1.
    /// </summary>
    public bool NewFareClassPhaseOneEnabled { get; set; }
}
