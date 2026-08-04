using Amazon.Lambda.S3Events;
using CsvHelper.Configuration;
using easyJet.Holidays.Api.Domain.Interfaces.FileService;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.AWS.DistressedTaxFile.Extensions;
using easyJet.Holidays.External.AWS.DistressedTaxFile.Mappers;
using easyJet.Holidays.External.AWS.DistressedTaxFile.Models;
using easyJet.Holidays.External.AWS.DistressedTaxFile.Settings;
using easyJet.Holidays.External.Domain.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.ComponentModel;
using System.Globalization;

namespace easyJet.Holidays.External.AWS.DistressedTaxFile.Services;

/// <inheritdoc cref="IDistressedFileHandler"/>>
public class DistressedFileHandler : IDistressedFileHandler
{
    private readonly IS3FileService _s3FileService;
    private readonly IUnzipService _unzipService;
    private readonly ILogger<DistressedFileHandler> _logger;
    private readonly LambdaSettings _lambdaSettings;

    /// <summary>
    /// standard ctor
    /// </summary>
    public DistressedFileHandler(
        IS3FileService s3FileService,
        IUnzipService unzipService,
        ILogger<DistressedFileHandler> logger,
        IOptions<LambdaSettings> lambdaOptions)
    {
        _s3FileService = s3FileService;
        _unzipService = unzipService;
        _logger = logger;

        ArgumentNullException.ThrowIfNull(lambdaOptions);
        _lambdaSettings = lambdaOptions.Value;
    }

    /// <inheritdoc />
    public async Task Process(S3Event.S3EventNotificationRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        var bucketName = record.S3.Bucket.Name;
        var objectKey = record.S3.Object.Key;

        var taxFile = await DownloadAndParseTaxFile();
        var distressedFileContent = await DownloadAndUnzipDistressedFile(bucketName, objectKey);

        var distressedFileName = Path.GetFileName(objectKey);

        byte[] result;

        //convert distressed file to our model
        var distressedInputFile = CsvHelperUtils<DistressedInputDataRow>.Convert(distressedFileContent);

        if (_lambdaSettings.NewFareClassPhaseOneEnabled)
        {
            distressedInputFile = [];
        }

        var distressedOutputFile = DistressedFileMapper.Map(distressedInputFile);

        var csvConfiguration = new CsvConfiguration(CultureInfo.InvariantCulture) { ShouldQuote = _ => false };

        //enrich the distressed file with taxes from the tax file
        if (_lambdaSettings.EnableTaxCalculation)
        {
            _logger.LogInformation("Adding taxes information to the distressed file");

            //enrich the distressed tax file with tax values
            var distressedOutputFileWithTaxes = distressedOutputFile?.AddTaxes(taxFile,
                _lambdaSettings.DepartureAirportsChildTaxFree?.Split(",", StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => s.Trim().ToUpperInvariant()));

            //convert the enriched distressed tax file to bytes back
            result = CsvHelperUtils<DistressedOutputDataRowWithTaxes>.Convert(distressedOutputFileWithTaxes,
                csvConfiguration);
        }
        //put original data (without taxes)
        else
        {
            //convert the distressed file to bytes back
            result = CsvHelperUtils<DistressedOutputDataRow>.Convert(distressedOutputFile, csvConfiguration);
        }

        // Check if the just-uploaded file might be corrupted based on a size comparison with the
        // previous file in the same folder. The bucket is shared with other producers, so the
        // lookup is scoped to the uploaded file's folder rather than the whole bucket.
        var previousFile = await GetPreviousDistressedFile(bucketName, objectKey);
        if (IsLatestFileCorrupted(previousFile, record.S3.Object.Size))
        {
            throw new WarningException("The last updated file has a suspicious size. It seems to be corrupted!!!");
        }

        // upload non-encrypted compressed file to S3
        var datePart =
            distressedFileName.Substring(distressedFileName.IndexOf('_', StringComparison.Ordinal) + 1, 8);
        var date = DateTime.ParseExact(datePart, "yyyyMMdd", CultureInfo.InvariantCulture);
        var formattedDate = date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var currentTime = DateTime.Now.ToString("HH-mm", CultureInfo.InvariantCulture);

        // Build the final file name
        var compressedNonEncryptedFileName = $"DailyDistressed_{formattedDate}_{currentTime}.csv.gz";

        foreach (var folder in _lambdaSettings.UploadBucketFolders.Split(","))
        {
            await _s3FileService.UploadFile(_lambdaSettings.UploadBucketName,
                $"{folder}/{compressedNonEncryptedFileName}", 
                CompressUtils.ToGzipMemoryStream(result)
            );

            _logger.LogInformation(
                "Updated distressed tax file has been uploaded to S3: {UploadBucketName} - {Folder}/{CompressedNonEncryptedFileName}",
                _lambdaSettings.UploadBucketName, 
                folder, 
                compressedNonEncryptedFileName
            );
        }
    }


