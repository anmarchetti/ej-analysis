#pragma warning disable CA1062
using Amazon.Lambda.S3Events;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.SQS;
using Amazon.SQS.Model;
using CsvHelper;
using easyJet.Holidays.External.AWS.DatahubReplaySync.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Globalization;
using System.Net;

namespace easyJet.Holidays.External.AWS.DatahubReplaySync.Services;

/// <inheritdoc cref="IDatahubReplaySyncHandler"/>
public class DatahubReplaySyncHandler : IDatahubReplaySyncHandler
{
    private readonly IAmazonS3 _s3Client;
    private readonly IAmazonSQS _sqsClient;
    private readonly ILogger<DatahubReplaySyncHandler> _logger;
    private readonly LambdaSettings _lambdaSettings;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="s3Client"></param>
    /// <param name="sqsClient"></param>
    /// <param name="logger"></param>
    /// <param name="lambdaOptions"></param>
    public DatahubReplaySyncHandler(
        IAmazonS3 s3Client, 
        IAmazonSQS sqsClient, 
        ILogger<DatahubReplaySyncHandler> logger,
        IOptions<LambdaSettings> lambdaOptions)
    {
        _s3Client = s3Client;
        _sqsClient = sqsClient;
        _logger = logger;

        ArgumentNullException.ThrowIfNull(lambdaOptions);
        _lambdaSettings = lambdaOptions.Value;
    }

    // /// <inheritdoc />
    //public async Task Process(S3Event input)
    //{
    //    ArgumentNullException.ThrowIfNull(input);

    //    var csvContent = await DownloadCsvFromS3(input.CsvKey);
    //    var records = ParseCsv(csvContent);

    //    // Send each record to SQS
    //    foreach (var (id, version) in records)
    //    {
    //        await SendMessageToSqs(id, version);
    //    }
    //}

    /// <inheritdoc />
    public async Task Process(S3Event input)
    {
        foreach (var record in input.Records)
        {
            var bucketName = record.S3.Bucket.Name;
            var objectKey = WebUtility.UrlDecode(record.S3.Object.Key);

            if (!objectKey.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogInformation("Skipping non-CSV S3 object: s3://{BucketName}/{ObjectKey}", bucketName, objectKey);
                continue;
            }

            _logger.LogInformation("Processing CSV from s3://{BucketName}/{ObjectKey}", bucketName, objectKey);

            var csvContent = await DownloadCsvFromS3(bucketName, objectKey);
            var records = ParseCsv(csvContent);

            if (records.Count > _lambdaSettings.MaxBookingsPerFile)
            {
                throw new InvalidOperationException(
                    $"CSV file contains {records.Count} bookings, which exceeds the configured maximum of {_lambdaSettings.MaxBookingsPerFile} bookings per file.");
            }

            foreach (var (id, version) in records)
            {
                await SendMessageToSqs(id, version);
            }

            _logger.LogInformation("Completed processing CSV from s3://{BucketName}/{ObjectKey}", bucketName, objectKey);
        }

        _logger.LogInformation("Completed processing datahub replay sync S3 event.");
    }

    /// <summary>
    /// Downloads the CSV file content from S3.
    /// </summary>
    /// <param name="bucketName"></param>
    /// <param name="s3ObjectKey">The S3 object key of the CSV file.</param>
    /// <returns>The full CSV content as a string.</returns>
    private async Task<string> DownloadCsvFromS3(string bucketName, string s3ObjectKey)
    {
        var request = new GetObjectRequest
        {
            BucketName = bucketName,
            Key = s3ObjectKey
        };

        using var response = await _s3Client.GetObjectAsync(request);
        using var reader = new StreamReader(response.ResponseStream);
        return await reader.ReadToEndAsync();
    }

    /// <summary>
    /// Parses CSV content, extracting the first column as ID and second column as version.
    /// </summary>
    /// <param name="csvContent">Raw CSV text.</param>
    /// <returns>
    /// A list of tuples where <c>Id</c> is the string from column 0 and
    /// <c>Version</c> is the integer parsed from column 1.
    /// </returns>
    /// <exception cref="FormatException">Thrown if the version field cannot be parsed as an integer.</exception>
    private static List<(string Id, int Version)> ParseCsv(string csvContent)
    {
        var records = new List<(string, int)>();

        using var reader = new StringReader(csvContent);
        using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);

        while (csv.Read())
        {
            var id = csv.GetField(0);
            var versionField = csv.GetField(1);

            if (string.IsNullOrWhiteSpace(id))
                continue;

            if (!int.TryParse(versionField, NumberStyles.Integer, CultureInfo.InvariantCulture, out var version))
            {
                throw new FormatException($"Invalid version value '{versionField}' in CSV.");
            }

            records.Add((id, version));
        }

        return records;
    }

    /// <summary>
    /// Sends a single message to the configured SQS queue, containing RES_ID and VER_NUM.
    /// </summary>
    /// <param name="id">The record identifier.</param>
    /// <param name="version">The version number parsed from CSV.</param>
    private async Task SendMessageToSqs(string id, int version)
    {
        var messageBody = new
        {
            RES_ID = id,
            VER_NUM = version
        };

        var jsonBody = JsonConvert.SerializeObject(messageBody);

        var sendRequest = new SendMessageRequest
        {
            QueueUrl = _lambdaSettings.QueueUrl.ToString(),
            MessageBody = jsonBody,
            MessageAttributes = new Dictionary<string, MessageAttributeValue>
            {
                ["replay"] = new()
                {
                    DataType = "String",
                    StringValue = "true"
                }
            }
        };

        await _sqsClient.SendMessageAsync(sendRequest);
    }
}