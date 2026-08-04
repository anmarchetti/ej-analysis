using Newtonsoft.Json;

namespace easyJet.Foundation.BeCause.Models.Response
{
    public class CompaniesSearchResponse
    {
        [JsonProperty("companies")]
        public Company[] Companies { get; set; }
    }
}