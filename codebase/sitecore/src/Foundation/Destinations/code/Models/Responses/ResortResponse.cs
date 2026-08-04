using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class ResortResponse
    {
        public string ResortCode { get; set; }

        public string ResortName { get; set; }

        public string Theme { get; set; }

        public string CountryCode { get; set; }

        public List<HotelResponse> Hotels { get; set; }
    }
}