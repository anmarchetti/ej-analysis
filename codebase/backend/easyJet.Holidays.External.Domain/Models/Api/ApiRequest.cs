using easyJet.Holidays.Api.Domain.Extensions;
using System.Text;

namespace easyJet.Holidays.External.Domain.Models.Api
{
    public abstract class ApiRequest
    {
        public Uri Endpoint { get; set; }

        /// <summary>
        /// Request method 
        /// </summary>
        public virtual HttpMethod Method { get { return HttpMethod.Get; } }

        /// <summary>
        /// Request timeout value
        /// </summary>
        public virtual TimeSpan? Timeout { get; }

        /// <summary>
        /// Payload string value
        /// </summary>
        public abstract string PayloadString { get; }

        /// <summary>
        /// HttpRequestMessage value. If HttpRequestMessage is set all other Fields except Timeout will be ignored.
        /// </summary>
        public virtual HttpRequestMessage HttpRequestMessage { get; set; }

        /// <summary>
        /// Optional query string arguments to append to URI
        /// </summary>
        public virtual string QueryParams { get; private set; }

        /// <summary>
        /// Template that was used to set QueryParams
        /// </summary>
        public string QueryStringTemplate { get; private set; }

        /// <summary>
        /// Arguments added by AddQueryString. Saving them allows to mix calls to UpdateQueryString and AddQueryString.
        /// </summary>
        public List<string> CustomQueryArguments { get; private set; }

        /// <summary>
        /// Optional Response Validation Handler
        /// </summary>
        public virtual Action<ApiResponse> ValidateResponse { get; set; }

        /// <summary>
        /// Recalculate query string. Template is optional
        /// </summary>
        /// <param name="template">Query string template</param>
        public void SetQueryString(string template = null, QueryStringOptions options = null)
        {
            var queryStr = BuildQueryString(options);
            QueryStringTemplate = template;

            if (template != null && !string.IsNullOrEmpty(template))
            {
                queryStr = string.Format(template, queryStr);
            }

            if (!CustomQueryArguments.IsNullOrEmpty())
            {
                var customArgs = string.Join("&", CustomQueryArguments);
                queryStr = $"{queryStr}&{customArgs}";
            }

            QueryParams = queryStr;
        }

        /// <summary>
        /// Appends string to query params. 
        /// </summary>
        /// <param name="query">Query to add</param>
        public void AddQueryString(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return;
            }

            CustomQueryArguments ??= new List<string>();
            CustomQueryArguments.Add(query);

            QueryParams = $"{QueryParams}&{query}".TrimStart('&');
        }

        /// <summary>
        /// Virtual method more for testing to override query string generation logic
        /// </summary>
        /// <returns>Query string based on class members</returns>
        public virtual string BuildQueryString(QueryStringOptions options = null)
        {
            return this.GetQueryString(options);
        }

        /// <summary>
        /// Appends sc_lang parameter to query params. 
        /// </summary>
        /// <param name="language">Language param value</param>
        public void WithScLang(string language)
        {
            AddQueryString($"sc_lang={language}");
        }

        public void BuildRequestMessage(string mediaType)
        {
            var endpointUri = default(Uri);

            if (!string.IsNullOrWhiteSpace(QueryParams))
            {
                var uriBuilder = new UriBuilder(Endpoint);
                uriBuilder.Query = QueryParams;
                endpointUri = uriBuilder.Uri;
            }

            var requestMessage = new HttpRequestMessage(Method, endpointUri);
            if (!string.IsNullOrEmpty(PayloadString))
            {
                requestMessage.Content = new StringContent(PayloadString, Encoding.UTF8, mediaType);
            }

            HttpRequestMessage = requestMessage;
        }
    }
}
