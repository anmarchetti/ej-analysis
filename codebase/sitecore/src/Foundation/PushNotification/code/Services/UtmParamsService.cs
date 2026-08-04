using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.Extensions.Configuration;
using Sitecore.Framework.Conditions;

namespace easyJet.Foundation.PushNotifications.Services
{
    /// <summary>
    /// UTM parameter service contains methods which set utm parameters to url.
    /// </summary>
    public class UtmParamsService : IUtmParamsService
    {
        private const string UtmCampaignParameter = "utm_campaign";
        private const string UtmContentParameter = "utm_content";

        private Dictionary<string, string> QueryParams { get; set; }

        public UtmParamsService(IConfiguration configuration)
        {
            Condition.Requires(configuration, nameof(configuration)).IsNotNull();
            BindPropertiesFromOptions(configuration);
        }

        /// <inheritdoc/>
        public string SetUtmParams(string url, string content, string campaignName)
        {
            QueryParams[UtmCampaignParameter] = campaignName;
            QueryParams[UtmContentParameter] = content;

            return SetQueryParameters(url, QueryParams);
        }

        /// <inheritdoc/>
        public string SetUtmParamsForTokenizedUrl(string url, string content, string campaignName)
        {
            var queryParameters = QueryParams.Select(pair => $"{pair.Key}={pair.Value}").ToList();
            if (!string.IsNullOrEmpty(campaignName))
            {
                queryParameters.Add($"{UtmCampaignParameter}={campaignName}");
            }

            if (!string.IsNullOrEmpty(content))
            {
                queryParameters.Add($"{UtmContentParameter}={content}");
            }

            var queryString = string.Join("&", queryParameters);
            return $"{url}?{queryString}";
        }

        /// <summary>
        /// Sets the specified parameter to the Query String.
        /// </summary>
        /// <param name="url">Url string.</param>
        /// <param name="queryParams">Collection of the query parameter to add.</param>
        /// <returns>Url with added parameter.</returns>
        private string SetQueryParameters(string url, Dictionary<string, string> queryParams)
        {
            if (string.IsNullOrEmpty(url))
            {
                return string.Empty;
            }

            var uriBuilder = new UriBuilder(url);
            var query = HttpUtility.ParseQueryString(uriBuilder.Query);
            foreach (var queryParam in queryParams)
            {
                if (!string.IsNullOrWhiteSpace(queryParam.Value))
                {
                    query[queryParam.Key] = queryParam.Value;
                }
            }

            uriBuilder.Query = query.ToString();

            return uriBuilder.Uri.ToString();
        }

        /// <summary>
        /// Bind properties from settings.
        /// </summary>
        /// <param name="configuration">Configuration settings.</param>
        private void BindPropertiesFromOptions(IConfiguration configuration)
        {
            QueryParams = configuration.GetSection("QueryParams").As<Dictionary<string, string>>();
        }
    }
}