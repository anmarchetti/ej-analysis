using easyJet.Holidays.Api.Domain.Data.Authentication;

namespace easyJet.Holidays.External.Atcom.Mappers.UserValidation;

/// <summary>
/// 
/// </summary>
public interface IUserValidationMapper
{
    /// <summary>
    /// 
    /// </summary>
    /// <param name="userValidationRequest"></param>
    /// <returns></returns>
    public Task<Models.UserValidation.UserValidationRequest> CreateRequest(UserValidationRequest userValidationRequest);
}