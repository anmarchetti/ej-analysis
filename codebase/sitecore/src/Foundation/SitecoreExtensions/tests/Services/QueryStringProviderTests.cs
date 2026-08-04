using System;
using System.IO;
using System.Web;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Services
{
    public class QueryStringProviderTests
    {
        private static readonly string RequestUrl = string.Concat(Uri.UriSchemeHttps, "://", "tempuri.org/");

        private readonly QueryStringProvider sut;

        public QueryStringProviderTests()
        {
            sut = new QueryStringProvider();
        }

        [Fact]
        public void GetQueryString_WhenKeyExists_ShouldReturnValue()
        {
            // ARRANGE
            using (var scope = new HttpContextScope(RequestUrl, "provider=test-provider"))
            {
                // ACT
                var result = sut.GetQueryString("provider");

                // ASSERT
                result.Should().Be("test-provider");
            }
        }

        [Fact]
        public void GetQueryString_WhenKeyDoesNotExist_ShouldReturnNullOrEmpty()
        {
            // ARRANGE
            using (var scope = new HttpContextScope(RequestUrl, "provider=test-provider"))
            {
                // ACT
                var result = sut.GetQueryString("missing");

                // ASSERT
                result.Should().BeNullOrEmpty();
            }
        }

        private sealed class HttpContextScope : System.IDisposable
        {
            private readonly HttpContext previousContext;

            public HttpContextScope(string url, string queryString)
            {
                previousContext = HttpContext.Current;
                HttpContext.Current = new HttpContext(
                    new HttpRequest(string.Empty, url, queryString),
                    new HttpResponse(new StringWriter()));
            }

            public void Dispose()
            {
                HttpContext.Current = previousContext;
            }
        }
    }
}
