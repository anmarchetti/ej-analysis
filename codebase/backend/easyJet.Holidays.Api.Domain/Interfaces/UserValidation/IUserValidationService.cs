using easyJet.Holidays.Api.Domain.Data.Authentication;

namespace easyJet.Holidays.Api.Domain.Interfaces.UserValidation;

/// <summary>
/// Interface for user validation service
/// </summary>
public interface IUserValidationService
{
    /// <summary>
    /// Checks if the user is valid
    /// </summary>
    /// <param name="userValidationRequest"></param>
    /// <returns></returns>
    public Task<UserValidationResponse> IsUserValid(UserValidationRequest userValidationRequest);
}