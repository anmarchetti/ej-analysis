using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Domain.Exceptions
{
    public class ErrorResponseException : ExternalApiException
    {
        public ApiResponse Response { get; private set; }
        public string RawResponseData { get; private set; }
        public ApiError[] ApiErrors { get; private set; }

        public ErrorResponseException(ApiResponse response, string message, ApiError[] apiErrors, Exception innerException, string rawResponseData = null)
            : base(message, innerException)
        {
            Response = response;
            RawResponseData = rawResponseData;
            // ResponseModel = responseModel;
            ApiErrors = apiErrors;
        }
    }
}
