using System.Net;

namespace easyJet.Holidays.Tests.Domain
{
    public class HttpMessageHandlerStub : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> _sendAsync;

        public HttpMessageHandlerStub(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> sendAsync)
        {
            _sendAsync = sendAsync;
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return await _sendAsync(request, cancellationToken);
        }

        /// <summary>
        /// Util Func to build HttpClient stub which gives response with specified status and response in format:
        /// uri: {request uri}, content: {request content}, method: {method}
        /// </summary>
        public static readonly Func<HttpStatusCode, string, Func<HttpClient>> HttpClientCreator = (code, content) => () =>
        {
            return new HttpClient(new HttpMessageHandlerStub(async (request, cancellationToken) =>
            {
                var responseMessage = new HttpResponseMessage(code)
                {
                    Content = new StringContent($"uri: {request.RequestUri.ToString()}, content: {content}, method: {request.Method.ToString()}")
                };

                return await Task.FromResult(responseMessage);
            }));
        };
    }
}
