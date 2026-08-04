using System.Linq;
using easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Models;
using easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Services;

/// <summary>
/// Interface for discounted offer synchronization service.
/// </summary>
internal interface IHbgHotelDiscountsService 
{
    /// <summary>
    /// Synchronizes data between the local and remote sources. 
    /// </summary>
    /// <remarks>This method performs an asynchronous operation to ensure data consistency between local and
    /// remote sources.  It can be canceled by passing a cancellation token.</remarks>
    /// <param name="cancellationToken">A token to monitor for cancellation requests. The default value is <see cref="CancellationToken.None"/>.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the number of items synchronized.</returns>
    Task<int> Sync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Service that fetches discounted offers and delegates persistence to a repository.
/// </summary>
internal sealed class HbgHotelDiscountsService : IHbgHotelDiscountsService
{
    private readonly IHttpClientWrapper _sourceClient;
    private readonly IHbgHotelDiscountsRepository _repository;
    private readonly ILogger<HbgHotelDiscountsService> _logger;
    private readonly LambdaSettings _settings;

    /// <summary>
    /// Constructor for <see cref="HbgHotelDiscountsService"/>.
    /// </summary>
    /// <param name="sourceClient"></param>
    /// <param name="repository"></param>
    /// <param name="settings"></param>
    /// <param name="logger"></param>
    /// <exception cref="ArgumentNullException"></exception>
    public HbgHotelDiscountsService(IHttpClientWrapper sourceClient, IHbgHotelDiscountsRepository repository, 
        IOptions<LambdaSettings> settings, ILogger<HbgHotelDiscountsService> logger)
    {
        ArgumentNullException.ThrowIfNull(sourceClient);
        ArgumentNullException.ThrowIfNull(repository);
        ArgumentNullException.ThrowIfNull(settings);
        ArgumentNullException.ThrowIfNull(logger);

        _sourceClient = sourceClient;
        _repository = repository;
        _logger = logger;
        _settings = settings.Value ?? throw new ArgumentNullException(nameof(settings), "Settings value is null");
    }

    /// <inheritdoc/>
    public async Task<int> Sync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting HBG hotel discounts sync from {Endpoint}", _settings.SourceEndpoint);

        var offers = await _sourceClient.GetOffers(_settings.SourceEndpoint, cancellationToken);
        offers = [.. offers.Where(o => o.DiscountPercentage >= _settings.MinimumDiscountThreshold)];

        if (offers.Count == 0)
        {
            return 0;
        }

        var groupedOffers = offers
            .GroupBy(o => o.AccommodationCode)
            .Select(group => new HbgHotelDiscount
            {
                AccommodationCode = group.Key,
                Discounts = group
                    .Select(o => new Discount
                    {
                        DiscountPercentage = o.DiscountPercentage,
                        GiataCode = o.GiataCode,
                        AccommodationName = o.AccommodationName,
                        TravelWindowFrom = o.TravelWindowFrom,
                        TravelWindowTo = o.TravelWindowTo
                    })
                    .ToList()
                    .AsReadOnly()
            })
            .ToList();

        _logger.LogInformation("Fetched {Count} HBG hotel discounts", groupedOffers.Count);
        await _repository.ClearOffers(_settings.DynamoDbTableName, cancellationToken);
        var written = await _repository.WriteOffers(groupedOffers, _settings.DynamoDbTableName, cancellationToken);

        _logger.LogInformation("Successfully wrote {Count} HBG hotel discounts to DynamoDB table {Table}", written, _settings.DynamoDbTableName);
        return written;
    }
}
