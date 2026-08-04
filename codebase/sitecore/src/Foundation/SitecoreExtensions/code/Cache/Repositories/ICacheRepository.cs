using System;
using System.Threading.Tasks;

namespace easyJet.Foundation.SitecoreExtensions.Cache.Repositories
{
    public interface ICacheRepository
    {
        T GetItem<T>(string key)
            where T : class;

        void RemoveItem(string key);

        T StoreItem<T>(string key, T item, int expirationMinutes = 0)
            where T : class;

        /// <summary>
        /// Gets data from cache or if cache empty - call `getData` and store into cache.
        /// </summary>
        /// <typeparam name="T">Data.</typeparam>
        /// <param name="key">Cache key.</param>
        /// <param name="getData">Function to get data.</param>
        /// <param name="expirationMinutes">Expiration time in minutes.</param>
        /// <returns>Data from cache or method.</returns>
        T GetOrAdd<T>(string key, Func<T> getData, int expirationMinutes = 0)
            where T : class;

        /// <summary>
        /// Gets data from cache asynchronously or if cache empty - call `method` and store into cache.
        /// </summary>
        /// <typeparam name="TResponse">Data.</typeparam>
        /// <param name="method">Method to get data.</param>
        /// <param name="key">Cache key.</param>
        /// <returns>Data from cache or method.</returns>
        Task<TResponse> GetOrCreateAsync<TResponse>(Func<Task<TResponse>> method, string key)
            where TResponse : class;
    }
}