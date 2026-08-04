using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Amazon.Lambda.SQSEvents;
using easyJet.Holidays.Api.Domain.Data.Search;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.CheapestMonthSync.Services.Interfaces;
using easyJet.Holidays.External.AWS.CheapestMonthSync.Settings;
using easyJet.Holidays.External.AWS.Models.CheapestMonth;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Globalization;

namespace easyJet.Holidays.External.AWS.CheapestMonthSync.Services;
/// <summary>
/// CheapestMonthSyncHandler
/// </summary>
public class CheapestMonthSyncHandler : ICheapestMonthSyncHandler
{
    private readonly IAtcomRequestParamBuilder _atcomRequestParamBuilder;
    private readonly ICheapestMonthService _cheapestMonthService;
    private readonly IRouteAvailabilityService _routeAvailabilityService;
    private readonly IAmazonDynamoDB _client;
    private readonly AwsSettings _awsSettings;
    private readonly ILogger<CheapestMonthSyncHandler> _logger;
    private readonly LambdaSettings _lambdaSettings;


    /// <summary>
    /// Initializes a new instance of the <see cref="CheapestMonthSyncHandler"/> class.
    /// </summary>
    /// <param name="atcomRequestParamBuilder">The atcom request param builder.</param>
    /// <param name="cheapestMonthService">The cheapest month service.</param>
    /// <param name="routeAvailabilityService">The route availability service.</param>
    /// <param name="client">The client.</param>
    /// <param name="logger">The logger.</param>
    /// <param name="awsSettings">The aws settings.</param>
    /// <param name="lambdaSettings">The lambda settings.</param>
    public CheapestMonthSyncHandler(
         IAtcomRequestParamBuilder atcomRequestParamBuilder,
         ICheapestMonthService cheapestMonthService,
         IRouteAvailabilityService routeAvailabilityService,
         IAmazonDynamoDB client,
         ILogger<CheapestMonthSyncHandler> logger,
         IOptions<AwsSettings> awsSettings,
         IOptions<LambdaSettings> lambdaSettings)
    {
        _atcomRequestParamBuilder = atcomRequestParamBuilder;
        _cheapestMonthService = cheapestMonthService;
        _routeAvailabilityService = routeAvailabilityService;
        _client = client;
        _awsSettings = awsSettings != null ? awsSettings.Value : throw new ArgumentNullException(nameof(awsSettings));
        _lambdaSettings = lambdaSettings != null ? lambdaSettings.Value : throw new ArgumentNullException(nameof(lambdaSettings));
        _logger = logger;
    }

    /// <summary>
    /// Handler.
    /// </summary>
    /// <param name="sqsEvent">The sqs event.</param>
    /// <returns>A Task.</returns>
    public async Task Handle(SQSEvent sqsEvent)
    {
        _logger.LogInformation("CheapestMonthSync lambda started...");

        var searchSelectionMessages = GetSqsMessages(sqsEvent);

        var cheapestMonthsPerSelection = new List<CheapestMonthDetails>();
        foreach (var searchSelectionMessage in searchSelectionMessages)
        {
            var lastAvailableDate = await GetSearchEndDate(searchSelectionMessage);
            _logger.LogInformation("Last available enddate: {EndDate} for airport: {Airport} and destination: {Destination}", lastAvailableDate, searchSelectionMessage.AirportCode, searchSelectionMessage.RegionDetails?.RegionCode ?? "Unknown");

            var dateRangeChunks = _atcomRequestParamBuilder.BuildDateRangeParamChunks(DateTime.UtcNow, lastAvailableDate);
            _logger.LogInformation("{Count} requests to atcom will be sent", dateRangeChunks.Count);

            foreach (var dateRangeChunk in dateRangeChunks)
            {
                var cheapestMonthDetails = await _cheapestMonthService.FindCheapestMonth(searchSelectionMessage, dateRangeChunk);
                if (cheapestMonthDetails != null) cheapestMonthsPerSelection.Add(cheapestMonthDetails);
            }
        }

        if (cheapestMonthsPerSelection.Count == 0) return;

        var cheapestMonthForRange = cheapestMonthsPerSelection.FirstOrDefault();
        if (cheapestMonthForRange is null || string.IsNullOrEmpty(cheapestMonthForRange.AirportCode) || string.IsNullOrEmpty(cheapestMonthForRange.Destination))
        {
            _logger.LogError("Missing required key attributes (AirportCode or Destination) in cheapest month data");
            return;
        }

        var prices = cheapestMonthsPerSelection.Select(c =>
          new AttributeValue
          {
              M = new Dictionary<string, AttributeValue>
              {
                    { "Month", new AttributeValue() { N = c.Month.ToString(CultureInfo.InvariantCulture)} },
                    { "Year", new AttributeValue() { N = c.Year.ToString(CultureInfo.InvariantCulture)} },
                    { "Price", new AttributeValue()
                        {
                            N = c.Price.ToString(CultureInfo.InvariantCulture)
                        }
                    },
                    { "PricePP", new AttributeValue() { N = c.PricePP.ToString(CultureInfo.InvariantCulture)} },
              }
          }).ToList();

        var request = new PutItemRequest
        {
            TableName = _awsSettings.Storage.Tables.CheapestMonth,
            Item = new Dictionary<string, AttributeValue>
                {
                      { "Airport", new AttributeValue() { S = cheapestMonthForRange?.AirportCode } },
                      { "Destination", new AttributeValue() { S = cheapestMonthForRange?.Destination} },
                      { "UpdatedAt", new AttributeValue(){ S = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture)}},
                      { "Prices", new AttributeValue() { L = prices }
                }}
        };

        _logger.LogInformation("Saving cheapest month for selection model into database: {Model}", string.Join("|", cheapestMonthsPerSelection));
        await _client.PutItemAsync(request);
    }

    /// <summary>
    /// Gets the sqs messages.
    /// </summary>
    /// <param name="sqsEvent">The sqs event.</param>
    /// <returns>A list of SearchSelectionData.</returns>
    private static List<SearchSelectionData> GetSqsMessages(SQSEvent sqsEvent)
    {
        ArgumentNullException.ThrowIfNull(sqsEvent);

        if (sqsEvent.Records.Count == 0)
        {
            throw new InvalidOperationException("No records found in the SQS event.");
        }

        var searchSelectionMessages = new List<SearchSelectionData>();
        for (var i = 0; i < sqsEvent.Records.Count; i++)
        {
            if (sqsEvent.Records[i].Body.IsNullOrEmpty())
            {
                throw new InvalidOperationException("Body of sqs record is null.");
            }

            var sqsRecord = JsonConvert.DeserializeObject<SearchSelectionData?>(sqsEvent.Records[i].Body) ?? throw new InvalidOperationException("SearchSelectionData sqs record is null.");
            searchSelectionMessages.Add(sqsRecord);
        }

        return searchSelectionMessages;
    }

    /// <summary>
    /// Gets the search end date.
    /// </summary>
    /// <param name="searchSelectionData">The search selection data.</param>
    /// <returns>A Task.</returns>
    private async Task<DateTime> GetSearchEndDate(SearchSelectionData searchSelectionData)
    {
        var defaultEndDate = _atcomRequestParamBuilder.LastDayOfMonthAfterMonths(DateTime.UtcNow, 23);
        if (_lambdaSettings.IsLastAvailableFilterOn)
        {
            var availabilityMonths = await _routeAvailabilityService.GetAvailabilityMonths(searchSelectionData.AirportCode, searchSelectionData.RegionDetails.RegionCode, 7);
            defaultEndDate = availabilityMonths.LastAvailableDate;
        }
        return defaultEndDate;
    }

}
