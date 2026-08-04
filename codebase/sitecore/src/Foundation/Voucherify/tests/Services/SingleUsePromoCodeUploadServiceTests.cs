using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using easyJet.Foundation.DynamoDb.Factory;
using easyJet.Foundation.DynamoDb.Models;
using easyJet.Foundation.Voucherify.Services;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.Services
{
    public class SingleUsePromoCodeUploadServiceTests
    {
        private const string TableName = "SingleUsePromocodes";

        private readonly IDynamoDBContext context;
        private readonly IBatchWrite<SingleUsePromocodeModel> batchWrite;
        private readonly SingleUsePromoCodeUploadService sut;

        public SingleUsePromoCodeUploadServiceTests()
        {
            context = Substitute.For<IDynamoDBContext>();
            batchWrite = Substitute.For<IBatchWrite<SingleUsePromocodeModel>>();

            var factory = Substitute.For<IAwsDynamoDbContextFactory<SingleUsePromocodeModel>>();
            factory.Create().Returns((context, TableName));
            context.CreateBatchWrite<SingleUsePromocodeModel>(Arg.Any<BatchWriteConfig>()).Returns(batchWrite);

            sut = new SingleUsePromoCodeUploadService(factory);
        }

        [Fact]
        public async Task UploadSingleUsePromoCodes_ShouldSubmitCodesWithCampaignId()
        {
            var campaignId = "CampaignName";
            var codes = new[] { "Code1", "Code2" };
            IEnumerable<SingleUsePromocodeModel> submittedModels = null;

            batchWrite
                .When(x => x.AddPutItems(Arg.Any<IEnumerable<SingleUsePromocodeModel>>()))
                .Do(callInfo => submittedModels = callInfo.Arg<IEnumerable<SingleUsePromocodeModel>>());

            sut.UploadSingleUsePromoCodes(codes, campaignId);

            submittedModels.Should().BeEquivalentTo(
                new[]
                {
                    new SingleUsePromocodeModel { CampaignId = campaignId, Code = "Code1" },
                    new SingleUsePromocodeModel { CampaignId = campaignId, Code = "Code2" }
                },
                options => options.WithStrictOrdering());

            context.Received(1).CreateBatchWrite<SingleUsePromocodeModel>(
                Arg.Is<BatchWriteConfig>(config => config.OverrideTableName == TableName));
            await batchWrite.Received(1).ExecuteAsync(Arg.Any<CancellationToken>());
        }

        [Fact]
        public void UploadSingleUsePromoCodes_ShouldSubmitCodesAsProvided()
        {
            var codes = new[] { null, string.Empty, "Code1" };
            IEnumerable<SingleUsePromocodeModel> submittedModels = null;

            batchWrite
                .When(x => x.AddPutItems(Arg.Any<IEnumerable<SingleUsePromocodeModel>>()))
                .Do(callInfo => submittedModels = callInfo.Arg<IEnumerable<SingleUsePromocodeModel>>());

            sut.UploadSingleUsePromoCodes(codes, null);

            submittedModels.Should().BeEquivalentTo(
                new[]
                {
                    new SingleUsePromocodeModel { CampaignId = null, Code = null },
                    new SingleUsePromocodeModel { CampaignId = null, Code = string.Empty },
                    new SingleUsePromocodeModel { CampaignId = null, Code = "Code1" }
                },
                options => options.WithStrictOrdering());
        }

        [Fact]
        public void UploadSingleUsePromoCodes_ShouldNotSubmit_WhenCodesAreEmpty()
        {
            sut.UploadSingleUsePromoCodes(Enumerable.Empty<string>(), "CampaignName");

            context.DidNotReceiveWithAnyArgs().CreateBatchWrite<SingleUsePromocodeModel>(Arg.Any<BatchWriteConfig>());
        }

        [Fact]
        public void UploadSingleUsePromoCodes_ShouldThrow_WhenCodesAreNull()
        {
            Action act = () => sut.UploadSingleUsePromoCodes(null, "CampaignName");

            act.Should().Throw<ArgumentNullException>();
            context.DidNotReceiveWithAnyArgs().CreateBatchWrite<SingleUsePromocodeModel>(Arg.Any<BatchWriteConfig>());
        }
    }
}
