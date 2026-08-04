using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Models.Domain;
using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Responses
{
    public abstract class BaseResponse<T>
        where T : BaseObject
    {
        [JsonProperty("from")]
        public int From { get; set; }

        [JsonProperty("to")]
        public int To { get; set; }

        [JsonProperty("total")]
        public int Total { get; set; }
    }
}