using easyJet.Holidays.Api.Domain.Data.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Collections;
using System.Collections.Concurrent;
using System.Diagnostics;

namespace easyJet.Holidays.Api.Domain.Services.Cache;

/// <summary>
/// Cache
/// </summary>
public abstract class BaseCacheService : ICacheService
{
    private const string KeyDelimiter = "_";
    private const int DefaultLockTimeout = 30000;
    private const long Kb = 1024;
    private const long Mb = Kb * 1024;

    /// <summary>
    /// Separate locks for each cache entry
    /// </summary>
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _cacheLockSemaphoreDictionary =
        new ConcurrentDictionary<string, SemaphoreSlim>();

    /// <summary>
    /// Collection of cache keys to clear them
    /// </summary>
    private readonly ConcurrentQueue<string> _cacheKeys = new ConcurrentQueue<string>();

    /// <summary>
    /// TimeSlots to wait for cache lock(update)
    /// </summary>
    private readonly TimeSpan _waitLockTimeout;

    private readonly CacheSettings _cacheSettings;

    /// <summary>
    /// Constructor
    /// </summary>
    protected BaseCacheService(ILogger<BaseCacheService> logger,
        IOptions<CacheSettings> cacheSettings)
    {
        _cacheSettings = cacheSettings.Value ?? throw new ArgumentNullException(nameof(cacheSettings));
        Logger = logger;

        // Lock timeout (default value is 30000 milliseconds)
        var waitLockMilliSeconds = _cacheSettings.WaitLockTimeoutMilliSeconds;
        waitLockMilliSeconds = waitLockMilliSeconds <= 0 ? DefaultLockTimeout : waitLockMilliSeconds;
        _waitLockTimeout = TimeSpan.FromMilliseconds(waitLockMilliSeconds);
    }

    /// <summary>
    /// 
    /// </summary>
    protected internal ILogger<BaseCacheService> Logger { get; }

    /// <inheritdoc />
    public virtual async Task<IEnumerable<T>> GetOrAddMultipleAsync<T>(string bucketName,
        ICollection<string> commonKeys, ICollection<string> itemIds, Func<T, string> getItemId,
        Func<ICollection<string>, Task<ICollection<T>>> getData, bool forceUpdate = false)
    {
        // Get from cache. getData returns null because we don't want to put anything in cache now
        var cacheTasks = itemIds.Select(id => GetOrAddAsync<T>(bucketName,
            commonKeys.Concat(new List<string> { id }).ToList(), () => Task.FromResult(default(T))));
        var dataFromCache = (await Task.WhenAll(cacheTasks)).Where(x => x != null).ToList();

        // Load missing data
        var idsToLoad = itemIds.Except(dataFromCache.Select(getItemId));
        var loadedData = await getData(idsToLoad.ToList());

        // Put new data in cache. Use GetOrAdd because 1) data can be already in cache, 2) it's thread-safe
        var loadedDataTasks = loadedData.Select(item => GetOrAddAsync(bucketName,
            commonKeys.Concat(new[] { getItemId(item) }).ToList(), () => Task.FromResult(item)));
        await Task.WhenAll(loadedDataTasks);

        return loadedData.Concat(dataFromCache).ToArray();
    }

    /// <inheritdoc />
    public virtual async Task<T> GetOrAddAsync<T>(string bucketName, ICollection<string> keys,
        Func<Task<T>> getData, bool forceUpdate = false)
    {
        if (string.IsNullOrWhiteSpace(bucketName))
        {
            throw new ArgumentNullException(nameof(bucketName));
        }

        if (getData == null)
        {
            throw new ArgumentNullException(nameof(getData));
        }

        if (keys == null || !keys.Any())
        {
            throw new ArgumentNullException(nameof(keys));
        }

        var cacheKey = GetCacheKey(bucketName, keys);

        T resultFromCache = default;
        if (!forceUpdate)
        {
            resultFromCache = await Get<T>(cacheKey);
            if (resultFromCache != null)
            {
                return resultFromCache;
            }
        }

        // Thread sync for retrieving / caching content
        var lockObject = GetLockObject(cacheKey);
        if (await lockObject.WaitAsync(_waitLockTimeout))
        {
            try
            {
                if (!forceUpdate)
                {
                    resultFromCache = await Get<T>(cacheKey);
                }

                if (resultFromCache == null)
                {
                    // Get content
                    var result = await getData();
                    T defaultValue = default(T);
                    if (Equals(result, defaultValue))
                    {
                        return defaultValue;
                    }

                    try
                    {
                        // Catch only Add because e.g. getData is not part of cache and shouldn't be catched here
                        // Add to cache
                        await Add(bucketName, cacheKey, result);
                        resultFromCache = result;
                    }
                    catch (Exception ex)
                    {
                        Logger.LogError(ex,
                            "Unexpected error occured. Cannot add item to cache, key: {CacheKey}", cacheKey);
                    }
                }
            }
            finally
            {
                lockObject.Release();
            }
        }
        else
        {
            Logger.LogError("Timeout waiting for lock for {CacheKey}", cacheKey);
            // timeout, but cache data could be changed. The best we can do here is to get latest data from cache
            resultFromCache = await Get<T>(cacheKey);
        }

        return resultFromCache;
    }

