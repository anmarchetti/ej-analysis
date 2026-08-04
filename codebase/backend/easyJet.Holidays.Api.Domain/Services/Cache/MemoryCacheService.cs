using easyJet.Holidays.Api.Domain.Settings;
using Force.DeepCloner;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Cache
{
    /// <summary>
    /// Memory cache implementation using <see cref="IMemoryCache"/>
    /// </summary>
    public class MemoryCacheService : BaseCacheService
    {
        private readonly IMemoryCache _cache;

        /// <summary>
        /// Constructor
        /// </summary>
        public MemoryCacheService(IMemoryCache cache, ILogger<BaseCacheService> logger,
            IOptions<CacheSettings> cacheSettings) : base(logger,
            cacheSettings)
        {
            _cache = cache;
        }

        /// <inheritdoc />
        public override Task RemoveByKey(string key)
        {
            _cache.Remove(key);
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public override Task SetValue<T>(string cacheKey, T item, TimeSpan expiration)
        {
            var cacheEntryOptions = new MemoryCacheEntryOptions().SetAbsoluteExpiration(expiration);
            var itemDeepClone = item.DeepClone(); //to avoid a situation when an object in cache (original) can be mutated by reference
            _cache.Set(cacheKey, itemDeepClone, cacheEntryOptions);
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public override Task<Tuple<bool, T>> TryGetValue<T>(string cacheKey)
        {
            var exists = _cache.TryGetValue(cacheKey, out T value);
            if (exists)
            {
                value = value.DeepClone(); //to avoid a situation when an object in cache (original) can be mutated by reference
            }
            return Task.FromResult(Tuple.Create(exists, value));
        }
    }
}