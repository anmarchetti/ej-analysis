#nullable enable

using Amazon.Runtime;
using Amazon.SecurityToken;
using Amazon.SecurityToken.Model;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Services.AssumeRole;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using Credentials = Amazon.SecurityToken.Model.Credentials;

namespace easyJet.Holidays.External.AWS.Tests.Services.AssumeRole;

public class AwsAssumeRoleCredentialsProviderTests
{
    [Fact]
    public void Constructor_WhenAwsClientNull_ThrowsArgumentNullException()
    {
        var cacheServiceMock = new Mock<ICacheService>();

        var ex = Assert.Throws<ArgumentNullException>(() => new AwsAssumeRoleCredentialsProvider(
            null!,
            cacheServiceMock.Object,
            Options.Create(new CacheSettings { Buckets = new Buckets { StsCache = "sts-cache" } }),
            Options.Create(BuildAwsSettings("eu-west-1", "arn:aws:iam::123456789012:role/apollo-role", "apollo-session"))));

        Assert.Equal("awsClient", ex.ParamName);
    }

    [Fact]
    public async Task GetApolloCredentialsAsync_ReturnsCredentials_AndUsesExpectedCacheAndStsRequest()
    {
        // Arrange
        const string region = "eu-west-1";
        const string roleArn = "arn:aws:iam::123456789012:role/apollo-role";
        const string roleSessionName = "apollo-session";
        const string cacheBucket = "sts-cache";

        var expectedCredentials = new Credentials
        {
            AccessKeyId = "access-key",
            SecretAccessKey = "secret-key",
            SessionToken = "session-token",
            Expiration = DateTime.UtcNow.AddMinutes(30),
        };

        var stsMock = new Mock<IAmazonSecurityTokenService>();
        stsMock
            .Setup(x => x.AssumeRoleAsync(It.IsAny<AssumeRoleRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AssumeRoleResponse { Credentials = expectedCredentials });

        var awsClientMock = new Mock<AwsClient>();
        awsClientMock
            .Setup(x => x.GetSTSClient(region))
            .Returns(stsMock.Object);

        var cacheServiceMock = new Mock<ICacheService>();
        cacheServiceMock
            .Setup(x => x.GetOrAddAsync(
                cacheBucket,
                It.Is<ICollection<string>>(k => k.Count == 1 && k.Contains(ArnRoleCodes.Apollo.ToString())),
                It.IsAny<Func<Task<ImmutableCredentials>>>(),
                false))
            .Returns<string, ICollection<string>, Func<Task<ImmutableCredentials>>, bool>(async (_, _, factory, _) => await factory());

        var sut = new AwsAssumeRoleCredentialsProvider(
            awsClientMock.Object,
            cacheServiceMock.Object,
            Options.Create(new CacheSettings { Buckets = new Buckets { StsCache = cacheBucket } }),
            Options.Create(BuildAwsSettings(region, roleArn, roleSessionName)));

        // Act
        var result = await sut.GetApolloCredentialsAsync();

        // Assert
        Assert.Equal(expectedCredentials.AccessKeyId, result.AccessKey);
        Assert.Equal(expectedCredentials.SecretAccessKey, result.SecretKey);
        Assert.Equal(expectedCredentials.SessionToken, result.Token);
        cacheServiceMock.VerifyAll();
        stsMock.Verify(x => x.AssumeRoleAsync(
            It.Is<AssumeRoleRequest>(r => r.RoleArn == roleArn && r.RoleSessionName == roleSessionName),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetApolloCredentialsAsync_WhenRoleArnMissing_ThrowsInvalidOperationException()
    {
        // Arrange
        var stsMock = new Mock<IAmazonSecurityTokenService>();
        var awsClientMock = new Mock<AwsClient>();
        awsClientMock.Setup(x => x.GetSTSClient(It.IsAny<string>())).Returns(stsMock.Object);

        var cacheServiceMock = new Mock<ICacheService>();
        cacheServiceMock
            .Setup(x => x.GetOrAddAsync(
                It.IsAny<string>(),
                It.IsAny<ICollection<string>>(),
                It.IsAny<Func<Task<ImmutableCredentials>>>(),
                It.IsAny<bool>()))
            .Returns<string, ICollection<string>, Func<Task<ImmutableCredentials>>, bool>(async (_, _, factory, _) => await factory());

        var sut = new AwsAssumeRoleCredentialsProvider(
            awsClientMock.Object,
            cacheServiceMock.Object,
            Options.Create(new CacheSettings { Buckets = new Buckets { StsCache = "sts-cache" } }),
            Options.Create(BuildAwsSettings("eu-west-1", "", "apollo-session")));

        // Act / Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => sut.GetApolloCredentialsAsync());
        Assert.Equal("Apollo AWS RoleArn must be configured.", ex.Message);
        stsMock.Verify(x => x.AssumeRoleAsync(It.IsAny<AssumeRoleRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetApolloCredentialsAsync_WhenAssumeRoleReturnsNullCredentials_ThrowsInvalidOperationException()
    {
        // Arrange
        var stsMock = new Mock<IAmazonSecurityTokenService>();
        stsMock
            .Setup(x => x.AssumeRoleAsync(It.IsAny<AssumeRoleRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AssumeRoleResponse { Credentials = null });

        var awsClientMock = new Mock<AwsClient>();
        awsClientMock.Setup(x => x.GetSTSClient(It.IsAny<string>())).Returns(stsMock.Object);

        var cacheServiceMock = new Mock<ICacheService>();
        cacheServiceMock
            .Setup(x => x.GetOrAddAsync(
                It.IsAny<string>(),
                It.IsAny<ICollection<string>>(),
                It.IsAny<Func<Task<ImmutableCredentials>>>(),
                It.IsAny<bool>()))
            .Returns<string, ICollection<string>, Func<Task<ImmutableCredentials>>, bool>(async (_, _, factory, _) => await factory());

        var sut = new AwsAssumeRoleCredentialsProvider(
            awsClientMock.Object,
            cacheServiceMock.Object,
            Options.Create(new CacheSettings { Buckets = new Buckets { StsCache = "sts-cache" } }),
            Options.Create(BuildAwsSettings("eu-west-1", "arn:aws:iam::123456789012:role/apollo-role", "apollo-session")));

        // Act / Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => sut.GetApolloCredentialsAsync());
        Assert.Equal("AWS STS AssumeRole returned null credentials.", ex.Message);
    }

    [Fact]
    public async Task GetApolloCredentialsAsync_WhenCacheReturnsExistingValue_DoesNotCallSts()
    {
        // Arrange
        var cachedCredentials = new ImmutableCredentials("cached-access", "cached-secret", "cached-token");
        var stsMock = new Mock<IAmazonSecurityTokenService>();

        var awsClientMock = new Mock<AwsClient>();
        awsClientMock.Setup(x => x.GetSTSClient(It.IsAny<string>())).Returns(stsMock.Object);

        var cacheServiceMock = new Mock<ICacheService>();
        cacheServiceMock
            .Setup(x => x.GetOrAddAsync(
                It.IsAny<string>(),
                It.IsAny<ICollection<string>>(),
                It.IsAny<Func<Task<ImmutableCredentials>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(cachedCredentials);

        var sut = new AwsAssumeRoleCredentialsProvider(
            awsClientMock.Object,
            cacheServiceMock.Object,
            Options.Create(new CacheSettings { Buckets = new Buckets { StsCache = "sts-cache" } }),
            Options.Create(BuildAwsSettings("eu-west-1", "arn:aws:iam::123456789012:role/apollo-role", "apollo-session")));

        // Act
        var result = await sut.GetApolloCredentialsAsync();

        // Assert
        Assert.Equal(cachedCredentials.AccessKey, result.AccessKey);
        Assert.Equal(cachedCredentials.SecretKey, result.SecretKey);
        Assert.Equal(cachedCredentials.Token, result.Token);
        stsMock.Verify(x => x.AssumeRoleAsync(It.IsAny<AssumeRoleRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Dispose_DisposesStsClient_AndSubsequentCallsThrowObjectDisposedException()
    {
        // Arrange
        var stsMock = new Mock<IAmazonSecurityTokenService>();

        var awsClientMock = new Mock<AwsClient>();
        awsClientMock.Setup(x => x.GetSTSClient(It.IsAny<string>())).Returns(stsMock.Object);

        var cacheServiceMock = new Mock<ICacheService>(MockBehavior.Strict);
        var sut = new AwsAssumeRoleCredentialsProvider(
            awsClientMock.Object,
            cacheServiceMock.Object,
            Options.Create(new CacheSettings { Buckets = new Buckets { StsCache = "sts-cache" } }),
            Options.Create(BuildAwsSettings("eu-west-1", "arn:aws:iam::123456789012:role/apollo-role", "apollo-session")));

        // Act
        sut.Dispose();
        sut.Dispose();

        // Assert
        stsMock.Verify(x => x.Dispose(), Times.Once);
        await Assert.ThrowsAsync<ObjectDisposedException>(() => sut.GetApolloCredentialsAsync());
    }

    [Fact]
    public async Task GetCredentialsAsync_WhenRoleCodeUnsupported_ThrowsArgumentOutOfRangeException()
    {
        var stsMock = new Mock<IAmazonSecurityTokenService>();
        var awsClientMock = new Mock<AwsClient>();
        awsClientMock.Setup(x => x.GetSTSClient(It.IsAny<string>())).Returns(stsMock.Object);

        var cacheServiceMock = new Mock<ICacheService>();
        cacheServiceMock
            .Setup(x => x.GetOrAddAsync(
                It.IsAny<string>(),
                It.IsAny<ICollection<string>>(),
                It.IsAny<Func<Task<ImmutableCredentials>>>(),
                It.IsAny<bool>()))
            .Returns<string, ICollection<string>, Func<Task<ImmutableCredentials>>, bool>(async (_, _, factory, _) => await factory());

        var sut = new AwsAssumeRoleCredentialsProvider(
            awsClientMock.Object,
            cacheServiceMock.Object,
            Options.Create(new CacheSettings { Buckets = new Buckets { StsCache = "sts-cache" } }),
            Options.Create(BuildAwsSettings("eu-west-1", "arn:aws:iam::123456789012:role/apollo-role", "apollo-session")));

        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => sut.GetCredentialsAsync((ArnRoleCodes)999));
    }

    private static AwsSettings BuildAwsSettings(string region, string roleArn, string roleSessionName)
    {
        return new AwsSettings
        {
            STS = new AwsSecurityTokenService
            {
                Client = new AwsSettingsStorageClient { Region = region },
                Apollo = new ApolloAwsSettings
                {
                    RoleArn = roleArn,
                    RoleSessionName = roleSessionName,
                    Service = "apollo",
                },
            },
        };
    }
}
