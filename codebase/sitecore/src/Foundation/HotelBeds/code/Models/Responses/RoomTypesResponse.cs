using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Models.Domain;
using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Responses
{
    /// <summary>
    /// Represents RoomTypesResponse model.
    /// </summary>
    public class RoomTypesResponse : CollectionBaseResponse<RoomType>
    {
        /// <summary>
        /// Gets or sets Room types data.
        /// </summary>
        [JsonProperty("rooms")]
        public override IEnumerable<RoomType> Data { get; set; }
    }
}