    /// <inheritdoc />
    public Task<T> Get<T>(string bucketName, ICollection<string> keys)
    {
        if (string.IsNullOrWhiteSpace(bucketName))
        {
            throw new ArgumentNullException(nameof(bucketName));
        }

        if (keys == null || !keys.Any())
        {
            throw new ArgumentNullException(nameof(keys));
        }

        var cacheKey = GetCacheKey(bucketName, keys);

        var res = Get<T>(cacheKey);
        return res;
    }

    /// <inheritdoc />
    public async Task<Dictionary<string, object>> GetAllValuesForBucket(string bucket)
    {
        ArgumentNullException.ThrowIfNull(bucket, nameof(bucket));

        var dict = new Dictionary<string, object>();

        // in the cache key, the bucket is at the beginning and is surrounded by underscores (e.g. _CmsHotels_)
        foreach (var key in _cacheKeys.Where(key => key.StartsWith($"_{bucket}_")))
        {
            var value = await Get<object>(key);
            dict.TryAdd(key, value);
        }

        return dict;
    }

    /// <summary>
    /// Add item to cache 
    /// </summary>
    /// <typeparam name="T">Object type</typeparam>
    /// <param name="bucketName">Cache bucket name(category)</param>
    /// <param name="cacheKey">Cache key</param>
    /// <param name="item">Item to add</param>
    public async Task Add<T>(string bucketName, string cacheKey, T item)
    {
        if (string.IsNullOrWhiteSpace(bucketName))
        {
            throw new ArgumentNullException(nameof(bucketName), "Value cannot be null or whitespace.");
        }

        if (string.IsNullOrWhiteSpace(cacheKey))
        {
            throw new ArgumentNullException(nameof(bucketName), "Value cannot be null or whitespace.");
        }

        if (item == null || Equals(item, default(T)))
        {
            // Don't cache null values
            Logger.LogTrace("Can not add to cache null value for cacheKey: {CacheKey}", cacheKey);
            return;
        }

        if (item is string)
        {
            var resultAsString = item.ToString();
            if (string.IsNullOrWhiteSpace(resultAsString))
            {
                Logger.LogTrace("Can not add to cache empty string for cacheKey: {CacheKey}", cacheKey);
                return;
            }
        }

        if (item is IEnumerable resultAsEnumerable)
        {
            if (!resultAsEnumerable.GetEnumerator().MoveNext()) // check if collection is empty
            {
                Logger.LogTrace("Can not add to cache empty collection for cacheKey: {CacheKey}", cacheKey);
                return;
            }
        }

        if (!HaveCacheBucket(bucketName, out var cacheSeconds))
        {
            Logger.LogTrace("No cache seconds configured for bucket {BucketName}", bucketName);
            return;
        }

        if (cacheSeconds <= 0)
        {
            Logger.LogTrace("Cache seconds is less or equal to zero for bucket {BucketName}", bucketName);
            return;
        }

        await SetValue(cacheKey, item, TimeSpan.FromSeconds(cacheSeconds));

        _cacheKeys.Enqueue(cacheKey);
    }

    /// <inheritdoc />
    public async Task RemoveAllAsync()
    {
        Logger.LogInformation("Clearing {Count} items from cache", _cacheKeys.Count);

        var removeCount = 0;
        while (_cacheKeys.TryDequeue(out var cacheKey))
        {
            removeCount++;
            await RemoveByKey(cacheKey);
        }

        Logger.LogInformation("Cleared {RemoveCount} items from cache", removeCount);
    }

    /// <inheritdoc />
    public async Task RemoveAsync(string bucketName)
    {
        if (string.IsNullOrWhiteSpace(bucketName))
        {
            throw new ArgumentNullException(nameof(bucketName), "Value cannot be null or whitespace");
        }

        Logger.LogInformation("Clearing {BucketName} items from cache", bucketName);

        var keyCount = 0;
        var maxCount = _cacheKeys.Count;
        var removeCount = 0;
        while (_cacheKeys.TryDequeue(out var cacheKey) && keyCount < maxCount)
        {
            keyCount++;

            var delimitedCacheKey = KeyDelimiter + bucketName + KeyDelimiter;
            if (cacheKey.IndexOf(delimitedCacheKey, StringComparison.OrdinalIgnoreCase) != 0)
            {
                _cacheKeys.Enqueue(cacheKey);
                continue;
            }

            removeCount++;
            await RemoveByKey(cacheKey);
        }

        Logger.LogInformation("Cleared {RemoveCount} '{BucketName}' items from cache", removeCount, bucketName);
    }

