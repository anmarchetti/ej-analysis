namespace easyJet.Holidays.Api.Domain.Data.Authentication;
/// <summary>
/// Request object to authenticate with Atcom
/// </summary>
public class UserValidationRequest
{
    /// <summary>
    /// Username to authenticate with Atcom
    /// </summary>
    public string Username { get; set; }

    /// <summary>
    /// Password to authenticate with Atcom
    /// </summary>
    public string Password { get; set; }
}
