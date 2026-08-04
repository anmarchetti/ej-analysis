namespace easyJet.Holidays.Api.Domain.Data.Authentication;
/// <summary>
/// Response object to authenticate with Atcom
/// </summary>
public class UserValidationResponse
{
    /// <summary>
    /// Indicates if the user is authenticated
    /// </summary>
    public bool IsValid { get; set; }
}
