using Newtonsoft.Json;

namespace easyJet.Holidays.External.Salesforce.Models.Auth;

public class JwtPayload
{
    [JsonProperty("iss")]
    public string Iss { get; set; }

    [JsonProperty("sub")]
    public string Sub { get; set; }

    [JsonProperty("aud")]
    public string Aud { get; set; }

    [JsonProperty("exp")]
    public string Exp { get; set; }
}
