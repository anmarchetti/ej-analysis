using Amazon.S3.Transfer;
using Amazon.SQS;
using Amazon.SQS.Model;
using easyJet.Holidays.Api.Domain.Data.FlightPriceStore;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.AWS.FPSExport.Settings;
using easyJet.Holidays.External.AWS.Services.FlightPrice;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Globalization;

namespace easyJet.Holidays.External.AWS.FPSExport.Service;

/// <inheritdoc cref="IFpsExportingService"/>
public class FpsExportingService : IFpsExportingService
{
    private readonly ITransferUtility _s3TransferUtility;
    private readonly IAmazonSQS _sqsClient;
    private readonly IFlightPriceStoreService _flightPriceStoreService;
    private readonly IFpsSelectorService _selectorService;
    private readonly ILogger<FpsExportingService> _logger;
    private readonly LambdaSettings _lambdaSettings;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="s3Transfer"></param>
    /// <param name="sqs"></param>
    /// <param name="flightPriceStoreService"></param>
    /// <param name="selectorService"></param>
    /// <param name="logger"></param>
    /// <param name="lambdaOptions"></param>
    public FpsExportingService(
        ITransferUtility s3Transfer,
        IAmazonSQS sqs,
        IFlightPriceStoreService flightPriceStoreService,
        IFpsSelectorService selectorService,
        ILogger<FpsExportingService> logger,
        IOptions<LambdaSettings> lambdaOptions)
    {
        _s3TransferUtility = s3Transfer;
        _sqsClient = sqs;
        _flightPriceStoreService = flightPriceStoreService;
        _selectorService = selectorService;
        _logger = logger;

        ArgumentNullException.ThrowIfNull(lambdaOptions);
        _lambdaSettings = lambdaOptions.Value;
    }

    /// <inheritdoc />
    public async Task Export(string runType)
    {
        var now = DateTime.UtcNow;
        var isDailyRun = runType == "Daily";

        var fileNamePrefix = isDailyRun ? "EJFULL" : "EJINCR";
        var items = (await GetItems(isDailyRun, now)).ToList();

        if (items is [])
        {
            _logger.LogInformation("No new updates for {RunType} run. Exiting..", runType);
            return;
        }
        _logger.LogInformation("Receive {Count} items", items.Count);

        var file = GetFileContent(items);
        
        var format = $"yyyyMMdd{(!isDailyRun ? "HHmm" : string.Empty)}";
        var fileName = $"{fileNamePrefix}{now.ToString(format, CultureInfo.InvariantCulture)}.csv.gz";

        await _s3TransferUtility.UploadAsync(CompressUtils.ToGzipMemoryStream(file), _lambdaSettings.S3BucketName, $"{runType}/{fileName}");
        _logger.LogInformation("File uploaded to S3: Bucket: {BucketName}. File: {FileName}", _lambdaSettings.S3BucketName, fileName);
    }

    private byte[] GetFileContent(List<FlightPriceStoreModel> items)
    {
        if (_lambdaSettings.NewFareClassPhaseOneEnabled)
        {
            // Regardless of what the actual fare type might be, we override with STANDARD.
            // this is the phase one interim solution, to be used until atcom implements remaining types.
            items.ForEach(item => item.FareType = FareType.Standard.GetKnownFareType());
        }

        var file = CsvHelperUtils<FlightPriceStoreModel>.Convert(items);
        return file;
    }

    private async Task<IEnumerable<FlightPriceStoreModel>> GetItems(bool isDailyRun, DateTime timeOfExecution)
    {
        if (isDailyRun)
        {
            var dailyItems = await _flightPriceStoreService.GetDailyItems(timeOfExecution, _lambdaSettings.Currencies.Split(","));
        
            return _selectorService.SelectFare(dailyItems.DistinctBy(x => x.ID).ToList());
        }

        return _selectorService.SelectFare(await LatestUpdatesFromSqs());
    }

    private async Task<List<FlightPriceStoreModel>> LatestUpdatesFromSqs()
    {
        var request = new ReceiveMessageRequest(_lambdaSettings.QueueUrl)
        {
            MaxNumberOfMessages = 10
        };

        // read
        var response = await _sqsClient.ReceiveMessageAsync(request);
        var results = new List<FlightPriceStoreModel>();

        while (response.Messages?.Count > 0)
        {
            var deleteMessagesBatch = new List<DeleteMessageBatchRequestEntry>();

            foreach (var item in response.Messages)
            {
                var prices = JsonConvert.DeserializeObject<IEnumerable<FlightPriceStoreModel>>(item.Body);
                if (prices != null)
                    results.AddRange(prices);

                // mark to delete
                deleteMessagesBatch.Add(new DeleteMessageBatchRequestEntry
                {
                    Id = item.MessageId,
                    ReceiptHandle = item.ReceiptHandle
                });
            }

            // delete is required before requesting next batch of messages to avoid stuck in infinite loop
            await _sqsClient.DeleteMessageBatchAsync(new DeleteMessageBatchRequest
            {
                Entries = deleteMessagesBatch,
                QueueUrl = _lambdaSettings.QueueUrl
            });

            // request next
            response = await _sqsClient.ReceiveMessageAsync(request);
        }

        return results.Where(
            x => _lambdaSettings.Currencies.Contains(x.Currency, StringComparison.OrdinalIgnoreCase)
        ).ToList();
    }
}