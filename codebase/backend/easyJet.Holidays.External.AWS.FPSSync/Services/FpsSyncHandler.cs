using Amazon.Lambda.SQSEvents;
using Amazon.SQS;
using Amazon.SQS.Model;
using easyJet.Holidays.Api.Domain.Data.FlightPriceStore;
using easyJet.Holidays.External.AWS.FPSSync.Mappers;
using easyJet.Holidays.External.AWS.FPSSync.Models;
using easyJet.Holidays.External.AWS.FPSSync.Settings;
using easyJet.Holidays.External.AWS.Services.FlightPrice;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.AWS.FPSSync.Services;

/// <inheritdoc cref="IFpsSyncHandler"/>
public class FpsSyncHandler : IFpsSyncHandler
{
    private readonly IFlightPriceStoreService _flightPriceStoreService;
    private readonly IAmazonSQS _sqsClient;
    private readonly ILogger<FpsSyncHandler> _logger;
    private readonly LambdaSettings _lambdaSettings;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="flightPriceStoreService"></param>
    /// <param name="sqsClient"></param>
    /// <param name="logger"></param>
    /// <param name="lambdaOptions"></param>
    public FpsSyncHandler(IFlightPriceStoreService flightPriceStoreService, IAmazonSQS sqsClient, ILogger<FpsSyncHandler> logger, IOptions<LambdaSettings> lambdaOptions)
    {
        _flightPriceStoreService = flightPriceStoreService;
        _sqsClient = sqsClient;
        _logger = logger;

        ArgumentNullException.ThrowIfNull(lambdaOptions);
        _lambdaSettings = lambdaOptions.Value;
    }

    /// <inheritdoc/>
    public async Task HandleSync(SQSEvent sqsEvent)
    {
        ArgumentNullException.ThrowIfNull(sqsEvent);

        foreach (var record in sqsEvent.Records)
        {
            var payload = JsonConvert.DeserializeObject<FlightPriceMessagePayload>(record.Body);
            if (payload == null) throw new InvalidOperationException("Unable to deserialize from message");

            var updatedPrices = Enumerable.Empty<FlightPriceStoreModel>();

            if (payload.Detail.Data.Fares is [])
            {
                updatedPrices = await _flightPriceStoreService.EvictFlightPrices(payload.Detail.Data.FlightKey, true);
            }

            var models = FlightPriceMapper.MapMessageToModels(payload).ToArray();

            await _flightPriceStoreService.StorePrices(models);
            await SendPriceUpdatesToSqs(models.Concat(updatedPrices));

            _logger.LogInformation("Processed message: {Message}", JsonConvert.SerializeObject(payload));
        }
    }

    private async Task SendPriceUpdatesToSqs(IEnumerable<FlightPriceStoreModel> models)
    {
        // send only allowed/configured currencies to reduce number of messages
        var filtered =
            models.Where(x =>
                _lambdaSettings.Currencies.Contains(x.Currency, StringComparer.OrdinalIgnoreCase));

        if (filtered.Any())
        {
            var request = new SendMessageRequest(_lambdaSettings.QueueUrl, JsonConvert.SerializeObject(filtered))
            {
                MessageGroupId = nameof(FlightPriceStoreModel)
            };

            await _sqsClient.SendMessageAsync(request);
        }
    }
}