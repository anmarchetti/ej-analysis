#nullable enable

using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.SingleUseVoucher;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Services.SingleUseVoucher;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.SingleUseVoucher;

/// <summary>
/// Unit tests for single-use promo code lookup and assignment in DynamoDB.
/// </summary>
public class SingleUseVoucherServiceTests
{
    private const string TableName = "single-use-promo-codes";

    private static SingleUseVoucherService BuildSut(Mock<IDynamoDBContext> dynamoDbContext)
    {
        var awsSettings = Options.Create(new AwsSettings
        {
            Storage = new AwsSettingsStorage
            {
                Tables = new AwsSettingsStorageTables
                {
                    SingleUsePromoCodes = TableName
                }
            }
        });

        return new SingleUseVoucherService(dynamoDbContext.Object, awsSettings);
    }

    private static SingleUseVoucherService BuildSutWithDefaultTable(Mock<IDynamoDBContext> dynamoDbContext)
    {
        var awsSettings = Options.Create(new AwsSettings
        {
            Storage = new AwsSettingsStorage
            {
                Tables = new AwsSettingsStorageTables()
            }
        });

        return new SingleUseVoucherService(dynamoDbContext.Object, awsSettings);
    }

    [Fact]
    public async Task GetCustomerSingleUserPromoCode_ReturnsCodeAssignedToCustomerForCampaign()
    {
        var page = new List<SingleUseVoucherModel>
        {
            new() { Code = "PROMO-1", CampaignId = "campaign-1", CustomerMappedId = "customer-1" }
        };
        var asyncSearch = new TestAsyncSearch<SingleUseVoucherModel>([page]);
        var dynamoDbContext = new Mock<IDynamoDBContext>();
        QueryConfig? capturedQueryConfig = null;
        object? capturedHashKey = null;

        dynamoDbContext
            .Setup(context => context.QueryAsync<SingleUseVoucherModel>(
                It.IsAny<object>(),
                It.IsAny<QueryConfig>()))
            .Callback<object, QueryConfig>((hashKey, queryConfig) =>
            {
                capturedHashKey = hashKey;
                capturedQueryConfig = queryConfig;
            })
            .Returns(asyncSearch);

        var sut = BuildSut(dynamoDbContext);

        var result = await sut.GetCustomerSingleUserPromoCode("customer-1", "campaign-1");

        result.Should().Be("PROMO-1");
        capturedHashKey.Should().Be("campaign-1");
        capturedQueryConfig.Should().NotBeNull();
        capturedQueryConfig?.OverrideTableName.Should().Be(TableName);
        capturedQueryConfig?.QueryFilter.Should().ContainSingle();
        capturedQueryConfig?.QueryFilter[0].PropertyName.Should().Be(nameof(SingleUseVoucherModel.CustomerMappedId));
        capturedQueryConfig?.QueryFilter[0].Operator.Should().Be(ScanOperator.Equal);
        capturedQueryConfig?.QueryFilter[0].Values.Should().ContainSingle().Which.Should().Be("customer-1");
    }

    [Fact]
    public async Task GetCustomerSingleUserPromoCode_ReturnsEmpty_WhenCustomerHasNoCodeForCampaign()
    {
        var dynamoDbContext = new Mock<IDynamoDBContext>();
        dynamoDbContext
            .Setup(context => context.QueryAsync<SingleUseVoucherModel>(
                It.IsAny<object>(),
                It.IsAny<QueryConfig>()))
            .Returns(new TestAsyncSearch<SingleUseVoucherModel>([new List<SingleUseVoucherModel>()]));

        var sut = BuildSut(dynamoDbContext);

        var result = await sut.GetCustomerSingleUserPromoCode("customer-1", "campaign-1");

        result.Should().BeEmpty();
    }

    [Theory]
    [InlineData("", "campaign-1")]
    [InlineData("customer-1", "")]
    public async Task GetCustomerSingleUserPromoCode_ReturnsEmptyWhenRequiredValuesAreMissing(
        string customerMappedId,
        string campaignId)
    {
        var dynamoDbContext = new Mock<IDynamoDBContext>();
        var sut = BuildSut(dynamoDbContext);

        var result = await sut.GetCustomerSingleUserPromoCode(customerMappedId, campaignId);

        result.Should().BeEmpty();
        dynamoDbContext.Verify(context => context.QueryAsync<SingleUseVoucherModel>(
            It.IsAny<object>(),
            It.IsAny<QueryConfig>()), Times.Never);
    }

    [Fact]
    public async Task GetCustomerSingleUserPromoCode_UsesDefaultTable_WhenSingleUsePromoCodesTableIsNotConfigured()
    {
        var page = new List<SingleUseVoucherModel>
        {
            new() { Code = "PROMO-1", CampaignId = "campaign-1", CustomerMappedId = "customer-1" }
        };
        var asyncSearch = new TestAsyncSearch<SingleUseVoucherModel>([page]);
        var dynamoDbContext = new Mock<IDynamoDBContext>();
        QueryConfig? capturedOperationConfig = null;

        dynamoDbContext
            .Setup(context => context.QueryAsync<SingleUseVoucherModel>(
                It.IsAny<object>(),
                It.IsAny<QueryConfig>()))
            .Callback<object, QueryConfig>((_, operationConfig) => capturedOperationConfig = operationConfig)
            .Returns(asyncSearch);

        var sut = BuildSutWithDefaultTable(dynamoDbContext);

        var result = await sut.GetCustomerSingleUserPromoCode("customer-1", "campaign-1");

        result.Should().Be("PROMO-1");
        capturedOperationConfig.Should().NotBeNull();
        capturedOperationConfig?.OverrideTableName.Should().Be("single-use-promocodes-local");
    }

