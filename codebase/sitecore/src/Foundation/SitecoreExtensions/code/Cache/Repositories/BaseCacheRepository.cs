using System;
using System.Threading.Tasks;

namespace easyJet.Foundation.SitecoreExtensions.Cache.Repositories
{
    /// <summary>
    /// Create caches.  Provide utility functions for finding and listing caches.
    /// </summary>
    public abstract class BaseCacheRepository : ICacheRepository
    {
        private static readonly object CacheLock = new object();
        private readonly int cacheExpirationMinutes = Sitecore.Configuration.Settings.GetIntSetting("easyJet.CacheExpiredInMinutes", 5);

        public T Create<T>(string name, T value)
            where T : class
        {
            lock (CacheLock)
            {
                StoreItem(name, value, cacheExpirationMinutes);
                return value;
            }
        }

        public TResponse GetOrCreate<TArgs, TResponse>(Func<TArgs, TResponse> method, TArgs args, string key)
            where TResponse : class, new()
        {
            var result = GetItem<TResponse>(key);
            if (result == null)
            {
                result = method(args);
                if (result != null)
                {
                    Create(key, result);
                }
            }

            return result;
        }

        public TResponse GetOrCreate<TResponse>(Func<TResponse> method, string key)
            where TResponse : class, new()
        {
            var result = GetItem<TResponse>(key);
            if (result == null)
            {
                result = method();
                if (result != null)
                {
                    Create(key, result);
                }
            }

            return result;
        }

        public TProperty GetOrCreate<TArgs, TResponse, TProperty>(
            Func<TArgs, TResponse> method,
            TArgs args,
            string key,
            Func<TResponse, TProperty> propertyGetter,
            Action<TResponse, TProperty> propertySetter)
            where TResponse : class, new()
        {
            var result = default(TProperty);

            var fullCachedResult = GetItem<TResponse>(key);
            if (fullCachedResult != null)
            {
                result = propertyGetter(fullCachedResult);
            }

            if (result == null)
            {
                var response = method(args);
                if (response != null)
                {
                    result = propertyGetter(response);
                    if (result != null)
                    {
                        if (fullCachedResult != null)
                        {
                            propertySetter(fullCachedResult, result);
                        }
                        else
                        {
                            fullCachedResult = response;
                        }

                        Create(key, fullCachedResult);
                    }
                }
            }

            return result;
        }

        // Task<TResponse> ExecuteAsync(args);
        public async Task<TResponse> GetOrCreateAsync<TArgs, TResponse>(Func<TArgs, Task<TResponse>> method, TArgs args, string key)
            where TResponse : class
        {
            TResponse result = GetItem<TResponse>(key);
            if (result == null)
            {
                result = await method(args);
                if (result != null)
                {
                    Create(key, result);
                }
            }

            return result;
        }

        // Task<TResponse> ExecuteAsync();
        public async Task<TResponse> GetOrCreateAsync<TResponse>(Func<Task<TResponse>> method, string key)
            where TResponse : class
        {
            TResponse result = GetItem<TResponse>(key);
            if (result == null)
            {
                result = await method();
                if (result != null)
                {
                    Create(key, result);
                }
            }

            return result;
        }

        public abstract T GetItem<T>(string key)
            where T : class;

        public abstract T StoreItem<T>(string key, T item, int expirationMinutes = 0)
            where T : class;

        public abstract void RemoveItem(string key);

        /// <inheritdoc />
        public virtual T GetOrAdd<T>(string key, Func<T> getData, int expirationMinutes = 0)
            where T : class
        {
            if (getData == null)
            {
                throw new ArgumentNullException(nameof(getData));
            }

            if (string.IsNullOrWhiteSpace(key))
            {
                throw new ArgumentNullException(nameof(key));
            }

            var data = GetItem<T>(key);

            if (data != null)
            {
                return data;
            }

            var result = getData();

            if (result != null)
            {
                StoreItem(key, result, expirationMinutes);
            }

            return result;
        }
    }
}