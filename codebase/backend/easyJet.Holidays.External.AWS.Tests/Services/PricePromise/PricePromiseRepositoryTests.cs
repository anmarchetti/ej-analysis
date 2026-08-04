using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Amazon.Runtime;
using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.PrisePromise;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Services.PrisePromise;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.PricePromise
{
    public class PricePromiseRepositoryTests
    {

        private readonly IFixture _fixture;

        private readonly PricePromiseRepository _sut;

        private readonly Mock<AwsClient> _awsClientMock;


        public PricePromiseRepositoryTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();

            _awsClientMock = new Mock<AwsClient>();

            _fixture.Inject(Options.Create(new AwsSettings()
            {
                Storage = new AwsSettingsStorage()
                {
                    Tables = new AwsSettingsStorageTables()
                    {
                        PricePromise = "testTableName",
                    }
                }
            }));

            _sut = new PricePromiseRepository(
                _awsClientMock.Object,
                _fixture.Create<IOptions<AwsSettings>>(),
                _fixture.Create<ILogger<PricePromiseRepository>>()
            );
        }

        [Fact]
        public async Task RemoveInvalidChars_RemovesNoValid()
        {
            // Arrange
            var testFileName = "thisIsAValidFileName";

            // Act
            var result = _sut.RemoveInvalidChars(testFileName);

            // Assert
            result.Length.Should().Be(testFileName.Length, "because there were no invalid chars to remove.");
        }

        [Fact]
        public async Task RemoveInvalidChars_RemovesInvalid()
        {
            // Arrange
            var testFileName = "\bThis|s<Not>AVali\"dFi\\eName\0\t";

            // Act
            var result = _sut.RemoveInvalidChars(testFileName);

            // Assert
            result.Length.Should().BeLessThan(testFileName.Length, "because invalid chars should have been removed.");
        }

        [Fact]
        public async Task Create_AWSClientCreationFails_ThrowsWrappedException()
        {
            // Arrange
            _awsClientMock.Setup(mock => mock.GetS3Client()).Throws(new Exception("no client!"));

            // Act
            Func<Task<IEnumerable<PriceAttachment>>> action = async () => await _sut.Create(null);

            // Assert
            var exc = await Assert.ThrowsAsync<ApiException>(action);
            exc.Should().NotBeNull();
            exc.Code.Should().Be(ApiExceptionCodes.PricePromiseCantCreate);
            var inner = exc.InnerException;
            inner.Should().NotBeNull();
        }

        [Fact]
        public async Task Create_NoAttachmentsInModel_NoAttachmentsReturned()
        {
            // Arrange
            var dummy = new ClientDummy(null, new AmazonDynamoDBConfig() { ServiceURL = "test.test:1234" });
            // as the actual operations are not performed by the mock itself but an object created by it, 
            // consider this a workaround to be able to Verify the aforementioned object did behave as expected.
            _awsClientMock.Setup(mock => mock.GetClient()).Returns(dummy);

            var model = new PricePromiseModel()
            {
                Screenshots = new List<IFormFile>(),
            };

            // Act
            var result = await _sut.Create(model);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty("because no attachments were provided in the passed model instance");
            dummy.DidPutItem.Should().BeTrue("because the request should be written to dynamo db");
        }

        /// <summary>
        /// as a return for <see cref="AwsClient.GetClient()"/>, which doesn't attempt to actually execute e.g. <see cref="IAmazonDynamoDB.PutItemAsync(PutItemRequest, CancellationToken)"/>
        /// </summary>
        private class ClientDummy : AmazonDynamoDBClient
        {
            private bool _didPutItem = false;
            private PutItemRequest _request;
            public bool DidPutItem => _didPutItem;
            public PutItemRequest Request => _request;

            public ClientDummy(AWSCredentials credentials, AmazonDynamoDBConfig clientConfig) : base(credentials, clientConfig) { }

            public override Task<PutItemResponse> PutItemAsync(PutItemRequest request, CancellationToken cancellationToken = default)
            {
                _didPutItem = true;
                _request = request;

                return Task.FromResult(new PutItemResponse() { HttpStatusCode = System.Net.HttpStatusCode.OK });
            }
        }
    }
}
