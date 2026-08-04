using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.ReferenceData.Destinations
{
    /// <summary>
    /// Destination titles service. Uses cache layer to increase performance
    /// </summary>
    public class DestinationTitlesService : IDestinationTitlesService
    {
        private static readonly string DestinationTitleCacheKey = "DestinationTitle";
        private readonly IDestinationsService _destinationsService;
        private readonly ICacheService _cacheService;
        private readonly ILogger<DestinationTitlesService> _logger;
        private readonly CacheSettings _cacheSettings;

        /// <summary>
        /// Constructor
        /// </summary>        
        public DestinationTitlesService(IDestinationsService destinationsService, ICacheService cacheService, IOptions<CacheSettings> cacheSettings, ILogger<DestinationTitlesService> logger)
        {
            _cacheSettings = cacheSettings.Value ?? throw new ArgumentNullException(nameof(cacheSettings));
            _destinationsService = destinationsService;
            _cacheService = cacheService;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<IEnumerable<DestinationItem>> GetTitles(string[] codes, string lang)
        {
            // Try to get data from cache for each code
            var cacheTasks = codes.Select(code => _cacheService.Get<DestinationItem>(
                _cacheSettings.Buckets.CmsDestinationTitles,
                new[] { DestinationTitleCacheKey, lang, code })
            );

            var cacheResults = (await Task.WhenAll(cacheTasks)).Where(x => x != null);
            var codesInCache = cacheResults.Where(x => !string.IsNullOrWhiteSpace(x.Name)).Select(x => x.Code);

            // Get CMS data for items which are not cached
            var codesToUpdate = codes.Where(x => !codesInCache.Contains(x)).ToList();
            if (codesToUpdate.Any())
            {
                _logger.LogInformation("Getting destination titles from cache, lang={Lang}, codes={Codes}", lang, string.Join(",", codesToUpdate));

                var itemsFromCms = await _destinationsService.GetTitles(codesToUpdate.ToArray());
                cacheResults = cacheResults.Concat(itemsFromCms);

                // And put new data in cache
                var cacheUpdateTasks = itemsFromCms.ToList().Select(item =>
                {
                    return _cacheService.GetOrAddAsync(
                        _cacheSettings.Buckets.CmsDestinationTitles,
                        new[] { DestinationTitleCacheKey, lang, item.Code },
                        () => Task.FromResult(item),
                        false);
                });
                await Task.WhenAll(cacheUpdateTasks);
            }

            return cacheResults;
        }
    }
}
