using easyJet.Holidays.External.Apollo.Models;

namespace easyJet.Holidays.External.Apollo.Services;

/// <summary>
/// Defines the contract for executing GraphQL requests against Apollo AWS endpoints.
/// </summary>
public interface IApolloAwsRequestTemplate
{
    /// <summary>
    /// Sends a GraphQL request to an Apollo AWS endpoint, signs it using SigV4, and deserializes the response.
    /// </summary>
    /// <typeparam name="TResponse">The type of the response model to deserialize into.</typeparam>
    /// <param name="endpoint">The URI of the Apollo AWS endpoint where the request will be sent.</param>
    /// <param name="request">The GraphQL request containing the query, operation name, and variables.</param>
    /// <param name="cancellationToken">
    /// A CancellationToken instance to observe for cancellation requests during the operation.
    /// </param>
    /// <returns>A task representing the asynchronous operation. The task result contains the deserialized response.</returns>
    Task<TResponse> GetGraphQlResponseAsync<TResponse>(
        Uri endpoint,
        ApolloGraphQlRequest request,
        CancellationToken cancellationToken = default);
}
