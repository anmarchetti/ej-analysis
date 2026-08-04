using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Http;

namespace easyJet.Holidays.Api.Domain.Exceptions
{
    /// <summary>
    /// 
    /// </summary>
    public static class ExceptionResponseBuilder
    {
        /// <inheritdoc />
        public static ApiErrorResponse BuildErrorObject(HttpContext context, Exception exception, EnvironmentBehaviourSettings environmentBehaviourSettings)
        {
            // Extract error code from ApiException 
            var errorObject = new ApiErrorResponse();
            var errorMessage = exception.Message;
            var errorCode = ApiExceptionCodes.InternalServerError;
            ApiError[] innerErrors = null;
            Dictionary<string, string> additionalData = null;

            if (exception is ApiException)
            {
                var apiException = (exception as ApiException);
                errorCode = apiException.Code;
                errorMessage = errorCode.Description; // Override exception text and use predefined description
                innerErrors = apiException.InnerErrors;
                additionalData = apiException.AdditionalData;
            }

            errorObject.Error = errorMessage;
            errorObject.Code = errorCode.Code;
            errorObject.CorrelationId = context?.TraceIdentifier;
            errorObject.AdditionalData = additionalData;

            if (environmentBehaviourSettings.ReturnInnerErrorsFromApi)
            {
                errorObject.InnerErrors = innerErrors;
            }
            else
            {
                errorObject.InnerErrors = innerErrors?.Select(i => new ApiError
                {
                    Code = i.Code
                }).ToArray();
            }

            if (environmentBehaviourSettings.ReturnExceptionDetailsFromApiErrors)
            {
                errorObject.StackTrace = exception.StackTrace;
            }

            return errorObject;
        }
    }
}
