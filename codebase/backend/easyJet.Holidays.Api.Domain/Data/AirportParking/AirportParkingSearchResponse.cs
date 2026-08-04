using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AirportParking
{
    /// <summary>
    /// Root element of the response
    /// </summary>
    [DataContract]
    public class AirportParkingSearchResponse
    {
        /// <summary>
        /// Root element of the response
        /// </summary>
        [JsonProperty(PropertyName = "API_Reply")]
        public HolidayExtrasProducts HolidayExtrasProducts { get; set; }
    }

    /// <summary>
    /// Result of the Product Library endpoint from Holiday Extras.
    /// </summary>
    public class HolidayExtrasProducts
    {
        /// <summary>
        /// In case there are errors in the response, this object will be fulfilled with all the information. Otherwise, it will be null.
        /// </summary>
        [JsonProperty(PropertyName = "Error")]
        public HolidayExtrasApiError Error { get; set; }

        /// <summary>
        /// When the response is successful, all values are stored in this item. If there are errors, this object will be null.
        /// </summary>
        [JsonProperty(PropertyName = "Product")]
        public IEnumerable<HolidayExtrasProduct> Products { get; set; }

        /// <summary>
        /// Metadata containing information about the response.
        /// </summary>
        [JsonProperty(PropertyName = "ATTRIBUTES")]
        public HolidayExtrasApiResponseAttributes Attributes { get; set; }
    }

    /// <summary>
    /// Metadata containing information about the response.
    /// </summary>
    public class HolidayExtrasApiResponseAttributes
    {
        /// <summary>
        /// Either "OK" or "ERROR".
        /// </summary>
        [JsonProperty(PropertyName = "Result")]
        public string Result { get; set; }
    }

    /// <summary>
    /// When the response is successful, all values are stored in this item.
    /// </summary>
    public class HolidayExtrasProduct
    {
        /// <summary>
        /// Name of the parking.
        /// </summary>
        [JsonProperty(PropertyName = "tripappcarparkname")]
        public string Name { get; set; }

        /// <summary>
        /// First part of the description.
        /// </summary>
        [JsonProperty(PropertyName = "tripappcarparksellpoint")]
        public string Description { get; set; }

        /// <summary>
        /// Second part of the description.
        /// </summary>
        [JsonProperty(PropertyName = "tripapptransfertip")]
        public string TransferTip { get; set; }

        /// <summary>
        /// Meet and Greet value
        /// </summary>
        [JsonProperty(PropertyName = "meet_and_greet")]
        public string MeetAndGreet { get; set; }

        /// <summary>
        /// Park and Ride value
        /// </summary>
        [JsonProperty(PropertyName = "park_and_ride")]
        public string ParkAndRide { get; set; }

        /// <summary>
        /// Park and Stroll value
        /// </summary>
        [JsonProperty(PropertyName = "park_and_stroll")]
        public string ParkAndStroll { get; set; }

        /// <summary>
        /// Product brand image
        /// </summary>
        [JsonProperty(PropertyName = "brand_image")]
        public Uri BrandImage { get; set; }

        /// <summary>
        /// Parking address
        /// </summary>
        [JsonProperty(PropertyName = "address")]
        public string Address { get; set; }
    }

    /// <summary>
    /// In case there are errors in the response, this object will be fulfilled with all the information.
    /// </summary>
    public class HolidayExtrasApiError
    {
        /// <summary>
        /// Internal code for the error type. For example: "NoRows".
        /// </summary>
        [JsonProperty(PropertyName = "Code")]
        public required string Code { get; set; }

        /// <summary>
        /// Description of the error.
        /// </summary>
        [JsonProperty(PropertyName = "Message")]
        public required string Message { get; set; }
    }
}