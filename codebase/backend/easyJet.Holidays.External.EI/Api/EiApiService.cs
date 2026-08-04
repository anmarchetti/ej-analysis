using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Exceptions;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.Domain.Models.Api;
using easyJet.Holidays.External.EI.Models;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.EI.Api
{
    public class EiApiService : ApiService
    {
        private readonly PaymentsSettings _paymentSettings;

        public EiApiService(EiApiClient apiClient, IOptions<PaymentsSettings> paymentSettings) : base(apiClient)
        {
            _paymentSettings = paymentSettings.Value ?? throw new ArgumentNullException(nameof(paymentSettings));
        }

        /// <inheritdoc />
        public override string Name() => "EI API service.";

        public override async Task<TResponse> GetResponseContentAsync<TRequest, TResponse>(TRequest request)
        {
            try
            {
                var response = await base.GetResponseContentAsync<TRequest, TResponse>(request);

                ValidatePaymentsGatewayResponse(response);

                return response;
            }
            catch (DeserializationException dex)
            {
                try
                {
                    ErrorResponse errorResponse = (ErrorResponse)Activator.CreateInstance(typeof(ErrorResponse));
                    errorResponse.DeserializePayload(dex.ResponseData);

                    ValidatePaymentsGatewayResponse(errorResponse);

                    // just in case ErrorResponse has no ERROR codes!
                    throw new ErrorResponseException(errorResponse, dex.Message, null, dex);
                }
                catch (Exception ex)
                {
                    // cant' parse error response :(
                    if (!(ex is ErrorResponseException))
                    {
                        throw new ErrorResponseException(null, dex.Message, null, ex, dex.ResponseData);
                    }
                    else
                    {
                        throw;
                    }
                }
            }
        }

        public override TResponse DeserializeResponse<TResponse>(string responseString)
        {

            if (responseString.Contains("error") &&
                responseString.Contains("code") &&
                responseString.Contains("SVC_PAY_"))
            {
                throw new DeserializationException(typeof(TResponse), responseString, null);
            }

            try
            {
                TResponse response;
                response = (TResponse)Activator.CreateInstance(typeof(TResponse));
                response.DeserializePayload(responseString);

                return response;
            }
            catch (Exception ex)
            {
                throw new DeserializationException(typeof(TResponse), responseString, ex);
            }
        }

        /// <summary>
        /// Throw ApiException is response status is not OK
        /// </summary>
        /// <param name="response">Response message instance</param>
        /// <param name="responseContent">Response content. Should be passed to prevent double-reading</param>
        private static void ValidatePaymentsGatewayResponse<TResponse>(TResponse response) where TResponse : ApiResponse
        {
            // If response code was OK but response contains errors
            if (response.HasErrors())
            {
                throw new ErrorResponseException(response, "Error response", response.ApiErrors, null);
            }
        }

        /// <inheritdoc />
        public override int DefaultTimeoutMilliSeconds()
        {
            return _paymentSettings.Api.TimeoutMilliSeconds;
        }
    }
}
