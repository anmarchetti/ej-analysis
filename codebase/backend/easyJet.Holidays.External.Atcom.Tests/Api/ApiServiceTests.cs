using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Moq;
using System.Text;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Api
{
    class TestApiResponse : JsonApiResponse<string>
    {
        public override ApiError[] ApiErrors => null;
    }

    class TestApiRequestWithTimeout : JsonApiRequest<string>
    {
        public override TimeSpan? Timeout => TimeSpan.FromMilliseconds(333);
    }

    class TestApiRequestWithoutTimeout : JsonApiRequest<string>
    {
    }

    public class ApiServiceTests
    {
        [Fact]
        public void DefaultTimeoutSeconds_MinusOne()
        {
            // Arrange
            var _fixture = FixtureUtils.AutoMoqFixture();
            var sut = _fixture.Freeze<ApiService>();

            // Act
            var actual = sut.DefaultTimeoutMilliSeconds();

            // Assert
            actual.Should().Be(-1);
        }

        [Fact]
        public async Task MakeApiCall_RequestHasTimout_ClientShouldUseRequestTimeout()
        {
            // Arrange
            var _fixture = FixtureUtils.AutoMoqFixture();
            var apiClient = _fixture.Freeze<Mock<IApiClient>>();
            apiClient
                .Setup(x => x.MakeCall(It.IsAny<HttpMethod>(), It.IsAny<Uri>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan>()))
                .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes("\"response\"")));

            var sut = _fixture.Freeze<ApiService>();

            // Act
            var request = new TestApiRequestWithTimeout();
            var actual = await sut.GetResponseContentAsync<TestApiRequestWithTimeout, TestApiResponse>(request);

            // Assert
            apiClient.Verify(x => x.MakeCall(It.IsAny<HttpMethod>(), It.IsAny<Uri>(), It.IsAny<string>(), It.IsAny<string>(), TimeSpan.FromMilliseconds(333)), Times.Once);
        }

        [Fact]
        public async Task MakeApiCall_NoTimeoutInRequest_DefaultTimeoutMoreThanZero_ClientShouldUseDefaultTimeout()
        {
            // Arrange
            var _fixture = FixtureUtils.AutoMoqFixture();
            var apiClient = _fixture.Freeze<Mock<IApiClient>>();
            apiClient
                .Setup(x => x.MakeCall(It.IsAny<HttpMethod>(), It.IsAny<Uri>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan?>()))
                .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes("\"response\"")));

            var sut = _fixture.Freeze<Mock<ApiService>>();
            sut.Setup(x => x.DefaultTimeoutMilliSeconds()).Returns(222);

            // Act
            var request = new TestApiRequestWithoutTimeout();
            var actual = await sut.Object.GetResponseContentAsync<TestApiRequestWithoutTimeout, TestApiResponse>(request);

            // Assert
            apiClient.Verify(x => x.MakeCall(It.IsAny<HttpMethod>(), It.IsAny<Uri>(), It.IsAny<string>(), It.IsAny<string>(), TimeSpan.FromMilliseconds(222)), Times.Once);
        }

        [Fact]
        public async Task MakeApiCall_NoTimeoutInRequest_DefaultTimeoutLezzThanZero_ClientShouldNotUseTimeout()
        {
            // Arrange
            var _fixture = FixtureUtils.AutoMoqFixture();
            var apiClient = _fixture.Freeze<Mock<IApiClient>>();
            apiClient
                .Setup(x => x.MakeCall(It.IsAny<HttpMethod>(), It.IsAny<Uri>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan?>()))
                .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes("\"response\"")));

            var sut = _fixture.Freeze<ApiService>();

            // Act
            var request = new TestApiRequestWithoutTimeout();
            var actual = await sut.GetResponseContentAsync<TestApiRequestWithoutTimeout, TestApiResponse>(request);

            // Assert
            apiClient.Verify(x => x.MakeCall(It.IsAny<HttpMethod>(), It.IsAny<Uri>(), It.IsAny<string>(), It.IsAny<string>(), null), Times.Once);
        }
    }
}
