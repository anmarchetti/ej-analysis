using System;
using System.Net;
using System.Text;
using System.Web.Mvc;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.Diagnostics;

namespace easyJet.Foundation.SitecoreExtensions.Attributes
{
    /// <summary>
    /// Authorizes MVC actions by validating the CMS API key provided in the request headers.
    /// </summary>
    /// <remarks>
    /// The client must send the API key in the <c>X-API-Key</c> header.
    /// The expected API key is loaded from AWS Secrets Manager using the
    /// <c>Sitecore.ApiKey</c> secret key.
    ///
    /// If the header is missing, empty, invalid, or the expected key cannot be loaded,
    /// the request is rejected with <see cref="HttpStatusCode.Unauthorized" />.
    /// </remarks>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
    public class CmsApiKeyAuthorizeAttribute : AuthorizeAttribute
    {
        private const string ApiKeyHeaderName = "X-API-Key";
        private const string ApiKeySecretName = "Sitecore.ApiKey";

        /// <summary>
        /// Determines whether the current request is authorized by comparing the provided
        /// API key with the expected value stored in AWS Secrets Manager.
        /// </summary>
        /// <param name="httpContext">The HTTP context for the current request.</param>
        /// <returns>
        /// <c>true</c> when the request contains a valid CMS API key; otherwise, <c>false</c>.
        /// </returns>
        protected override bool AuthorizeCore(System.Web.HttpContextBase httpContext)
        {
            if (httpContext == null)
            {
                throw new ArgumentNullException(nameof(httpContext));
            }

            var providedApiKey = httpContext.Request.Headers[ApiKeyHeaderName];

            if (string.IsNullOrWhiteSpace(providedApiKey))
            {
                return false;
            }

            string expectedApiKey;

            try
            {
                expectedApiKey = SecretsManager.GetSecret(ApiKeySecretName);
            }
            catch (Exception ex)
            {
                Log.Error($"Unable to retrieve CMS API key from Secrets Manager. Secret key: {ApiKeySecretName}", ex, this);

                return false;
            }

            if (string.IsNullOrWhiteSpace(expectedApiKey))
            {
                Log.Error($"CMS API key is missing or empty in Secrets Manager. Secret key: {ApiKeySecretName}", this);

                return false;
            }

            return FixedTimeEquals(providedApiKey, expectedApiKey);
        }

        /// <summary>
        /// Handles unauthorized requests by returning a 401 Unauthorized response.
        /// </summary>
        /// <param name="filterContext">The authorization context for the current request.</param>
        protected override void HandleUnauthorizedRequest(AuthorizationContext filterContext)
        {
            var response = filterContext.HttpContext.Response;
            response.StatusCode = (int)HttpStatusCode.Unauthorized;
            response.TrySkipIisCustomErrors = true;
            response.SuppressFormsAuthenticationRedirect = true;

            filterContext.Result = new JsonResult
            {
                Data = new
                {
                    Message = $"Invalid or missing {ApiKeyHeaderName}."
                },
                JsonRequestBehavior = JsonRequestBehavior.AllowGet
            };
        }

        /// <summary>
        /// Compares two API key values using a fixed-time comparison to reduce timing-based leakage.
        /// </summary>
        /// <param name="left">The first API key value to compare.</param>
        /// <param name="right">The second API key value to compare.</param>
        /// <returns>
        /// <c>true</c> when both API key values are equal; otherwise, <c>false</c>.
        /// </returns>
        private static bool FixedTimeEquals(string left, string right)
        {
            if (left == null || right == null)
            {
                return false;
            }

            var leftBytes = Encoding.UTF8.GetBytes(left);
            var rightBytes = Encoding.UTF8.GetBytes(right);

            if (leftBytes.Length != rightBytes.Length)
            {
                return false;
            }

            var diff = 0;

            for (var i = 0; i < leftBytes.Length; i++)
            {
                diff |= leftBytes[i] ^ rightBytes[i];
            }

            return diff == 0;
        }
    }
}
