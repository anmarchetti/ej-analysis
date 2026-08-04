using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Interfaces.UserValidation;
using easyJet.Holidays.External.Atcom.Mappers.UserValidation;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;

namespace easyJet.Holidays.External.Atcom.Services.UserValidation;

/// <inheritdoc />
public class UserValidationService(IUserValidationMapper userValidationMapper, IApiService apiService) : IUserValidationService
{
    /// <inheritdoc />
    public async Task<UserValidationResponse> IsUserValid(UserValidationRequest userValidationRequest)
    {
        ArgumentNullException.ThrowIfNull(userValidationRequest);

        var infoCancellationRequest = await userValidationMapper.CreateRequest(userValidationRequest);
        infoCancellationRequest.ValidateResponse = (_) => { };

        try
        {
            var response = await apiService.GetResponseContentAsyncCustomErrorHandling<Models.UserValidation.UserValidationRequest, Models.UserValidation.UserValidationResponse>(
                infoCancellationRequest);

            return new UserValidationResponse() { IsValid = !response.HasErrors() };
        }
        catch (Exception)
        {
            return new UserValidationResponse() { IsValid = false };
        }
    }
}
