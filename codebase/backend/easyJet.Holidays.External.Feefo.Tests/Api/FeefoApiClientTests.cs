using AutoFixture;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Models.Auth;
using easyJet.Holidays.External.Feefo.Api;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;
using Xunit;

namespace easyJet.Holidays.External.Feefo.Tests.Api
{
    public class FeefoApiClientTests
    {
        private readonly IFixture _fixture;

        private FeefoApiSettings _feefoApiSettings = new FeefoApiSettings()
        {
            MerchantIdentifier = "test-easyjet-holidays",
            ClientId = "KfWQXd04whDFSZFA5CS6qi7Glv7gNFLr",
            ClientSecret = "dg904SG21o7rY6gzqCIALgKClF84A6T3",
            EndPointAuthentication = "https://api.feefo.com/api/oauth/v2/token",
            EndPointEnterSaleRemotely = "https://api.feefo.com/api/20/entersaleremotely",
            EndPointReviewsService = "https://api.feefo.com/api/20/reviews/service",
            EndPointReviewsSummaryService = "https://api.feefo.com/api/20/reviews/summary/service"
        };

        private readonly string _uri = "https://localhost";
        private readonly string _queryString = "q=1";

        public FeefoApiClientTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
        }

        [Fact]
        public async Task MakeCall_HttpClientReturnStatusOk_CallAuthServiceMethodsOnce()
        {
            // Arrange            
            PrepareFixture(out var apiService, HttpStatusCode.OK, out var awsRepository);

            var sut = _fixture.Create<FeefoApiClient>();

            // Act
            var resultStream = await sut.MakeCall(HttpMethod.Get, new Uri(_uri), null, _queryString, null);

            // Assert
            apiService.Verify(x => x.GetResponseContentAsync<AuthRequest, AuthResponse>(It.IsAny<AuthRequest>()), Times.Once);
            awsRepository.Verify(x => x.GetItemAsync(It.IsAny<string>()), Times.Once);
            awsRepository.Verify(x => x.SaveAsync(It.IsAny<Token>()), Times.Once);
        }

        private const string AuthorizationHeaderName = "Authorization";
        [Fact]
        public async Task PrepareMessage_HeaderIsSet()
        {
            // Arrange            
            PrepareFixture(out var apiService, HttpStatusCode.OK, out var awsRepository);
            var sut = _fixture.Create<FeefoApiClient>();

            var message = new HttpRequestMessage();
            await sut.PrepareRequestMessage(message);

            message.Headers.GetValues(AuthorizationHeaderName).First().Should().Be($"Bearer {AccessTokenValue}");
        }

        [Fact]
        public async Task PrepareMessage_AuthorizationHeaderAlreadySet()
        {
            // Arrange            
            PrepareFixture(out var apiService, HttpStatusCode.OK, out var awsRepository);
            var sut = _fixture.Create<FeefoApiClient>();

            var message = new HttpRequestMessage();
            message.Headers.Add(AuthorizationHeaderName, "TestAuthorization");
            await sut.PrepareRequestMessage(message);

            message.Headers.GetValues(AuthorizationHeaderName).First().Should().Be($"Bearer {AccessTokenValue}");
        }

        private const string AccessTokenValue = "Fake_AccessToken";
        private IFixture PrepareFixture(out Mock<IApiService> apiService, HttpStatusCode statusCode, out Mock<IAWSDbRepository<Token>> awsRepository)
        {
            //_fixture.Register(HttpMessageHandlerStub.HttpClientCreator(HttpStatusCode.OK, null));
            _fixture.Register(HttpMessageHandlerStub.HttpClientCreator(statusCode, null));

            var feefoApiSettingsMock = _fixture.Freeze<Mock<IOptions<FeefoApiSettings>>>();
            feefoApiSettingsMock.Setup(x => x.Value).Returns(_feefoApiSettings);

            apiService = _fixture.Freeze<Mock<IApiService>>();
            apiService
                .Setup(x =>
                    x.GetResponseContentAsync<AuthRequest, AuthResponse>(
                        It.IsAny<AuthRequest>()))
                .ReturnsAsync(new AuthResponse
                {
                    Payload = new Domain.Models.Api.Payload.JsonApiPayload<AuthToken>
                    {
                        Body = new AuthToken
                        {
                            AccessToken = AccessTokenValue,
                            ExpiresIn = 3600,
                            Scope = "Fake_Scope",
                            TokenType = "Fake_TokenType"
                        }
                    }
                });

            awsRepository = _fixture.Freeze<Mock<IAWSDbRepository<Token>>>();
            return _fixture;
        }
    }
}
