using easyJet.Holidays.Api.Domain.Data.Cache;

namespace easyJet.Holidays.Api.Domain.Services.Cache
{
    /// <summary>
    /// Cache service
    /// </summary>
    public interface ICacheService
    {
        /// <summary>
        /// Get data from cache or add content to cache.
        /// </summary>
        /// <typeparam name="T">Data type</typeparam>
        /// <param name="bucketName">Cache bucket name</param>
        /// <param name="keys">Collection of keys to build cache item identifier</param>
        /// <param name="getData">Function to build data</param>
        /// <param name="forceUpdate">Whether force cache update or not</param>
        /// <returns>Data value</returns>
        Task<T> GetOrAddAsync<T>(string bucketName, ICollection<string> keys, Func<Task<T>> getData, bool forceUpdate);

        /// <summary>
        /// De GetOrAdd for multiple items
        /// </summary>
        /// <typeparam name="T">Item type</typeparam>
        /// <param name="bucketName">Cache bucket name</param>
        /// <param name="commonKeys">Common colelctino of cache keys</param>
        /// <param name="itemIds">Collection of item ids</param>
        /// <param name="getItemId">Function to get identifier for item</param>
        /// <param name="getData">Function to get data by item ids</param>
        /// <param name="forceUpdate">Whether force cache update or not</param>
        /// <returns></returns>
        Task<IEnumerable<T>> GetOrAddMultipleAsync<T>(string bucketName, ICollection<string> commonKeys, ICollection<string> itemIds, Func<T, string> getItemId, Func<ICollection<string>, Task<ICollection<T>>> getData, bool forceUpdate);

        /// <summary>
        /// Get data from cache
        /// </summary>
        /// <typeparam name="T">Data type</typeparam>
        /// <param name="bucketName">Bucket name(part of item key)</param>
        /// <param name="keys">Collection of keys</param>
        /// <returns>Data from cache</returns>
        Task<T> Get<T>(string bucketName, ICollection<string> keys);

        /// <summary>
        /// Get all cache values for the provided bucket
        /// </summary>
        /// <param name="bucket">bucket name</param>
        /// <returns>dictionary where key is cache key, and value is the stored object, that relates to this key</returns>

        Task<Dictionary<string, object>> GetAllValuesForBucket(string bucket);

        /// <summary>
        /// Removes all items from cache
        /// </summary>
        Task RemoveAllAsync();

        /// <summary>
        /// Removes all items from cache for specific bucket: item id starts with <code>bucketName</code>
        /// </summary>
        /// <param name="bucketName">Bucket name</param>
        Task RemoveAsync(string bucketName);

        /// <summary>
        /// Remove values from cache by bucketAnme and specific keys
        /// </summary>
        /// <param name="bucketName"></param>
        /// <param name="keys"></param>
        /// <returns></returns>
        Task RemoveAsync(string bucketName, ICollection<string> keys);

        /// <summary>
        /// Gets the memory statistics for current process and each bucket
        /// </summary>
        /// <param name="withKeys">Whether includein response cache keys or not</param>
        /// <returns></returns>
        CacheStatus Status(bool withKeys);
    }
}
