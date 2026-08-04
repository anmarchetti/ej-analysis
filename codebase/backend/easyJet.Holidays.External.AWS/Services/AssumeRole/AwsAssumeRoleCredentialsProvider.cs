using Amazon.Runtime;
using Amazon.SecurityToken;
using Amazon.SecurityToken.Model;
using easyJet.Holidays.Api.Domain.Interfaces.Aws;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.Services.AssumeRole;

/// <summary>
/// Represents the set of role codes used to specify and identify different
/// AWS IAM roles associated with the application's operations.
/// </summary>
public enum ArnRoleCodes
{
    /// <summary>
    /// Represents the enum member for the Apollo IAM role.
    /// This role is used to retrieve credentials specific to AWS operations
    /// associated with the Apollo service in the application.
    /// </summary>
    Apollo,
}

/// <summary>
/// Provides functionality to retrieve AWS credentials by assuming a specified IAM role.
/// This class uses an AWS Security Token Service (STS) client to assume roles
/// and supports caching of credentials for improved performance and reduced API calls.
/// </summary>
public sealed class AwsAssumeRoleCredentialsProvider : IAwsAssumeRoleCredentialsProvider, IDisposable
{
    private readonly IAmazonSecurityTokenService _securityTokenService;
    private readonly AwsSettings _settings;
    private readonly ICacheService _cacheService;
    private readonly CacheSettings _cacheSettings;
    private readonly SemaphoreSlim _syncLock = new(1, 1);
    private bool _disposed;

    /// <summary>
    /// Provides a mechanism to retrieve AWS credentials for cross-account access using the AssumeRole operation.
    /// This provider supports caching and configuration-driven credential retrieval through integration with AWS STS.
    /// </summary>
    /// <param name="awsClient">The AWS client instance used to interact with AWS services.</param>
    /// <param name="cacheService">The caching service for storing AssumeRole credentials temporarily to optimize performance.</param>
    /// <param name="cacheSettings">Configuration settings for caching behavior, including expiration times and cache keys.</param>
    /// <param name="settings">The AWS settings containing configurations for STS and AssumeRole operations.</param>
    /// <exception cref="ArgumentNullException">Thrown when any of the required dependencies are null.</exception>
    public AwsAssumeRoleCredentialsProvider(
        AwsClient awsClient,
        ICacheService cacheService,
        IOptions<CacheSettings> cacheSettings,
        IOptions<AwsSettings> settings)
    {
        ArgumentNullException.ThrowIfNull(awsClient);

        _cacheService = cacheService ?? throw new ArgumentNullException(nameof(cacheService));
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        _cacheSettings = cacheSettings?.Value ?? throw new ArgumentNullException(nameof(cacheSettings));
        _securityTokenService = awsClient.GetSTSClient(_settings.STS.Client.Region);
    }

    /// <summary>
    /// Retrieves AWS credentials for the Apollo role using cached data or by invoking the necessary AssumeRole operation.
    /// </summary>
    /// <param name="cancellationToken">A token to observe for cancellation requests.</param>
    /// <returns>An <see cref="ImmutableCredentials"/> object containing the credentials for the Apollo role.</returns>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the AWS STS AssumeRole operation does not return valid credentials or if the Apollo role settings are misconfigured.
    /// </exception>
    public async Task<ImmutableCredentials> GetApolloCredentialsAsync(CancellationToken cancellationToken = default) =>
        await GetCredentialsAsync(ArnRoleCodes.Apollo, cancellationToken);

    /// <summary>
    /// Retrieves AWS credentials for a specified role using cached data or fetching new credentials if necessary.
    /// </summary>
    /// <param name="roleCode">The role code identifying the AWS role to assume.</param>
    /// <param name="cancellationToken">A token to observe for cancellation requests.</param>
    /// <returns>An <see cref="ImmutableCredentials"/> object containing the assumed AWS role credentials.</returns>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the AWS STS AssumeRole operation does not return valid credentials or if the role settings are invalid.
    /// </exception>
    public async Task<ImmutableCredentials> GetCredentialsAsync(ArnRoleCodes roleCode,
        CancellationToken cancellationToken = default)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        var key = roleCode.ToString();
        return await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.StsCache, [key], async () =>
        {
            // Cache providers can execute factories concurrently, so we protect STS calls per instance.
            await _syncLock.WaitAsync(cancellationToken);
            try
            {
                var awsSettings = GetRoleSettings(roleCode);
                if (string.IsNullOrWhiteSpace(awsSettings.RoleArn))
                {
                    throw new InvalidOperationException("Apollo AWS RoleArn must be configured.");
                }

                var assumeRoleRequest = new AssumeRoleRequest
                {
                    RoleArn = awsSettings.RoleArn, RoleSessionName = awsSettings.RoleSessionName
                };

                var assumeRoleResponse =
                    await _securityTokenService.AssumeRoleAsync(assumeRoleRequest, cancellationToken);
                var credentials = assumeRoleResponse.Credentials
                                  ?? throw new InvalidOperationException(
                                      "AWS STS AssumeRole returned null credentials.");

                return ToImmutable(credentials);
            }
            finally
            {
                _syncLock.Release();
            }
        }, false);
    }

    /// <summary>
    /// Converts AWS STS credentials to an immutable format for secure and thread-safe access.
    /// </summary>
    /// <param name="credentials">The temporary credentials obtained from AWS Security Token Service.</param>
    /// <returns>An instance of <see cref="ImmutableCredentials"/> containing the access key, secret key, and session token.</returns>
    private static ImmutableCredentials ToImmutable(Credentials credentials)
    {
        return new ImmutableCredentials(
            credentials.AccessKeyId,
            credentials.SecretAccessKey,
            credentials.SessionToken);
    }

    /// <summary>
    /// Retrieves the AWS settings for a specified IAM role code.
    /// This method maps a given role code to its corresponding AWS configuration settings
    /// used for assuming roles using AWS Security Token Service (STS).
    /// </summary>
    /// <param name="roleCode">The role code representing the IAM role for which the settings are being retrieved.</param>
    /// <returns>The AWS settings for the specified role code including configurations such as RoleArn and RoleSessionName.</returns>
    /// <exception cref="ArgumentOutOfRangeException">Thrown when the provided role code does not have a supported or defined mapping in the application settings.</exception>
    private ApolloAwsSettings GetRoleSettings(ArnRoleCodes roleCode)
    {
        return roleCode switch
        {
            ArnRoleCodes.Apollo => _settings.STS.Apollo,
            _ => throw new ArgumentOutOfRangeException(nameof(roleCode), roleCode, "Unsupported role code."),
        };
    }

    /// <summary>
    /// Releases all resources used by the AwsAssumeRoleCredentialsProvider instance.
    /// This method is responsible for disposing any managed and unmanaged resources held by the object
    /// to ensure proper cleanup and avoid memory leaks.
    /// </summary>
    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _securityTokenService.Dispose();
        _syncLock.Dispose();
        _disposed = true;
        GC.SuppressFinalize(this);
    }
}
    
