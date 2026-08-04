using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.External.Atcom.Api;
using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.Extensions;
using FluentAssertions;
using System.Net;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Api
{
    public class AtcomApiClientTests
    {
        [Theory]
        [InlineData("https://localhost", null, "https://localhost/")]
        [InlineData("https://localhost", "q=1&k=2", "https://localhost/?q=1&k=2")]
        [InlineData("https://localhost", "q=1", "https://localhost/?q=1")]
        public async Task MakeCall_WithQueryString_AppendedToUri(string uri, string queryString, string expected)
        {
            // Arrange
            var _fixture = FixtureUtils.AutoMoqFixture();
            _fixture.Register(HttpMessageHandlerStub.HttpClientCreator(HttpStatusCode.OK, null));

            var sut = _fixture.Freeze<AtcomApiClient>();

            // Act
            var resultStream = await sut.MakeCall(HttpMethod.Get, new Uri(uri), null, queryString, null);
            var result = await resultStream.ReadAsync();

            // Assert
            result.Should().Be($"uri: {expected}, content: , method: GET");
        }

        [Theory]
        [InlineData(true)]
        [InlineData(false)]
        public async Task MakeCall_HttpMethod_ShouldBeUsed(bool isGet)
        {
            // Arrange
            var _fixture = FixtureUtils.AutoMoqFixture();
            _fixture.Register(HttpMessageHandlerStub.HttpClientCreator(HttpStatusCode.OK, null));

            var sut = _fixture.Freeze<AtcomApiClient>();
            var httpMethod = isGet ? HttpMethod.Get : HttpMethod.Post;

            // Act
            var resultStream = await sut.MakeCall(httpMethod, new Uri("http://test"), null, null, null);
            var result = await resultStream.ReadAsync();

            // Assert
            result.Should().Be($"uri: http://test/, content: , method: {httpMethod}");
        }

        [Theory]
        [InlineData(null)]
        [InlineData("payload data")]
        public async Task MakeCall_Payload_ShouldBeSend(string payload)
        {
            // Arrange
            var _fixture = FixtureUtils.AutoMoqFixture();
            _fixture.Register(HttpMessageHandlerStub.HttpClientCreator(HttpStatusCode.OK, payload));

            var sut = _fixture.Freeze<AtcomApiClient>();

            // Act
            var resultStream = await sut.MakeCall(HttpMethod.Post, new Uri("http://test"), payload, null, null);
            var result = await resultStream.ReadAsync();

            // Assert
            result.Should().Be($"uri: http://test/, content: {payload}, method: POST");
        }

        [Fact]
        public async Task MakeCall_ErrorHttpCode_ThrowException()
        {
            // Arrange
            var _fixture = FixtureUtils.AutoMoqFixture();
            _fixture.Register(HttpMessageHandlerStub.HttpClientCreator(HttpStatusCode.InternalServerError, null));

            var client = _fixture.Freeze<AtcomApiClient>();
            Func<Task> sut = async () => await client.MakeCall(HttpMethod.Post, new Uri("http://test"), "", null, null);

            // Act
            // Assert
            await sut.Should().ThrowExactlyAsync<ApiClientErrorResponseException>();
        }
    }
}
