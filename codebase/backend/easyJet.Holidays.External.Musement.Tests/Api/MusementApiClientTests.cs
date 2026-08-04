using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Models.Auth;
using easyJet.Holidays.External.Domain.Services;
using easyJet.Holidays.External.Musement.Api;
using easyJet.Holidays.External.Musement.Services;
using easyJet.Holidays.Tests.Domain;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;
using Xunit;

namespace easyJet.Holidays.External.Musement.Tests.Api
{
    public class MusementApiClientTests
    {
        private readonly IFixture _fixture;

        private MusementSettings _musementSettings = new()
        {
            Api = new MusementApi
            {
                Host = "https://musement.com",
                Activities = "api/activities",
                Login = "api/login",
                Cities = "api/cities"
            },
            WhiteLabel = new WhiteLabel
            {
                Host = "https://whitelabel.com",
                Search = "uk/search",
                City = "uk/city",
            },
            Headers = new Dictionary<string, string>()
            {
                {"Fake_VersionName", "Fake_VersionValue"},
                {"Fake_MarketName", "Fake_MarketValue"},
            },
            CurrencyHeader = "Fake_CurrencyName",
            Credentials = new MusementCredentials()
            {
                ClientId = "Fake_ClientId",
                ClientSecret = "Fake_ClientSecret",
                GrantType = "Fake_ClientSecret",
                ExpirationTimeMargin = 5,
            },
            Take = 5
        };

        private readonly string _uri = "https://localhost";
        private readonly string _queryString = "q=1";

        public MusementApiClientTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
        }

        [Fact]
        public async Task MakeCall_HttpClientReturnStatusOk_CallAuthServiceMethodsOnce()
        {
            // Arrange            
            PrepareFixture(out var apiService, HttpStatusCode.OK, out var awsRepository);

            var sut = _fixture.Create<MusementApiClient>();

            // Act
            var resultStream = await sut.MakeCall(HttpMethod.Get, new Uri(_uri), null, _queryString, null);

            // Assert
            apiService.Verify(x => x.GetResponseContentAsync<AuthRequest, AuthResponse>(It.IsAny<AuthRequest>()), Times.Once);
            awsRepository.Verify(x => x.GetItemAsync(It.IsAny<string>()), Times.Once);
            awsRepository.Verify(x => x.SaveAsync(It.IsAny<Token>()), Times.Once);
        }

        [Fact]
        public async Task MakeCall_HttpClientReturnStatusUnauthorized_CallAuthServiceMethodsTwice()
        {
            // Arrange            
            PrepareFixture(out var apiService, HttpStatusCode.Unauthorized, out var awsRepository);

            var sut = _fixture.Create<MusementApiClient>();

            // Act
            var result = await Assert.ThrowsAsync<ApiClientErrorResponseException>(() => sut.MakeCall(HttpMethod.Get, new Uri(_uri), null, _queryString, null));

            // Assert
            apiService.Verify(x => x.GetResponseContentAsync<AuthRequest, AuthResponse>(It.IsAny<AuthRequest>()), Times.Exactly(2));
            awsRepository.Verify(x => x.GetItemAsync(It.IsAny<string>()), Times.Exactly(1));    // because forceUpdate == true
            awsRepository.Verify(x => x.SaveAsync(It.IsAny<Token>()), Times.Exactly(2));
        }

        private IFixture PrepareFixture(out Mock<IApiService> apiService, HttpStatusCode statusCode, out Mock<IAWSDbRepository<Token>> awsRepository)
        {
            //_fixture.Register(HttpMessageHandlerStub.HttpClientCreator(HttpStatusCode.OK, null));
            _fixture.Register(HttpMessageHandlerStub.HttpClientCreator(statusCode, null));

            var musementSettingsMock = _fixture.Freeze<Mock<IOptions<MusementSettings>>>();
            musementSettingsMock.Setup(x => x.Value).Returns(_musementSettings);
            var endpointsProvider = new EndpointsProvider(musementSettingsMock.Object, Options.Create(new EnvironmentBehaviourSettings()), null, new Mock<ILogger<BaseEndpointsProvider>>().Object);
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
                            AccessToken = "Fake_AccessToken",
                            ExpiresIn = 3600,
                            Scope = "Fake_Scope",
                            TokenType = "Fake_TokenType"
                        }
                    }
                });

            _fixture.Register(() => endpointsProvider);

            awsRepository = _fixture.Freeze<Mock<IAWSDbRepository<Token>>>();


            return _fixture;
        }
    }
}
