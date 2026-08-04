using Amazon.DynamoDBv2;
using Amazon.S3;
using Amazon.SecurityToken;
using Amazon.SimpleNotificationService;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Logging.Interfaces;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

#nullable enable

namespace easyJet.Holidays.External.AWS.Tests;

public class AwsClientTests
{
    [Fact]
    public void Constructor_WithNullOptions_ThrowsArgumentNullException()
    {
        var ex = Assert.Throws<ArgumentNullException>(() => new AwsClient((IOptions<AwsSettings>)null!));
        Assert.Equal("awsSettings", ex.ParamName);
    }

    [Fact]
    public void GetSTSClient_UsesProvidedRegion()
    {
        var sut = new AwsClient(CreateOptions());

        using var client = sut.GetSTSClient("eu-west-1");

        var stsClient = Assert.IsType<AmazonSecurityTokenServiceClient>(client);
        Assert.Equal("eu-west-1", stsClient.Config.RegionEndpoint.SystemName);
    }

    [Fact]
    public void GetClient_WhenServiceUrlNotConfigured_UsesConfiguredRegion()
    {
        var sut = new AwsClient(CreateOptions());

        using var client = sut.GetClient();

        var dynamoDbClient = Assert.IsType<AmazonDynamoDBClient>(client);
        Assert.Equal("eu-west-1", dynamoDbClient.Config.RegionEndpoint.SystemName);
        Assert.Null(dynamoDbClient.Config.ServiceURL);
    }

    [Fact]
    public void GetClient_WhenServiceUrlConfigured_UsesConfiguredServiceUrl()
    {
        var sut = new AwsClient(CreateOptions(storageServiceUrl: "http://localhost:8000"));

        using var client = sut.GetClient();

        var dynamoDbClient = Assert.IsType<AmazonDynamoDBClient>(client);
        Assert.Equal("http://localhost:8000/", dynamoDbClient.Config.ServiceURL);
    }

    [Fact]
    public void GetDynamoDbClientWithLogging_ReturnsClient()
    {
        var logger = new Mock<IDynamoDbLogger>();
        var sut = new AwsClient(CreateOptions(), logger.Object);

        using var client = sut.GetDynamoDbClientWithLogging();

        Assert.IsType<AmazonDynamoDBClient>(client);
    }

    [Fact]
    public void GetS3Client_WhenServiceUrlProvided_SetsServiceUrlAndRegion()
    {
        var sut = new AwsClient(CreateOptions(s3ServiceUrl: "http://localhost:4572"));

        using AmazonS3Client client = sut.GetS3Client();

        Assert.Equal("http://localhost:4572/", client.Config.ServiceURL);
    }

    [Fact]
    public void GetSNSClient_SetsServiceUrlAndAuthenticationRegion()
    {
        var sut = new AwsClient(CreateOptions(snsServiceUrl: "http://localhost:4566"));

        using AmazonSimpleNotificationServiceClient client = sut.GetSNSClient();

        Assert.Equal("http://localhost:4566/", client.Config.ServiceURL);
        Assert.Equal("eu-west-1", client.Config.AuthenticationRegion);
    }

    [Fact]
    public void GetSESClient_WhenServiceUrlConfigured_SetsServiceUrlAndRegion()
    {
        var sut = new AwsClient(CreateOptions(sesServiceUrl: "http://localhost:4579"));

        using var client = sut.GetSESClient();

        Assert.Equal("http://localhost:4579/", client.Config.ServiceURL);
    }

    [Fact]
    public void GetImplicitClient_UsesRequestedRegion()
    {
        using IAmazonDynamoDB client = AwsClient.GetImplicitClient("eu-west-1");

        var dynamoDbClient = Assert.IsType<AmazonDynamoDBClient>(client);
        Assert.Equal("eu-west-1", dynamoDbClient.Config.RegionEndpoint.SystemName);
    }

    private static IOptions<AwsSettings> CreateOptions(
        string? storageServiceUrl = null,
        string? s3ServiceUrl = null,
        string? snsServiceUrl = "http://localhost:4566",
        string? sesServiceUrl = null)
    {
        return Options.Create(new AwsSettings
        {
            ServiceURL = storageServiceUrl,
            Storage = new AwsSettingsStorage
            {
                Client = new AwsSettingsStorageClient { Region = "eu-west-1" },
                Tables = new AwsSettingsStorageTables()
            },
            S3 = new AwsSettingsS3
            {
                Client = new AwsSettingsStorageClient
                {
                    Region = "eu-west-1",
                    ServiceUrl = s3ServiceUrl
                },
                Buckets = new AwsSettingsS3Buckets()
            },
            SNS = new AwsSettingsSNS
            {
                Client = new AwsSettingsStorageClient
                {
                    Region = "eu-west-1",
                    ServiceUrl = snsServiceUrl
                },
                Topics = new AwsSettingsSNSTopics()
            },
            SES = new AwsSettingsSES
            {
                Client = new AwsSettingsStorageClient
                {
                    Region = "eu-west-1",
                    ServiceUrl = sesServiceUrl
                }
            },
            STS = new AwsSecurityTokenService
            {
                Client = new AwsSettingsStorageClient { Region = "eu-west-1" },
                Apollo = new ApolloAwsSettings()
            }
        });
    }
}
