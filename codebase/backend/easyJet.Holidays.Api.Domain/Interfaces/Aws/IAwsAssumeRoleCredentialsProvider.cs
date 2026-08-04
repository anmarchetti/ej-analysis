using Amazon.Runtime;

namespace easyJet.Holidays.Api.Domain.Interfaces.Aws;

/// <summary>
/// Interface for providing AWS credentials by assuming a specified IAM role.
/// </summary>
public interface IAwsAssumeRoleCredentialsProvider
{
    /// <summary>
    /// Retrieves AWS credentials for Apollo using assumed role authentication.
    /// </summary>
    /// <param name="cancellationToken">An optional cancellation token to cancel the operation.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the AWS credentials as an instance of <see cref="ImmutableCredentials"/>.</returns>
    Task<ImmutableCredentials> GetApolloCredentialsAsync(CancellationToken cancellationToken = default);
}
