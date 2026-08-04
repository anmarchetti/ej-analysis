using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Musement.Models
{
    public class WhiteLabelRequest : JsonApiRequest<object>
    {
        [DataMember(Name = "currency")]
        public string Currency { get; set; }
        [DataMember(Name = "country_in")]
        public string CountryIn { get; set; }

        [DataMember(Name = "country_title")]
        public string CountryTitle { get; set; }

        [DataMember(Name = "search_nearby")]
        public int? SearchNearBy { get; set; }

        [DataMember(Name = "text")]
        public string Text { get; set; }

        [DataMember(Name = "available_from")]
        public string AvailableFrom { get; set; }

        [DataMember(Name = "available_to")]
        public string AvailableTo { get; set; }
    }
}
