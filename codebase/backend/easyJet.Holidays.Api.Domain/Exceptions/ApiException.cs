using easyJet.Holidays.Api.Domain.Data.Errors;
using System.Net;

namespace easyJet.Holidays.Api.Common.Exceptions
{
    /// <summary>
    /// Api exception base class
    /// </summary>
    public class ApiException : Exception
    {
        /// <summary>
        /// Exception code
        /// </summary>
        public ExceptionCode Code { get; private set; }

        /// <summary>
        /// Exception HTTP status code. If not specified 503 will be used
        /// </summary>
        public HttpStatusCode? StatusCode { get; private set; }

        /// <summary>
        /// Additional data to set
        /// </summary>
        public Dictionary<string, string> AdditionalData { get; private set; }

        /// <summary>
        /// Inner errors from underlying API
        /// </summary>
        public ApiError[] InnerErrors { get; set; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="code">Exception code</param>
        /// <param name="message">Message text</param>
        /// <param name="innerErrors">Inner api errors</param>
        /// <param name="innerException">Inner exception</param>
        /// <param name="statusCode">Http status code for exception</param>
        /// <param name="data">Any additional data to pass with Error</param>
        public ApiException(ExceptionCode code, string message, ApiError[] innerErrors, Exception innerException, HttpStatusCode? statusCode, Dictionary<string, string> data)
            : base(message, innerException)
        {
            Code = code;
            InnerErrors = innerErrors;
            StatusCode = statusCode;
            AdditionalData = data;
        }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="code">Exception code</param>
        /// <param name="message">Message text</param>
        /// <param name="innerErrors">Inner api errors</param>
        /// <param name="innerException">Inner exception</param>
        /// <param name="statusCode">Http status code for exception</param>
        /// <param name="data">Any additional data to pass with Error</param>
        public ApiException(ExceptionCode code, string message, ApiError[] innerErrors, Exception innerException, HttpStatusCode? statusCode)
            : base(message, innerException)
        {
            Code = code;
            InnerErrors = innerErrors;
            StatusCode = statusCode;
        }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="code">Exception code</param>
        /// <param name="message">Message text</param>
        /// <param name="innerErrors">Inner api errors</param>
        /// <param name="innerException">Inner exception</param>
        public ApiException(ExceptionCode code, string message, ApiError[] innerErrors, Exception innerException)
            : this(code, message, innerErrors, innerException, null, null)
        {
        }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="code">Exception code</param>
        /// <param name="innerErrors">Inner api errors</param>
        /// <param name="message">Message text</param>
        public ApiException(ExceptionCode code, ApiError[] innerErrors, string message)
            : this(code, message, innerErrors, null)
        {
        }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="code">Exception code</param>
        /// <param name="innerErrors">Inner api errors</param>
        /// <param name="innerException">Inner exception</param>
        public ApiException(ExceptionCode code, ApiError[] innerErrors, Exception innerException)
            : this(code, string.Empty, innerErrors, innerException)
        {
        }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="code">Exception code</param>
        /// <param name="message">Message text</param>
        public ApiException(ExceptionCode code, string message)
            : this(code, message, null, null)
        {
        }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="code">Exception code</param>
        /// <param name="message">Message text</param>
        /// <param name="statusCode"></param>
        public ApiException(ExceptionCode code, string message, HttpStatusCode? statusCode)
            : this(code, message, null, null, statusCode)
        {
        }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="exc"></param>
        /// <param name="statusCode"></param>
        public ApiException(ApiException exc, HttpStatusCode? statusCode)
            : this(exc.Code, exc.Message, exc.InnerErrors, exc.InnerException, statusCode, exc.AdditionalData)
        {
        }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="exc"></param>
        /// <param name="statusCode"></param>
        public ApiException(ExceptionCode code)
            : this(code, string.Empty, null, null)
        {
        }

        public ApiException(ExceptionCode code, HttpStatusCode statusCode)
            : this(code, string.Empty, null, null)
        {
            StatusCode = statusCode;
        }

        public ApiException(ExceptionCode code, HttpStatusCode statusCode, Exception innerException)
            : this(code, string.Empty, null, innerException)
        {
            StatusCode = statusCode;
        }
    }
}
