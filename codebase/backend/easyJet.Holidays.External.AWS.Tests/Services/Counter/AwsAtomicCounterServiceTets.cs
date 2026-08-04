using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using AutoFixture;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Services.Counter;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.Counter
{
    public class AwsAtomicCounterServiceTets
    {
        private void BuildAwsSetttings(IFixture fixture)
        {
            var awsSettings = fixture.Freeze<Mock<IOptions<AwsSettings>>>();
            awsSettings
                .SetupGet(x => x.Value)
                .Returns(new AwsSettings
                {
                    Storage = new AwsSettingsStorage
                    {
                        Tables = new AwsSettingsStorageTables()
                        {
                        }
                    }
                });
        }

        [Fact]
        public async Task GetNextId_Valid()
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(fixture);

            var dynamoClient = fixture.Freeze<Mock<IAmazonDynamoDB>>();

            dynamoClient
                .Setup(x => x.UpdateItemAsync(It.IsAny<UpdateItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new UpdateItemResponse
                {
                    Attributes = new Dictionary<string, AttributeValue>()
                    {
                        { "Value", new AttributeValue()
                        {
                            N = "101"
                        } }
                    }
                });

            var awsClient = fixture.Freeze<Mock<AwsClient>>();
            awsClient
                .Setup(x => x.GetClient())
                .Returns(dynamoClient.Object);

            fixture.Inject(awsClient.Object);

            var sut = fixture.Create<AwsAtomicCounterService>();

            var actual = await sut.GetNextId("test");

            actual.Should().Be(101);
        }

        [Fact]
        public async Task GetNextId_Invalid()
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(fixture);

            var dynamoClient = fixture.Freeze<Mock<IAmazonDynamoDB>>();

            dynamoClient
                .Setup(x => x.UpdateItemAsync(It.IsAny<UpdateItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new UpdateItemResponse
                {
                    Attributes = new Dictionary<string, AttributeValue>()
                    {
                        { "Value", new AttributeValue()
                        {
                            N = "asdf"
                        } }
                    }
                });

            var awsClient = fixture.Freeze<Mock<AwsClient>>();
            awsClient
                .Setup(x => x.GetClient())
                .Returns(dynamoClient.Object);

            fixture.Inject(awsClient.Object);

            var sut = fixture.Create<AwsAtomicCounterService>();

            var actual = await sut.GetNextId("test");

            actual.Should().Be(0);
        }
    }
}
