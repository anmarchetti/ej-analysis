using System;
using System.Net;

namespace easyJet.Foundation.WebApi.Exceptions
{
    public class WebApiException : Exception
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="WebApiException"/> class.
        /// </summary>
        /// <param name="message">The message that describes the error.</param>
        public WebApiException(string message)
            : base(message)
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="WebApiException"/> class.
        /// </summary>
        /// <param name="message">The message that describes the error.</param>
        /// <param name="innerException">The exception that is the cause of the current exception, or a null reference if no inner exception is specified.</param>
        public WebApiException(string message, Exception innerException)
            : base(message, innerException)
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="WebApiException"/> class.
        /// </summary>
        /// <param name="message">The message that describes the error.</param>
        /// <param name="innerException">The exception that is the cause of the current exception, or a null reference if no inner exception is specified.</param>
        /// <param name="headers">An instance of the System.Net.WebHeaderCollection class that contains header values associated with this response.</param>
        /// <param name="reference">Reference [Optional].</param>
        public WebApiException(string message, Exception innerException, WebHeaderCollection headers, string reference = null)
            : base(message, innerException)
        {
            Reference = reference;
            CorrelationId = headers?.Get("X-Api-CorrelationId");
            Host = headers?.Get("X-Api-Host");
        }

        public string Reference { get; }

        public string CorrelationId { get; }

        public string Host { get; }

        public string ErrorCode { get; set; }
    }
}