using easyJet.Holidays.External.Atcom.Mappers.Utils;
using easyJet.Holidays.External.Atcom.Services;
using Microsoft.AspNetCore.Http;
using UserValidationResponse = easyJet.Holidays.Api.Domain.Data.Authentication.UserValidationResponse;

namespace easyJet.Holidays.External.Atcom.Mappers.UserValidation;

/// <inheritdoc />
public class UserValidationMapper(
    EndpointsProvider atcomRequestBuilder,
    AtcomRequestGenerator atcomRequestGenerator,
    IHttpContextAccessor httpContextAccessor) : IUserValidationMapper
{
    /// <inheritdoc />
    public Task<Models.UserValidation.UserValidationRequest> CreateRequest(
        Holidays.Api.Domain.Data.Authentication.UserValidationRequest userValidationRequest)
    {
        ArgumentNullException.ThrowIfNull(userValidationRequest);

        var clientInfo = atcomRequestGenerator.BuildCurrentCltInfo();
        clientInfo.User_Name = userValidationRequest.Username;
        var bookingRequest = new Models.UserValidation.UserValidationRequest
        {
            Payload =
            {
                Body = new Models.Internal.UserValidationRequest()
                {
                    Adm = VrpRequestUtils.BuildAdm(), 
                    CltInfo = clientInfo,
                    UserPwd = userValidationRequest.Password,
                }
            },
            Endpoint = atcomRequestBuilder.GetEndpoint(AtcomEndpoint.Booking,
                httpContextAccessor.HttpContext?.Request?.Cookies)
        };

        return Task.FromResult(bookingRequest);
    }
}