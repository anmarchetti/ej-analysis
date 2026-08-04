using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    /// <summary>
    /// Represents Room Type model.
    /// </summary>
    public class RoomType : BaseObject
    {
        /// <summary>
        /// Gets or sets Description (ex: APARTMENT ONE BED)
        /// Combined result of typeDescription and characteristicDescription.
        /// </summary>
        [JsonProperty("description")]
        public string Description { get; set; }

        /// <summary>
        /// Gets or sets Type Description (ex: APARTMENT)
        /// Includes Content and Language code.
        /// </summary>
        [JsonProperty("typeDescription")]
        public RoomTypeDescription TypeDescription { get; set; }

        /// <summary>
        /// Gets or sets Characteristic Description (ex: ONE BED)
        /// Includes Content and Language code.
        /// </summary>
        [JsonProperty("characteristicDescription")]
        public RoomTypeDescription CharacteristicDescription { get; set; }
    }
}