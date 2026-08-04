using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Services.Booking;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.Booking
{
    public class BookingTransactionsServiceTests
    {

        private Dictionary<string, AttributeValue> validresponse = new Dictionary<string, AttributeValue>()
        {
            { "Id", new AttributeValue() {
                S = "Id"
            } },
            { "State", new AttributeValue() {
                S = "State"
            } },
            { "Timestamp", new AttributeValue() {
                N = "1595586375265"
            }  },
            { "CorrelationId", new AttributeValue() {
                S = "CorrelationId"
            }  },
            { "BookingReference", new AttributeValue() {
                S = "BookingReference"
            } },
            { "Exception", new AttributeValue() {
                S = "Exception"
            }  },
            { "InnerErrors", new AttributeValue() {
                S = "[]"
            } },
        };

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
                            BookingTransactions = "BookingTransactions"
                        }
                    }
                });
        }

        private Mock<IAmazonDynamoDB> BuildUpdateRequests(IFixture fixture)
        {
            var dynamoClient = fixture.Freeze<Mock<IAmazonDynamoDB>>();
            dynamoClient
                .Setup(x => x.UpdateItemAsync(It.IsAny<UpdateItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new UpdateItemResponse());

            var awsClient = fixture.Freeze<Mock<AwsClient>>();
            awsClient
                .Setup(x => x.GetClient())
                .Returns(dynamoClient.Object);

            fixture.Inject(awsClient.Object);
            return dynamoClient;
        }

        [Fact]
        public async Task Get_Empty_Response()
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(fixture);

            var dynamoClient = fixture.Freeze<Mock<IAmazonDynamoDB>>();

            dynamoClient
                .Setup(x => x.GetItemAsync(It.IsAny<GetItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new GetItemResponse
                {
                    Item = new Dictionary<string, AttributeValue>()
                });

            var awsClient = fixture.Freeze<Mock<AwsClient>>();
            awsClient
                .Setup(x => x.GetClient())
                .Returns(dynamoClient.Object);

            fixture.Inject(awsClient.Object);

            var sut = fixture.Create<BookingTransactionsService>();

            var actual = await sut.Get("ID");

            actual.Should().BeNull();
        }

        [Fact]
        public async Task Get_Error_Response()
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(fixture);

            var dynamoClient = fixture.Freeze<Mock<IAmazonDynamoDB>>();

            dynamoClient
                .Setup(x => x.GetItemAsync(It.IsAny<GetItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .Throws(new Exception());

            var awsClient = fixture.Freeze<Mock<AwsClient>>();
            awsClient
                .Setup(x => x.GetClient())
                .Returns(dynamoClient.Object);

            fixture.Inject(awsClient.Object);

            var sut = fixture.Create<BookingTransactionsService>();

            var actual = await sut.Get("ID");

            actual.Should().BeNull();
        }

        [Fact]
        public async Task Get_Valid_Response()
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(fixture);

            var dynamoClient = fixture.Freeze<Mock<IAmazonDynamoDB>>();

            dynamoClient
                .Setup(x => x.GetItemAsync(It.IsAny<GetItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new GetItemResponse
                {
                    Item = validresponse,
                });

            var awsClient = fixture.Freeze<Mock<AwsClient>>();
            awsClient
                .Setup(x => x.GetClient())
                .Returns(dynamoClient.Object);

            fixture.Inject(awsClient.Object);

            var sut = fixture.Create<BookingTransactionsService>();

            var actual = await sut.Get("ID");

            actual.Should().BeEquivalentTo(new BookingTransaction()
            {
                BookingReference = "BookingReference",
                CorrelationId = "CorrelationId",
                Id = "Id",
                Exception = "Exception",
                InnerErrors = new ApiError[0],
                State = "State",
                Timestamp = 1595586375265,
            });
        }

        [Fact]
        public async Task Create_Success_Response()
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(fixture);

            var dynamoClient = fixture.Freeze<Mock<IAmazonDynamoDB>>();
            var awsClient = fixture.Freeze<Mock<AwsClient>>();
            awsClient
                .Setup(x => x.GetClient())
                .Returns(dynamoClient.Object);

            fixture.Inject(awsClient.Object);

            var sut = fixture.Create<BookingTransactionsService>();

            var actual = await sut.Create("ID");

            actual.State.Should().Be(BookingTransactionState.NEW.ToString());
            actual.Id.Should().Be("ID");
        }

        [Fact]
        public async Task Create_Error_Response()
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(fixture);

            var dynamoClient = fixture.Freeze<Mock<IAmazonDynamoDB>>();

            dynamoClient
                .Setup(x => x.PutItemAsync(It.IsAny<PutItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .ThrowsAsync(new Exception());

            var awsClient = fixture.Freeze<Mock<AwsClient>>();
            awsClient
                .Setup(x => x.GetClient())
                .Returns(dynamoClient.Object);

            fixture.Inject(awsClient.Object);

            var sut = fixture.Create<BookingTransactionsService>();
            Exception ex = null;
            try
            {
                await sut.Create("ID");
            }
            catch (Exception e)
            {
                ex = e;
            }

            ex.Should().NotBeNull();
        }

        [Fact]
        public async Task Start_Success_Response()
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(fixture);
            var db = BuildUpdateRequests(fixture);

            var sut = fixture.Create<BookingTransactionsService>();

            await sut.Start("ID");

            db.Verify(x => x.UpdateItemAsync(It.Is<UpdateItemRequest>(y => y.AttributeUpdates["State"].Value.S == BookingTransactionState.IN_PROGRESS.ToString()), It.IsAny<System.Threading.CancellationToken>()));
        }

        [Fact]
        public async Task Complete_Success_Response()
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(fixture);
            var db = BuildUpdateRequests(fixture);

            var sut = fixture.Create<BookingTransactionsService>();

            await sut.Complete("ID", "booking");

            db.Verify(x => x.UpdateItemAsync(It.Is<UpdateItemRequest>(y =>
                y.AttributeUpdates["State"].Value.S == BookingTransactionState.COMPLETED.ToString() &&
                y.AttributeUpdates["BookingReference"].Value.S == "booking"
            ), It.IsAny<System.Threading.CancellationToken>()));
        }

        [Fact]
        public async Task PaymentAuthRequired_Success_Response()
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(fixture);
            var db = BuildUpdateRequests(fixture);

            var sut = fixture.Create<BookingTransactionsService>();

            await sut.PaymentAuthRequired("ID");

            db.Verify(x => x.UpdateItemAsync(It.Is<UpdateItemRequest>(y =>
                y.AttributeUpdates["State"].Value.S == BookingTransactionState.PAYMENT_AUTH_REQUIRED.ToString()
            ), It.IsAny<System.Threading.CancellationToken>()));
        }

        [Fact]
        public async Task Fail_Success_Response()
        {
            IFixture fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(fixture);
            var db = BuildUpdateRequests(fixture);

            var sut = fixture.Create<BookingTransactionsService>();

            await sut.Fail("ID", new ApiException(new ExceptionCode(), new ApiError[0], "message"), "tId");

            db.Verify(x => x.UpdateItemAsync(It.Is<UpdateItemRequest>(y =>
                y.AttributeUpdates["State"].Value.S == BookingTransactionState.FAILED.ToString() &&
                y.AttributeUpdates["CorrelationId"].Value.S == "tId" &&
                y.AttributeUpdates["Exception"].Value.S == "message"
            ), It.IsAny<System.Threading.CancellationToken>()));
        }

    }
}
