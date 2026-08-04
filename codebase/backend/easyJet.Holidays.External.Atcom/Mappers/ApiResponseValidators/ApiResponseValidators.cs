using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Exceptions;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.Domain.Models.Api;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Mappers.ApiResponseValidators
{
    public class ApiResponseValidators
    {
        private readonly AtcomSettings _atcomSettings;

        public ApiResponseValidators(IOptions<AtcomSettings> atcomSettings)
        {
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
        }

        public Action<ApiResponse> ValidateAtcomResponseCatchApiPromocodeErrorsAction => ValidateAtcomResponseCatchApiPromocodeErrors;

        private void ValidateAtcomResponseCatchApiPromocodeErrors<TResponse>(TResponse response) where TResponse : ApiResponse
        {
            if (response.HasErrors())
            {
                foreach (var error in response.ApiErrors)
                {
                    if (!_atcomSettings.PromoCodeErrorCodesToIgnore.Any(x => string.Equals(x.Key, error.Code, StringComparison.InvariantCultureIgnoreCase)))
                    {
                        throw new ErrorResponseException(response, "Response has errors", response.ApiErrors, null);
                    }
                }
            }
        }
    }
}
