using Newtonsoft.Json;

namespace easyJet.Foundation.BeCause.Models.Response
{
    public class StatusResponseError
    {
        [JsonProperty("errorUrl")]
        public string ErrorUrl { get; set; }
    }
}