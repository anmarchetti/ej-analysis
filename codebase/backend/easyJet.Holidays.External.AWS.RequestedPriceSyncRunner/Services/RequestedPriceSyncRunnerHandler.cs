using Amazon.SQS;
using Amazon.SQS.Model;
using easyJet.Holidays.Api.Domain.Services.Time;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.RequestedPriceSyncRunner.Settings;
using easyJet.Holidays.External.AWS.Services.RequestedPrice.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.AWS.RequestedPriceSyncRunner.Services;

/// <inheritdoc cref="IRequestedPriceSyncRunnerHandler"/>
public class RequestedPriceSyncRunnerHandler : IRequestedPriceSyncRunnerHandler
{
    private readonly ICmsService _cmsService;
    private readonly IAmazonSQS _sqsRepository;
    private readonly ITimeProvider _timeProvider;
    private readonly ILogger<RequestedPriceSyncRunnerHandler> _logger;
    private readonly LambdaSettings _lambdaSettings;
    private readonly LanguageSettings _languageSettings;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="cmsService"></param>
    /// <param name="sqsRepository"></param>
    /// <param name="timeProvider"></param>
    /// <param name="logger"></param>
    /// <param name="lambdaOptions"></param>
    /// <param name="languageOptions"></param>
    public RequestedPriceSyncRunnerHandler(
        ICmsService cmsService, 
        IAmazonSQS sqsRepository, 
        ITimeProvider timeProvider,
        ILogger<RequestedPriceSyncRunnerHandler> logger, 
        IOptions<LambdaSettings> lambdaOptions, 
        IOptions<LanguageSettings> languageOptions)
    {
        _cmsService = cmsService;
        _sqsRepository = sqsRepository;
        _timeProvider = timeProvider;
        _logger = logger;

        ArgumentNullException.ThrowIfNull(lambdaOptions);
        _lambdaSettings = lambdaOptions.Value;

        ArgumentNullException.ThrowIfNull(languageOptions);
        _languageSettings = languageOptions.Value;
    }

    /// <inheritdoc />
    public async Task Sync()
    {
        var timestamp = _timeProvider.GetTimestamp();
        _logger.LogInformation("Starting requested searches sync with timestamp: {Timestamp}", timestamp);

        foreach (var marketCode in _lambdaSettings.MarketCodes)
        {
            foreach (var marketLanguage in _languageSettings.MarketLanguages[marketCode])
            {
                await PublishAllBatchesAsync(timestamp, marketCode, marketLanguage);
            }
        }
    }

    private async Task PublishAllBatchesAsync(long timestamp, string marketCode, string marketLanguage)
    {
        var settingsCount = await _cmsService.GetSettingsCount(marketCode, marketLanguage);
        var totalBatches = Math.Ceiling((decimal)settingsCount / _lambdaSettings.BatchSize);
        var messageGroupId = $"{timestamp}-{marketCode}-{marketLanguage}";

        var tasks = new List<Task>();
        for (int i = 0; i < totalBatches; i++)
        {
            var messageBody = JsonConvert.SerializeObject(new RequestedPriceSyncInput
            {
                Timestamp = timestamp,
                Market = marketCode,
                Language = marketLanguage,
                Skip = i * _lambdaSettings.BatchSize,
                Take = _lambdaSettings.BatchSize,
                IsLast = i == totalBatches - 1,
            });

            _logger.LogInformation("Publishing SQS message for market: {Market}, language: {Language}, batch: {Batch}/{Total}",
                marketCode,
                marketLanguage,
                i + 1,
                totalBatches);

            var sendMessageRequest = new SendMessageRequest
            {
                QueueUrl = _lambdaSettings.Sqs.QueueUrl.ToString(),
                MessageGroupId = messageGroupId,
                MessageDeduplicationId = $"{messageGroupId}-{i}",
                MessageBody = messageBody
            };
            tasks.Add(_sqsRepository.SendMessageAsync(sendMessageRequest));
        }

        await Task.WhenAll(tasks);
    }
}