    [Fact]
    public async Task AssignSingleUsePromoCodeToCustomer_ReturnsExistingCode_WhenCustomerAlreadyHasOne()
    {
        var assignedCodes = new List<SingleUseVoucherModel>
        {
            new() { Code = "PROMO-1", CampaignId = "campaign-1", CustomerMappedId = "customer-1" }
        };
        var dynamoDbContext = new Mock<IDynamoDBContext>();
        dynamoDbContext
            .Setup(context => context.QueryAsync<SingleUseVoucherModel>(
                It.IsAny<object>(),
                It.IsAny<QueryConfig>()))
            .Returns(new TestAsyncSearch<SingleUseVoucherModel>([assignedCodes]));

        var sut = BuildSut(dynamoDbContext);

        var result = await sut.AssignSingleUsePromoCodeToCustomer("customer-1", "campaign-1");

        result.Should().Be("PROMO-1");
        dynamoDbContext.Verify(context => context.SaveAsync(
            It.IsAny<SingleUseVoucherModel>(),
            It.IsAny<SaveConfig>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task AssignSingleUsePromoCodeToCustomer_AssignsFirstAvailableCode_WhenCustomerDoesNotHaveOne()
    {
        var availableCodes = new List<SingleUseVoucherModel>
        {
            new() { Code = "PROMO-1", CampaignId = "campaign-1", CustomerMappedId = "customer-2" },
            new() { Code = "PROMO-2", CampaignId = "campaign-1", CustomerMappedId = null }
        };
        var assignedCodeSearch = new TestAsyncSearch<SingleUseVoucherModel>([new List<SingleUseVoucherModel>()]);
        var availableCodesSearch = new TestAsyncSearch<SingleUseVoucherModel>([availableCodes]);
        var dynamoDbContext = new Mock<IDynamoDBContext>();
        dynamoDbContext
            .SetupSequence(context => context.QueryAsync<SingleUseVoucherModel>(
                It.IsAny<object>(),
                It.IsAny<QueryConfig>()))
            .Returns(assignedCodeSearch)
            .Returns(availableCodesSearch);

        var sut = BuildSut(dynamoDbContext);

        var result = await sut.AssignSingleUsePromoCodeToCustomer("customer-1", "campaign-1");

        result.Should().Be("PROMO-2");
        availableCodes[1].CustomerMappedId.Should().Be("customer-1");
        dynamoDbContext.Verify(context => context.SaveAsync(
            It.Is<SingleUseVoucherModel>(code =>
                code.Code == "PROMO-2" &&
                code.CampaignId == "campaign-1" &&
                code.CustomerMappedId == "customer-1"),
            It.IsAny<SaveConfig>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AssignSingleUsePromoCodeToCustomer_ReturnsEmpty_WhenNoCodesAreAvailable()
    {
        var unavailableCodes = new List<SingleUseVoucherModel>
        {
            new() { Code = "PROMO-1", CampaignId = "campaign-1", CustomerMappedId = "customer-2" }
        };
        var assignedCodeSearch = new TestAsyncSearch<SingleUseVoucherModel>([new List<SingleUseVoucherModel>()]);
        var unavailableCodesSearch = new TestAsyncSearch<SingleUseVoucherModel>([unavailableCodes]);
        var dynamoDbContext = new Mock<IDynamoDBContext>();
        dynamoDbContext
            .SetupSequence(context => context.QueryAsync<SingleUseVoucherModel>(
                It.IsAny<object>(),
                It.IsAny<QueryConfig>()))
            .Returns(assignedCodeSearch)
            .Returns(unavailableCodesSearch);

        var sut = BuildSut(dynamoDbContext);

        var result = await sut.AssignSingleUsePromoCodeToCustomer("customer-1", "campaign-1");

        result.Should().BeEmpty();
        dynamoDbContext.Verify(context => context.SaveAsync(
            It.IsAny<SingleUseVoucherModel>(),
            It.IsAny<SaveConfig>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData("", "campaign-1")]
    [InlineData("customer-1", "")]
    public async Task AssignSingleUsePromoCodeToCustomer_ReturnsEmpty_WhenRequiredValuesAreMissing(
        string customerMappedId,
        string campaignId)
    {
        var dynamoDbContext = new Mock<IDynamoDBContext>();
        var sut = BuildSut(dynamoDbContext);

        var result = await sut.AssignSingleUsePromoCodeToCustomer(customerMappedId, campaignId);

        result.Should().BeEmpty();
        dynamoDbContext.Verify(context => context.QueryAsync<SingleUseVoucherModel>(
            It.IsAny<object>(),
            It.IsAny<QueryConfig>()), Times.Never);
        dynamoDbContext.Verify(context => context.SaveAsync(
            It.IsAny<SingleUseVoucherModel>(),
            It.IsAny<SaveConfig>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    private class TestAsyncSearch<T> : AsyncSearch<T>
    {
        private readonly Queue<List<T>> _pages;

        public TestAsyncSearch(IEnumerable<List<T>> pages)
        {
            _pages = new Queue<List<T>>(pages);
        }

        public override bool IsDone => _pages.Count == 0;

        public override Task<List<T>> GetNextSetAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult(_pages.Dequeue());
        }

        public override Task<List<T>> GetRemainingAsync(CancellationToken cancellationToken = default)
        {
            var results = new List<T>();
            while (!IsDone)
            {
                results.AddRange(_pages.Dequeue());
            }

            return Task.FromResult(results);
        }
    }
}

