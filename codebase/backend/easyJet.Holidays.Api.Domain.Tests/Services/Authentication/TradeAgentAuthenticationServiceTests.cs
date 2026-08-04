using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Moq;
using System.Security.Claims;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Authentication
{
    public class TradeAgentAuthenticationServiceTests
    {
        private readonly IFixture _fixture;
        private readonly Mock<HttpContext> _httpContextMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<ITradeAgentCookieAuthService> _tradeAgentCookieServiceMock;

        public TradeAgentAuthenticationServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _fixture.Inject(Options.Create(new EnvironmentBehaviourSettings { IsTradePortal = true }));
            _httpContextMock = _fixture.Freeze<Mock<HttpContext>>();
            _httpContextAccessorMock = _fixture.Freeze<Mock<IHttpContextAccessor>>();
            _tradeAgentCookieServiceMock = _fixture.Freeze<Mock<ITradeAgentCookieAuthService>>();
            _httpContextAccessorMock.Setup(hca => hca.HttpContext).Returns(_httpContextMock.Object);
        }

        [Fact]
        public void GetDetails_ReturnsTokenAuthAgentDetails()
        {
            //arrange
            var user = new ClaimsPrincipal(new ClaimsIdentity(
                new[]
                {
                    new Claim("abta", "12345"),
                    new Claim("preferred_username", "TradeAgent"),
                }));

            _httpContextMock.Setup(context => context.User).Returns(user);
            _tradeAgentCookieServiceMock.Setup(x => x.GetCredentials()).Returns(default(AgentCredentials));

            var sut = _fixture.Create<TradeAgentAuthenticationService>();

            // act
            var result = sut.GetCurrentAgent();

            // assert
            result.Number.Should().Be("12345");
            result.Name.Should().Be("TradeAgent");
        }

        [Fact]
        public void GetDetails_ReturnsNull_IfAbtaNumberClaimNotProvided()
        {
            //arrange
            var user = new ClaimsPrincipal(new ClaimsIdentity(
                new[]
                {
                    new Claim("preferred_username", "TradeAgent"),
                }));

            _httpContextMock.Setup(context => context.User).Returns(user);
            _tradeAgentCookieServiceMock.Setup(x => x.GetCredentials()).Returns(default(AgentCredentials));

            var sut = _fixture.Create<TradeAgentAuthenticationService>();

            // act
            var result = sut.GetCurrentAgent();

            // assert
            result.Should().BeNull();
        }


        [Fact]
        public void GetDetails_ReturnsCookieAuthAgentDetails_WhenTokenAuthIsEmpty()
        {
            //arrange
            var agentCredentials = new AgentCredentials { Number = "12345", Ref = "TradeAgent" };

            _httpContextMock.Setup(context => context.User).Returns((ClaimsPrincipal)null);
            _tradeAgentCookieServiceMock.Setup(x => x.GetCredentials()).Returns(agentCredentials);

            var sut = _fixture.Create<TradeAgentAuthenticationService>();

            // act
            var result = sut.GetCurrentAgent();

            // assert
            result.Number.Should().Be("12345");
            result.Name.Should().Be("TRADEAGENT");
        }
    }
}
