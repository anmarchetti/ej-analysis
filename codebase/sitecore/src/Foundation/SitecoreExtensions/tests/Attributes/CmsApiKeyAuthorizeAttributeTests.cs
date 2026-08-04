using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Net;
using System.Web;
using System.Web.Mvc;
using easyJet.Foundation.SitecoreExtensions.Attributes;
using easyJet.Foundation.SitecoreExtensions.Utils;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Attributes
{
    public class CmsApiKeyAuthorizeAttributeTests
    {
        private const string ApiKeyHeaderName = "X-API-Key";
        private const string ApiKeySecretName = "Sitecore.ApiKey";

        [Fact]
        public void AuthorizeCore_ShouldThrowArgumentNullException_WhenHttpContextIsNull()
        {
            var sut = new TestableCmsApiKeyAuthorizeAttribute();

            Action act = () => sut.Authorize(null);

            act.Should().Throw<ArgumentNullException>()
                .Which.ParamName.Should().Be("httpContext");
        }

        [Fact]
        public void AuthorizeCore_ShouldReturnFalse_WhenApiKeyHeaderIsMissing()
        {
            var sut = new TestableCmsApiKeyAuthorizeAttribute();
            var httpContext = CreateHttpContext();

            var result = sut.Authorize(httpContext);

            result.Should().BeFalse();
        }

        [Theory]
        [InlineData("")]
        [InlineData(" ")]
        [InlineData("\t")]
        public void AuthorizeCore_ShouldReturnFalse_WhenApiKeyHeaderIsEmpty(string apiKey)
        {
            var sut = new TestableCmsApiKeyAuthorizeAttribute();
            var httpContext = CreateHttpContext(apiKey);

            var result = sut.Authorize(httpContext);

            result.Should().BeFalse();
        }

        [Fact]
        public void AuthorizeCore_ShouldReturnTrue_WhenApiKeyIsValid()
        {
            const string apiKey = "VPpz4zssXmVUu1IwMFi6wvnMBKGjvwUORVgjXdA6yCc";

            var sut = new TestableCmsApiKeyAuthorizeAttribute();
            var httpContext = CreateHttpContext(apiKey);

            using (new SecretsManagerSwitcher(new Dictionary<string, string>
            {
                { ApiKeySecretName, apiKey }
            }))
            {
                var result = sut.Authorize(httpContext);

                result.Should().BeTrue();
            }
        }

        [Fact]
        public void AuthorizeCore_ShouldReturnFalse_WhenApiKeyIsInvalid()
        {
            var sut = new TestableCmsApiKeyAuthorizeAttribute();
            var httpContext = CreateHttpContext("invalid-api-key");

            using (new SecretsManagerSwitcher(new Dictionary<string, string>
            {
                { ApiKeySecretName, "expected-api-key" }
            }))
            {
                var result = sut.Authorize(httpContext);

                result.Should().BeFalse();
            }
        }

        [Theory]
        [InlineData("")]
        [InlineData(" ")]
        [InlineData("\t")]
        public void AuthorizeCore_ShouldReturnFalse_WhenExpectedApiKeyIsEmpty(string expectedApiKey)
        {
            var sut = new TestableCmsApiKeyAuthorizeAttribute();
            var httpContext = CreateHttpContext("provided-api-key");

            using (new SecretsManagerSwitcher(new Dictionary<string, string>
            {
                { ApiKeySecretName, expectedApiKey }
            }))
            {
                var result = sut.Authorize(httpContext);

                result.Should().BeFalse();
            }
        }

        [Fact]
        public void AuthorizeCore_ShouldReturnFalse_WhenExpectedApiKeyIsMissingFromSecrets()
        {
            var sut = new TestableCmsApiKeyAuthorizeAttribute();
            var httpContext = CreateHttpContext("provided-api-key");

            using (new SecretsManagerSwitcher(new Dictionary<string, string>()))
            {
                var result = sut.Authorize(httpContext);

                result.Should().BeFalse();
            }
        }

        [Fact]
        public void HandleUnauthorizedRequest_ShouldSetUnauthorizedResponse()
        {
            var sut = new TestableCmsApiKeyAuthorizeAttribute();

            var response = Substitute.For<HttpResponseBase>();
            var httpContext = Substitute.For<HttpContextBase>();
            httpContext.Response.Returns(response);

            var controllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };

            var authorizationContext = new AuthorizationContext(controllerContext);

            sut.HandleUnauthorized(authorizationContext);

            response.Received().StatusCode = (int)HttpStatusCode.Unauthorized;
            response.Received().TrySkipIisCustomErrors = true;
            response.Received().SuppressFormsAuthenticationRedirect = true;

            var result = authorizationContext.Result.Should()
                .BeOfType<JsonResult>()
                .Subject;

            result.JsonRequestBehavior.Should().Be(JsonRequestBehavior.AllowGet);

            var message = result.Data
                .GetType()
                .GetProperty("Message")
                .GetValue(result.Data, null);

            message.Should().Be("Invalid or missing X-API-Key.");
        }

        private static HttpContextBase CreateHttpContext(string apiKey = null)
        {
            var headers = new NameValueCollection();

            if (apiKey != null)
            {
                headers.Add(ApiKeyHeaderName, apiKey);
            }

            var request = Substitute.For<HttpRequestBase>();
            request.Headers.Returns(headers);

            var httpContext = Substitute.For<HttpContextBase>();
            httpContext.Request.Returns(request);

            return httpContext;
        }

        private class TestableCmsApiKeyAuthorizeAttribute : CmsApiKeyAuthorizeAttribute
        {
            public bool Authorize(HttpContextBase httpContext)
            {
                return AuthorizeCore(httpContext);
            }

            public void HandleUnauthorized(AuthorizationContext filterContext)
            {
                HandleUnauthorizedRequest(filterContext);
            }
        }
    }
}