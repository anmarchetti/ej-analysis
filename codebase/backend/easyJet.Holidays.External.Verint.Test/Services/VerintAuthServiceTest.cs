using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models;
using easyJet.Holidays.External.Domain.Models.Auth;
using easyJet.Holidays.External.Domain.Services;
using easyJet.Holidays.External.Verint.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Verint.Test.Services
{
    public class VerintAuthServiceTest
    {
        private readonly Mock<IApiService> _apiServiceMock;
        private readonly VerintApiSettings _verintApiSettings;
        private readonly Mock<ILogger<VerintAuthService>> _loggerMock;
        private readonly Mock<IAWSDbRepository<Token>> _awsRepoMock;

        private readonly VerintAuthService _sut;

        public VerintAuthServiceTest()
        {
            _apiServiceMock = new Mock<IApiService>();
            _verintApiSettings = new VerintApiSettings()
            {
                ClientId = "TestClient",
                UserName = "TestUser",
                GrantType = "TestGrantType",
                Password = "TestPassword",
                Scope = "TestScope",
                AuthEndPoint = @"https://test.endpoint:1234",
                AuthKey = "TestAuthKey",
            };

            _loggerMock = new Mock<ILogger<VerintAuthService>>();
            _awsRepoMock = new Mock<IAWSDbRepository<Token>>();

            _sut = new VerintAuthService(
                _apiServiceMock.Object,
                _awsRepoMock.Object,
                _loggerMock.Object,
                Options.Create(_verintApiSettings)
            );
        }

        [Fact]
        public async Task GetToken()
        {
            // Arrange
            var token = "TestAccessToken";
            var authResponse = new AuthResponse()
            {
                Payload =
                {
                    Body = new AuthToken()
                    {
                        Scope = "TestScope",
                        AccessToken = token,
                        ExpiresIn = 123,
                        TokenType = "TestTokenType"
                    }
                }
            };

            _apiServiceMock.Setup(i =>
                    i.GetResponseContentAsync<AuthRequest, AuthResponse>(It.IsAny<AuthRequest>()))
                .ReturnsAsync(authResponse);

            // Act
            var result = _sut.GetToken(true);

            // Assert
            result.Result.Should().Be(token);
        }

        [Fact]
        public async Task GetExpirationTime()
        {
            // Arrange
            var testVerintAuthService = new TestVerintAuthService(
                _apiServiceMock.Object,
                _awsRepoMock.Object,
                _loggerMock.Object,
                Options.Create(_verintApiSettings)
            );

            var todayDateTimeOffset = DateTimeOffset.Now;
            var unixTimeSeconds = todayDateTimeOffset.ToUnixTimeSeconds();
            // Act
            var dateTime = new DateTimeOffset(testVerintAuthService.GetExpirationTimeTest((int)unixTimeSeconds));

            // Assert
            var checkedDateTime = todayDateTimeOffset.UtcDateTime.AddSeconds(testVerintAuthService.ExpirationTimeMargin * -1);
            checkedDateTime = checkedDateTime.AddTicks(-(checkedDateTime.Ticks % TimeSpan.TicksPerSecond));
            dateTime.Should().Be(checkedDateTime);
        }
    }

    internal class TestVerintAuthService : VerintAuthService
    {
        public TestVerintAuthService(IApiService apiService, IAWSDbRepository<Token> repository, ILogger<BaseAuthService> logger, IOptions<VerintApiSettings> verintApiSettings) : base(apiService, repository, logger, verintApiSettings)
        {
        }

        public DateTime GetExpirationTimeTest(int expiresIn)
        {
            return base.GetExpirationTime(expiresIn);
        }
    }
}
