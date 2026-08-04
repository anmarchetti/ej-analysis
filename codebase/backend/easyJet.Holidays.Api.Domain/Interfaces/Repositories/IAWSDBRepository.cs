namespace easyJet.Holidays.Api.Domain.Interfaces.Repositories
{
    /// <summary>
    /// AWS DynamoDB repository interface
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public interface IAWSDbRepository<T> where T : class
    {
        /// <summary>
        /// Get items by hash keys. Use only if table has hash key.
        /// </summary>
        /// <param name="hashKeys"></param>
        /// <returns></returns>
        Task<IEnumerable<T>> GetAsync(IEnumerable<object> hashKeys);

        /// <summary>
        /// Get items by hash key. Use only if table has hash key and range key.
        /// </summary>
        /// <param name="hashKey"></param>
        /// <returns></returns>
        Task<IEnumerable<T>> GetAsync(object hashKey);

        /// <summary>
        /// Get item by hash key and range key.
        /// </summary>
        /// <param name="hashKey"></param>
        /// <param name="rangeKey"></param>
        /// <returns></returns>
        Task<T> GetAsync(object hashKey, object rangeKey);

        /// <summary>
        /// Get item by hash key. Use only if table has only hash key without range key.
        /// If table has hash key and range key use <see cref="GetAsync(object, object)"/>
        /// </summary>
        /// <param name="hashKey"></param>
        /// <returns></returns>
        Task<T> GetItemAsync(object hashKey);

        /// <summary>
        /// Save item into table
        /// </summary>
        /// <param name="item"></param>
        /// <returns></returns>
        Task SaveAsync(T item);

        /// <summary>
        /// Delete item from table
        /// </summary>
        /// <param name="item"></param>
        /// <returns></returns>
        Task DeleteAsync(T item);

        /// <summary>
        /// Delete all items from table
        /// </summary>
        /// <returns></returns>
        Task DeleteAllAsync();

        /// <summary>
        ///  Delete items from table
        /// </summary>
        /// <param name="hashKeys"></param>
        /// <returns></returns>
        Task DeleteAsync(IEnumerable<object> hashKeys);

        /// <summary>
        /// Get all items from table
        /// </summary>
        /// <returns></returns>
        Task<IEnumerable<T>> GetAllAsync();

        /// <summary>
        /// Save items into table
        /// </summary>
        /// <param name="items"></param>
        /// <returns></returns>
        Task SaveAsync(IEnumerable<T> items);
    }
}