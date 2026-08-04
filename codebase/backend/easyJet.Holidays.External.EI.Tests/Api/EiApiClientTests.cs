using AutoFixture;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.EI.Api;
using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.Extensions;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;
using Xunit;

namespace easyJet.Holidays.External.Ei.Tests.Api
{
    public class EiApiClientTests
    {
        [Theory]
        [InlineData("https://localhost", null, "https://localhost/")]
        [InlineData("https://localhost", "q=1&k=2", "https://localhost/?q=1&k=2")]
        [InlineData("https://localhost", "q=1", "https://localhost/?q=1")]
        public async Task MakeCall_WithQueryString_AppendedToUri(string uri, string queryString, string expected)
        {
            // Arrange
            IFixture fixture = FixtureUtils.AutoMoqFixture();
            fixture.Register(HttpMessageHandlerStub.HttpClientCreator(HttpStatusCode.OK, null));
            
            BuildPaymentsSettings(fixture);

            EiApiClient sut = fixture.Freeze<EiApiClient>();
            
            // Act
            Stream resultStream = await sut.MakeCall(HttpMethod.Get, new Uri(uri), null, queryString, null);
            string result = await resultStream.ReadAsync();

            // Assert
            result.Should().Be($"uri: {expected}, content: , method: GET");
        }

        [Theory]
        [InlineData(true)]
        [InlineData(false)]
        public async Task MakeCall_HttpMethod_ShouldBeUsed(bool isGet)
        {
            // Arrange
            IFixture fixture = FixtureUtils.AutoMoqFixture();
            fixture.Register(HttpMessageHandlerStub.HttpClientCreator(HttpStatusCode.OK, null));

            BuildPaymentsSettings(fixture);

            EiApiClient sut = fixture.Freeze<EiApiClient>();
            HttpMethod httpMethod = isGet ? HttpMethod.Get : HttpMethod.Post;

            // Act
            Stream resultStream = await sut.MakeCall(httpMethod, new Uri("http://test"), null, null, null);
            string result = await resultStream.ReadAsync();

            // Assert
            result.Should().Be($"uri: http://test/, content: , method: {httpMethod}");
        }

        [Theory]
        [InlineData(null)]
        [InlineData("payload data")]
        public async Task MakeCall_Payload_ShouldBeSend(string payload)
        {
            // Arrange
            IFixture fixture = FixtureUtils.AutoMoqFixture();
            fixture.Register(HttpMessageHandlerStub.HttpClientCreator(HttpStatusCode.OK, payload));
            
            BuildPaymentsSettings(fixture);

            EiApiClient sut = fixture.Freeze<EiApiClient>();

            // Act
            Stream resultStream = await sut.MakeCall(HttpMethod.Post, new Uri("http://test"), payload, null, null);
            string result = await resultStream.ReadAsync();

            // Assert
            result.Should().Be($"uri: http://test/, content: {payload}, method: POST");
        }

        [Fact]
        public async Task MakeCall_ErrorHttpCode_ThrowException()
        {
            // Arrange
            IFixture fixture = FixtureUtils.AutoMoqFixture();
            fixture.Register(HttpMessageHandlerStub.HttpClientCreator(HttpStatusCode.InternalServerError, null));

            BuildPaymentsSettings(fixture);
            
            EiApiClient client = fixture.Freeze<EiApiClient>();
            Func<Task> sut = async () => await client.MakeCall(HttpMethod.Post, new Uri("http://test"), "", null, null);

            // Act
            // Assert
            await sut.Should().ThrowExactlyAsync<HttpRequestException>();
        }
        
        private static void BuildPaymentsSettings(IFixture fixture)
        {
            Mock<IOptions<PaymentsSettings>> paymentsSettings = fixture.Freeze<Mock<IOptions<PaymentsSettings>>>();
            paymentsSettings
                .SetupGet(x => x.Value)
                .Returns(new PaymentsSettings
                {
                    RefundPayment = new UrlSettings()
                    {
                        Path = "Test"
                    },
                    XPosIdRefund = "1",
                    XInspection = "Test"
                });
        }
    }
}
