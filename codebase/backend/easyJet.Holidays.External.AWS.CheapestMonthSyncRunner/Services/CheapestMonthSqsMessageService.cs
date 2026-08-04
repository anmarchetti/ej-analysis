using Amazon.SQS;
using Amazon.SQS.Model;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Services.Interfaces;
using easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Settings;
using easyJet.Holidays.External.AWS.Models.CheapestMonth;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Services;
/// <summary>
/// CheapestMonthSqsMessageService
/// </summary>
public class CheapestMonthSqsMessageService : ICheapestMonthSqsMessageService
{
    private readonly IAmazonSQS _amazonSqsService;
    private readonly IRouteAvailabilityService _routeAvailabilityService;
    private readonly IDestinationItemHelper _destinationItemHelper;
    private readonly ILogger<CheapestMonthSqsMessageService> _logger;
    private readonly LambdaSettings _lambdaSettings;
    /// <summary>
    /// The sqs max chunk size.
    /// </summary>
    private const int SqsMaxChunkSize = 10;

    /// <summary>
    /// Initializes a new instance of the <see cref="CheapestMonthSqsMessageService"/> class.
    /// </summary>
    /// <param name="amazonSqsService">The amazon sqs service.</param>
    /// <param name="routeAvailabilityService"></param>
    /// <param name="destinationItemHelper"></param>
    /// <param name="logger">The logger.</param>
    /// <param name="lambdaSettings">The lambda settings.</param>
    public CheapestMonthSqsMessageService(
        IAmazonSQS amazonSqsService,
        IRouteAvailabilityService routeAvailabilityService,
        IDestinationItemHelper destinationItemHelper,
        ILogger<CheapestMonthSqsMessageService> logger,
        IOptions<LambdaSettings> lambdaSettings)
    {
        _amazonSqsService = amazonSqsService;
        _routeAvailabilityService = routeAvailabilityService;
        _destinationItemHelper = destinationItemHelper;
        _logger = logger;
        _lambdaSettings = lambdaSettings != null ? lambdaSettings.Value : throw new ArgumentNullException(nameof(lambdaSettings));
        if (_lambdaSettings.SQS.ChunkSize > 10)
        {
            _logger.LogWarning("Chunk size for SQS is too big. It will be lowered to max value of {MaxChunkSize}", SqsMaxChunkSize);
            _lambdaSettings.SQS.ChunkSize = SqsMaxChunkSize;
        }
    }

    /// <summary>
    /// Builds the messages per selection.
    /// </summary>
    /// <param name="airportCodes">The airport codes.</param>
    /// <returns>A list of string.</returns>
    public async Task<IList<string>> BuildMessagesPerSelectionAsync(IList<string> airportCodes)
    {
        var messages = new List<string>();
        if (airportCodes.IsNullOrEmpty())
        {
            return messages;
        }

        foreach (var airportCode in airportCodes)
        {
            var availableDestinations = await _routeAvailabilityService.GetDestinationAvailability(airportCode, 0, null, null, null, null);
            if (IsDestinationListNullOrEmpty(availableDestinations.Destinations, airportCode)) continue;
           
            var regionDetails = _destinationItemHelper.GetAllRegionsDetails(availableDestinations.Destinations);
            if (IsRegionDetailsListNullOrEmpty(regionDetails, airportCode)) continue;
            
            foreach (var region in regionDetails)
            {
                var messageBody = JsonSerializer.Serialize(new SearchSelectionData
                {
                    AirportCode = airportCode,
                    RegionDetails = region
                });
                messages.Add(messageBody);
            }
        }

        return messages;
    }

    /// <summary>
    /// Sends the messages.
    /// </summary>
    /// <param name="messages">The messages.</param>
    /// <returns>A Task.</returns>
    public async Task SendMessages(IList<string> messages)
    {
        var messageGroupId = $"{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}-{_lambdaSettings.Market}-{_lambdaSettings.Language}";

        foreach (var batch in messages.Chunk(_lambdaSettings.SQS.ChunkSize))
        {
            var request = new SendMessageBatchRequest
            {
                QueueUrl = _lambdaSettings.SQS.QueueUrl.ToString(),
                Entries = batch.Select((messageBody) => new SendMessageBatchRequestEntry
                {
                    Id = Guid.NewGuid().ToString(),
                    MessageBody = messageBody,
                    MessageGroupId = messageGroupId,
                    MessageDeduplicationId = $"{messageGroupId}-{Guid.NewGuid()}"
                }).ToList()
            };
            _logger.LogInformation("Sending a message batch: {Messages}", JsonSerializer.Serialize(request.Entries));
            await _amazonSqsService.SendMessageBatchAsync(request);
        }
    }

    /// <summary>
    /// Are the destinations null or empty.
    /// </summary>
    /// <param name="destinations">The destinations.</param>
    /// <param name="airportCode"></param>
    private bool IsDestinationListNullOrEmpty(IList<DestinationItem>? destinations, string airportCode)
    {
        if (destinations.IsNullOrEmpty())
        {
            _logger.LogError("No destination has been found for airport: {AirportCode}", airportCode);
            return true;
        }
        return false;
    }

    /// <summary>
    /// Are the regions null or empty.
    /// </summary>
    /// <param name="allRegions">The all regions.</param>
    /// <param name="airportCode"></param>
    private bool IsRegionDetailsListNullOrEmpty(IList<RegionDetails>? allRegions, string airportCode)
    {
        if (allRegions.IsNullOrEmpty())
        {
            _logger.LogError("No region details has been created for airport: {AirportCode}", airportCode);
            return true;
        }
        return false;
    }
}
