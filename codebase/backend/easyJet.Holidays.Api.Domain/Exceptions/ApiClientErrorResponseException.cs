using System.Net;

namespace easyJet.Holidays.Api.Common.Exceptions
{
    /// <summary>
    /// Api client exception: response is not successful
    /// </summary>
    public class ApiClientErrorResponseException : Exception
    {
        /// <summary>
        /// Response status code
        /// </summary>
        public HttpStatusCode StatusCode { get; private set; }

        /// <summary>
        /// Response stream
        /// </summary>
        public Stream Response { get; private set; }

        /// <summary>
        /// Contrustor
        /// </summary>
        /// <param name="statusCode"></param>
        /// <param name="response"></param>
        public ApiClientErrorResponseException(HttpStatusCode statusCode, Stream response)
            : base(GetMessage(statusCode), null)
        {
            StatusCode = statusCode;
            Response = response;
        }

        private static string GetMessage(HttpStatusCode status)
        {
            return $"Error making api call, status {(int)status}({status})";
        }
    }
}