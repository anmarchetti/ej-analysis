using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Cookies
{
    public class CookiesServiceTests
    {
        [Fact]
        public void GetCookie_WhenCookiesCollectionIsNull_ReturnsNull()
        {
            var sut = CreateSut();

            var result = sut.GetCookie(null!, "cookie-name");

            result.Should().BeNull();
        }

        [Fact]
        public void CreateCookie_WhenDomainIsNull_UsesRequestHostDomain()
        {
            var sut = CreateSut();
            var context = new DefaultHttpContext();
            context.Request.Host = new HostString("www.easyjet.com");
            context.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("1.1.1.1");
            context.Connection.LocalIpAddress = System.Net.IPAddress.Parse("2.2.2.2");

            sut.CreateCookie(context, "test-cookie", "value", null!, DateTime.UtcNow.AddMinutes(10), true);

            context.Response.Headers["Set-Cookie"].ToString().Should().Contain("test-cookie=value");
            context.Response.Headers["Set-Cookie"].ToString().Should().Contain("domain=www.easyjet.com");
        }

        [Fact]
        public void CreateCookie_WhenDomainProvided_UsesProvidedDomain_AndNoExpiresWhenNull()
        {
            var sut = CreateSut();
            var context = new DefaultHttpContext();

            sut.CreateCookie(context, "test-cookie", "value", "custom.domain", null, false);

            context.Response.Headers["Set-Cookie"].ToString().Should().Contain("test-cookie=value");
            context.Response.Headers["Set-Cookie"].ToString().Should().Contain("domain=custom.domain");
            context.Response.Headers["Set-Cookie"].ToString().Should().NotContain("expires=");
        }

        [Fact]
        public void DeleteCookie_CreatesDeletionCookieHeader()
        {
            var sut = CreateSut();
            var context = new DefaultHttpContext();
            context.Request.Host = new HostString("www.easyjet.com");
            context.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("1.1.1.1");
            context.Connection.LocalIpAddress = System.Net.IPAddress.Parse("2.2.2.2");

            sut.DeleteCookie(context, "to-delete", null!, true);

            context.Response.Headers["Set-Cookie"].ToString().Should().Contain("to-delete=");
            context.Response.Headers["Set-Cookie"].ToString().Should().Contain("expires=");
        }

        private static CookiesService CreateSut()
        {
            return new CookiesService(Options.Create(new CookiesSettings
            {
                WireMock = new WireMockSettings
                {
                    ApolloMock = "apollo-cookie",
                    AtcomMock = "atcom-cookie",
                    SitecoreMock = "sitecore-cookie",
                    B2BMock = "b2b-cookie",
                    PaymentMock = "payment-cookie",
                    DfloMock = "dflo-cookie",
                    SmartSeer = "smartseer-cookie",
                    TripAdvisorMock = "tripadvisor-cookie",
                    VoucherifyMock = "voucherify-cookie",
                    GoogleMock = "google-cookie",
                    SitecorePersonalizeMock = "sitecore-personalize-cookie",
                    MusementMock = "musement-cookie"
                }
            }));
        }
    }
}
