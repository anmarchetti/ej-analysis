using easyJet.Holidays.Api.Domain.Services.Serialization;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Cache
{
    /// <summary>
    /// Cache implementation using <see cref="IDistributedCache"/>
    /// </summary>
    public class CacheService : BaseCacheService
    {
        private readonly IDistributedCache _cache;
        private readonly ISerializationService _serializationService;

        /// <summary>
        /// Constructor
        /// </summary>
        public CacheService(IDistributedCache cache, ILogger<BaseCacheService> logger,
            IOptions<CacheSettings> cacheSettings, ISerializationService serializationService) : base(logger,
            cacheSettings)
        {
            _cache = cache;
            _serializationService = serializationService;
        }

        /// <inheritdoc />
        public override async Task RemoveByKey(string key)
        {
            await _cache.RemoveAsync(key);
        }

        /// <inheritdoc />
        public override async Task SetValue<T>(string cacheKey, T item, TimeSpan expiration)
        {
            var cacheEntryOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiration
            };

            var resultBytes = _serializationService.Serialize(item);

            Logger.LogTrace("Added {ResultBytes} bytes to cache for key '{CacheKey}'", resultBytes.Length, cacheKey);

            await _cache.SetAsync(cacheKey, resultBytes, cacheEntryOptions);
        }

        /// <inheritdoc />
        public override async Task<Tuple<bool, T>> TryGetValue<T>(string cacheKey)
        {
            var resultBytes = await _cache.GetAsync(cacheKey);
            if (resultBytes == null || resultBytes.Length == 0)
            {
                return Tuple.Create<bool, T>(false, default);
            }

            Logger.LogTrace("Got {ResultBytes} bytes from cache for key '{CacheKey}'", resultBytes.Length, cacheKey);

            var value = _serializationService.Deserialize<T>(resultBytes);
            return Tuple.Create(true, value);
        }
    }
}