using easyJet.Holidays.Api.Domain.Data.Cache;

namespace easyJet.Holidays.Api.Domain.Services.Cache
{
    /// <summary>
    /// Stub for cache service to use in tests
    /// </summary>
    public class NoCacheService : ICacheService
    {
        public Task<T> Get<T>(string bucketName, ICollection<string> keys)
        {
            return Task.FromResult(default(T));
        }

        public Task<T> GetOrAddAsync<T>(string bucketName, ICollection<string> keys, Func<Task<T>> getData, bool forceUpdate)
        {
            return getData();
        }

        public async Task<IEnumerable<T>> GetOrAddMultipleAsync<T>(string bucketName, ICollection<string> commonKeys, ICollection<string> itemIds, Func<T, string> getItemId, Func<ICollection<string>, Task<ICollection<T>>> getData, bool forceUpdate)
        {
            return (await getData(itemIds)).ToList();
        }

        public Task<Dictionary<string, object>> GetAllValuesForBucket(string bucket)
        {
            return Task.FromResult(new Dictionary<string, object>());
        }

        public Task RemoveAllAsync()
        {
            return Task.CompletedTask;
        }

        public Task RemoveAsync(string bucketName)
        {
            return Task.CompletedTask;
        }

        public Task RemoveAsync(string bucketName, ICollection<string> keys)
        {
            return Task.CompletedTask;
        }

        public CacheStatus Status(bool withKeys)
        {
            return new CacheStatus();
        }
    }
}

