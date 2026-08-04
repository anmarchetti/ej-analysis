namespace easyJet.Holidays.External.Salesforce.Models.Auth;

public class AccessTokenResponse
{
    public string Access_token { get; set; }
    public string Token_format { get; set; }
    public string Scope { get; set; }
    public string Instance_url { get; set; }
    public string Id { get; set; }
    public string Token_type { get; set; }
}