    private async Task<List<TaxDataRow>> DownloadAndParseTaxFile()
    {
        _logger.LogInformation("Downloading tax file from S3: {Bucket}/{Key}", _lambdaSettings.S3BucketName,
            _lambdaSettings.S3TaxFileObjectKey);

        var taxFileBytes =
            await _s3FileService.Download(_lambdaSettings.S3BucketName, _lambdaSettings.S3TaxFileObjectKey);

        return CsvHelperUtils<TaxDataRow>.Convert(taxFileBytes).ToList();
    }

    private async Task<byte[]> DownloadAndUnzipDistressedFile(string bucketName, string objectKey)
    {
        var distressedFileName = Path.GetFileName(objectKey);

        _logger.LogInformation("Downloading and unzipping distressed file: {FileName}", distressedFileName);

        var distressedFileBytes = await _s3FileService.Download(bucketName, objectKey);
        return await _unzipService.UnzipSingleFileToByteArray(distressedFileBytes);
    }

    /// <summary>
    /// Gets the most recently modified file located in the same folder as the uploaded file,
    /// excluding the file that triggered the lambda.
    /// </summary>
    /// <param name="bucketName">The S3 bucket name</param>
    /// <param name="uploadedObjectKey">The key of the file that triggered the lambda</param>
    /// <returns>The previous file in the folder, or null if there is none</returns>
    private async Task<FileProperties> GetPreviousDistressedFile(string bucketName, string uploadedObjectKey)
    {
        // The uploaded file lives in a dedicated folder (e.g. "DISCOUNTED_SEATS/Input/"), but the
        // bucket is shared with other producers. Scope the listing to that folder so we only
        // compare against sibling files.
        var folder = GetFolder(uploadedObjectKey);

        var objects = await _s3FileService.ListAll(bucketName, folder) ?? [];

        // Exclude the file that triggered the lambda and take the most recently modified one.
        return objects
            .Where(o => !string.Equals(o.FullName, uploadedObjectKey, StringComparison.Ordinal))
            .OrderByDescending(o => o.LastWriteTime)
            .FirstOrDefault();
    }

    /// <summary>
    /// Extracts the folder prefix (including the trailing slash) from an S3 object key.
    /// e.g. "DISCOUNTED_SEATS/Input/file.csv.gz" -> "DISCOUNTED_SEATS/Input/".
    /// </summary>
    private static string GetFolder(string objectKey)
    {
        var lastSlashIndex = objectKey.LastIndexOf('/');
        return lastSlashIndex >= 0 ? objectKey[..(lastSlashIndex + 1)] : string.Empty;
    }

    /// <summary>
    /// Checks if the just-uploaded file might be corrupted based on a size comparison with the
    /// previous file in the same folder.
    /// </summary>
    /// <param name="previousFile">The previous file in the folder, or null if there is none</param>
    /// <param name="currentFileSize">Size of the just-uploaded file in bytes</param>
    /// <returns>True if the file is likely corrupted, false otherwise</returns>
    private bool IsLatestFileCorrupted(FileProperties previousFile, long currentFileSize)
    {
        if (_lambdaSettings.NewFareClassPhaseOneEnabled)
        {
            _logger.LogInformation("New fare class phase one is toggled on, files are supposed to be empty now.");
            return false;
        }

        if (previousFile == null)
        {
            // It can only be checked if the file is defective if a previous file exists.
            _logger.LogInformation(
                "Can't check if the last file is the correct size. No previous file found in the folder");
            return false;
        }
        
        _logger.LogInformation("Previous file was found: {Filename}, size: {Size}", previousFile.FullName, previousFile.Size);

        //file size increased -> ok
        if (currentFileSize >= previousFile.Size)
        {
            _logger.LogInformation(
                "New file is larger than previous one. Latest file size:{Size} | previous file size:{PreviousSize}",
                currentFileSize, previousFile.Size);
            return false;
        }

        //we assume that the previous file has correct file size
        var currentPercentageSizeDifference =
            Math.Abs(decimal.Divide(currentFileSize, previousFile.Size) * 100 - 100);

        _logger.LogInformation(
            "Check if the latest file is valid. Latest file size:{Size} | previous file size:{PreviousSize}. Percentage difference is: {CurrentPercentageSizeDifference}",
            currentFileSize, previousFile.Size, currentPercentageSizeDifference);

        return _lambdaSettings.FileSizeTolerancePercentage < currentPercentageSizeDifference;
    }
}