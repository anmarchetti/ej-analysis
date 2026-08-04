namespace easyJet.Holidays.External.Domain.Api
{
    public interface IApiClient
    {
        string MediaType { get; }


        /// <summary>
        /// Do api request and return response stream
        /// </summary>
        /// <param name="method">Http method</param>
        /// <param name="endpointUri">Endpoint Uri</param>
        /// <param name="payload">Payload body</param>
        /// <param name="queryString">Query string</param>
        /// <param name="timeout">Request imeout</param>
        /// <returns>Response content</returns>
        Task<Stream> MakeCall(HttpMethod method, Uri endpointUri, string payload, string queryString, TimeSpan? timeout);

        /// <summary>
        /// Do api request and return response stream by httpRequestMessage
        /// </summary>
        /// <param name="httpRequestMessage">the httpRequestMessage</param>
        /// <param name="timeout">Request imeout</param>
        /// <returns>Response content</returns>
        Task<Stream> MakeCall(HttpRequestMessage httpRequestMessage, TimeSpan? timeout);
    }
}