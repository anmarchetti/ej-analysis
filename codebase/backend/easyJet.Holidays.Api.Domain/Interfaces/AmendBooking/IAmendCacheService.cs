namespace easyJet.Holidays.Api.Domain.Interfaces.AmendBooking
{
    /// <summary>
    /// Provides a caching mechanism for storing and retrieving data in AWS DynamoDB.
    /// </summary>
    /// <remarks>
    /// This service utilizes an AWS DynamoDB table to store serialized items along with expiration times.
    /// Items are identified by a combination of partition key and sort key.
    /// </remarks>
    public interface IAmendCacheService
    {
        /// <summary>
        /// Stores an item in the DynamoDB table, setting an expiration time based on the cache configuration.
        /// </summary>
        /// <typeparam name="T">The type of the item to store. Must be a class type.</typeparam>
        /// <param name="partitionKey">
        /// The partition key in DynamoDB for identifying this item.
        /// </param>
        /// <param name="item">
        /// The object to be serialized and stored in DynamoDB.
        /// </param>
        /// <returns>
        /// A <see cref="Task"/> representing the asynchronous operation. 
        /// Completes when the item has been successfully put into the table.
        /// </returns>
        Task SetItemAsync<T>(string partitionKey, T item) where T : class;

        /// <summary>
        /// Retrieves a previously stored item from the DynamoDB table.
        /// </summary>
        /// <typeparam name="T">The type of the item to retrieve. Must be a class type.</typeparam>
        /// <param name="partitionKey">
        /// The partition key used to identify the item.
        /// </param>
        /// <returns>
        /// A <see cref="Task{T}"/> whose result is the retrieved item as an instance of 
        /// <typeparamref name="T"/>, or <c>null</c> if the item does not exist.
        /// </returns>
        Task<T> GetItemAsync<T>(string partitionKey) where T : class;
    }
}