using easyJet.Holidays.External.Atcom.Models.InfoBooking;

namespace easyJet.Holidays.External.Atcom.Models.UserValidation;
/// <summary>
/// Request to Atcom API for UserValidation
/// </summary>
public class UserValidationRequest : AtcomApiRequest<Internal.UserValidationRequest>
{
    /// <summary>
    /// HTTP Method
    /// </summary>
    public override HttpMethod Method => HttpMethod.Post;

    /// <summary>
    /// Namespace for the request
    /// </summary>
    protected override string RequestNamespace => "AtComRes/UserValidationRequest";
}
