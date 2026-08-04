using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Exceptions;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.Domain.Models.Api;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Cms.Mappers.ResponseValidators
{
    public class CmsResponseValidators
    {
        private readonly CmsSettings _cmsSettings;

        public CmsResponseValidators(IOptions<CmsSettings> atcomSettings)
        {
            _cmsSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
        }

        public Action<ApiResponse> ValidateAtcomResponseCatchApiPromocodeErrorsAction => ValidateCmsResponseCatchValidationErrors;

        private void ValidateCmsResponseCatchValidationErrors<TResponse>(TResponse response) where TResponse : ApiResponse
        {
            if (response.HasErrors())
            {
                foreach (var error in response.ApiErrors)
                {
                    if (!_cmsSettings.ValidationErrorCodes.Any(x => string.Equals(x, error.Code, StringComparison.InvariantCultureIgnoreCase)))
                    {
                        throw new ErrorResponseException(response, "Response has errors", response.ApiErrors, null);
                    }
                }
            }
        }
    }
}