    /// <inheritdoc />
    public async Task RemoveAsync(string bucketName, ICollection<string> keys)
    {
        if (string.IsNullOrWhiteSpace(bucketName))
        {
            throw new ArgumentNullException(nameof(bucketName));
        }

        if (keys == null || !keys.Any())
        {
            throw new ArgumentNullException(nameof(keys));
        }

        var cacheKey = GetCacheKey(bucketName, keys);

        try
        {
            await RemoveByKey(cacheKey);
            Logger.LogInformation("Cleared {CacheKey} from cache", cacheKey);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to remove cacheKey: {CacheKey} from cache", cacheKey);
        }
    }

    /// <summary>
    /// Get object from cache by key
    /// </summary>
    /// <typeparam name="T">Target type</typeparam>
    /// <param name="cacheKey">Cache item key</param>
    /// <returns>Object from cache by key</returns>
    public async Task<T> Get<T>(string cacheKey)
    {
        if (string.IsNullOrWhiteSpace(cacheKey))
        {
            throw new ArgumentNullException(nameof(cacheKey), "Value cannot be null or whitespace");
        }

        // var resultBytes = await _cache.GetAsync(cacheKey);
        var (exists, result) = await TryGetValue<T>(cacheKey);
        if (!exists)
        {
            return default;
        }

        return result;
    }

    /// <summary>
    /// Build cache key from collection of keys: concatenate using "_" delimiter
    /// e.g. ["1", "2"] -> "_1_2"
    /// </summary>
    /// <param name="bucketName">Bucket name</param>
    /// <param name="keys"></param>
    /// <returns></returns>
    public string GetCacheKey(string bucketName, ICollection<string> keys)
    {
        if (keys == null || string.IsNullOrWhiteSpace(bucketName))
        {
            throw new ArgumentNullException(nameof(keys));
        }

        var allKeys = new List<string>(keys.Count() + 1) { bucketName };
        allKeys.AddRange(keys.Where(x => x != null));

        var filteredKeys = allKeys.Where(x => !string.IsNullOrWhiteSpace(x));
        return $"_{string.Join(KeyDelimiter, filteredKeys)}";
    }

    /// <inheritdoc />
    public CacheStatus Status(bool withKeys)
    {
        decimal BytesToMb(decimal b) => Math.Round(b / Mb, 3);

        var groupedByBucketName = _cacheKeys.GroupBy(key =>
        {
            var bucketNameEnd = key.IndexOf(KeyDelimiter, 1, StringComparison.Ordinal);
            return key.Substring(1, bucketNameEnd - 1);
        }).ToDictionary(k => k.Key, keys => keys.ToList());

        var bucketStats = new Dictionary<string, CacheBucketStatus>();
        foreach (var pair in groupedByBucketName)
        {
            var keys = pair.Value;

            bucketStats[pair.Key] = new CacheBucketStatus
            {
                Keys = withKeys ? keys : null,
                KeysNumber = keys.Count
            };
        }

        var process = Process.GetCurrentProcess();
        var gcMemory = GC.GetTotalMemory(false);
        return new CacheStatus
        {
            Process = new ProcessStatus
            {
                WorkingSetMb = BytesToMb(process.WorkingSet64),
                PrivateMemorySizeMb = BytesToMb(process.PrivateMemorySize64),
                GcTotalMb = BytesToMb(gcMemory)
            },
            Buckets = bucketStats
        };
    }

    /// <summary>
    /// 
    /// </summary>
    /// <param name="key"></param>
    /// <returns></returns>
    public abstract Task RemoveByKey(string key);
    /// <summary>
    /// 
    /// </summary>
    /// <param name="cacheKey"></param>
    /// <param name="item"></param>
    /// <param name="expiration"></param>
    /// <typeparam name="T"></typeparam>
    /// <returns></returns>
    public abstract Task SetValue<T>(string cacheKey, T item, TimeSpan expiration);

    /// <summary>
    /// 
    /// </summary>
    /// <param name="cacheKey"></param>
    /// <typeparam name="T"></typeparam>
    /// <returns></returns>
    public abstract Task<Tuple<bool, T>> TryGetValue<T>(string cacheKey);

    private bool HaveCacheBucket(string bucketName, out int cacheSeconds)
    {
        if (_cacheSettings.ExpirationSeconds.TryGetValue(bucketName, out cacheSeconds))
        {
            return true;
        }

        Logger.LogError("Couldn't find expiration info for cache bucket {BucketName}", bucketName);
        return false;
    }

    private SemaphoreSlim GetLockObject(string lockId)
    {
        return _cacheLockSemaphoreDictionary.GetOrAdd(lockId, new SemaphoreSlim(1, 1));
    }
}