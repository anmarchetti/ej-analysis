using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Services.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Services;
/// <summary>
/// CheapestMonthSyncRunnerHandler
/// </summary>
public class CheapestMonthSyncRunnerHandler : ICheapestMonthSyncRunnerHandler
{
    private readonly IMarketService _marketService;
    private readonly ICheapestMonthSqsMessageService _cheapestMonthSqsMessageService;
    private readonly ILogger<CheapestMonthSyncRunnerHandler> _logger;
    private readonly Settings.LambdaSettings _lambdaSettings;

    /// <summary>
    /// Initializes a new instance of the <see cref="CheapestMonthSyncRunnerHandler"/> class.
    /// </summary>
    /// <param name="marketService">The market service.</param>
    /// <param name="cheapestMonthSqsMessageService">The cheapest month sqs message service.</param>
    /// <param name="logger">The logger.</param>
    /// <param name="lambdaSettings">The lambda settings.</param>
    public CheapestMonthSyncRunnerHandler(
        IMarketService marketService,
        ICheapestMonthSqsMessageService cheapestMonthSqsMessageService,
        ILogger<CheapestMonthSyncRunnerHandler> logger,
        IOptions<Settings.LambdaSettings> lambdaSettings)
    {
        _marketService = marketService;
        _cheapestMonthSqsMessageService = cheapestMonthSqsMessageService;
        _logger = logger;
        _lambdaSettings = lambdaSettings != null ? lambdaSettings.Value : throw new ArgumentNullException(nameof(lambdaSettings));
    }

    /// <summary>
    /// Handler.
    /// </summary>
    /// <returns>A Task.</returns>
    public async Task Handle()
    {
        _logger.LogInformation("CheapestMonthSyncRunner lambda started...");

        var market = _lambdaSettings.Market;
      
        var marketSettings = _marketService.GetMarket(market);
        IsMarketNull(marketSettings, market);

        _logger.LogInformation("Found {Count} airports for market {Market}. Airports: {Airports}", marketSettings.AirportDepartureCodes.Count, market, marketSettings.AirportDepartureCodes);

        var messages = await _cheapestMonthSqsMessageService.BuildMessagesPerSelectionAsync(marketSettings.AirportDepartureCodes.ToList());
        _logger.LogInformation("Messages count to send to SQS: {MessagesCount}", messages.Count);

        await _cheapestMonthSqsMessageService.SendMessages(messages);
    }

    /// <summary>
    /// Are the market null.
    /// </summary>
    /// <param name="marketSettings">The market settings.</param>
    /// <param name="market">The market.</param>
    private void IsMarketNull(MarketSettings? marketSettings, string market)
    {
        if (marketSettings is null || marketSettings.AirportDepartureCodes.Count == 0)
        {
            _logger.LogError("No market settings returned for market {Market} or no airport departure codes.", market);
            throw new InvalidOperationException($"No market settings returned for market {market} or no airport departure codes.");
        }
    }
}
