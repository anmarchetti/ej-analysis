using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Musement.Models
{
    /// <summary>
    /// Model returned by musement api
    /// </summary>
    [Serializable]
    [DataContract]
    public class SearchActivitiesResponseBody
    {
        /// <summary>
        /// Title
        /// </summary>
        [DataMember(Name = "title")]
        public string Title { get; set; }

        /// <summary>
        /// Description
        /// </summary>
        [DataMember(Name = "description")]
        public string Description { get; set; }

        /// <summary>
        /// LikelyToSellOut
        /// </summary>
        [DataMember(Name = "likely_to_sell_out")]
        public bool LikelyToSellOut { get; set; }

        /// <summary>
        /// CoverImageUrl
        /// </summary>
        [DataMember(Name = "cover_image_url")]
        public string CoverImageUrl { get; set; }

        /// <summary>
        /// RetailPrice
        /// </summary>
        [DataMember(Name = "retail_price")]
        public PriceResponseBody RetailPrice { get; set; }

        /// <summary>
        /// ReviewsNumber
        /// </summary>
        [DataMember(Name = "reviews_number")]
        public uint ReviewsNumber { get; set; }

        /// <summary>
        /// ReviewsAvg
        /// </summary>
        [DataMember(Name = "reviews_avg")]
        public double ReviewsAvg { get; set; }

        /// <summary>
        /// ReviewsAggregatedInfo
        /// </summary>
        [DataMember(Name = "reviews_aggregated_info")]
        public ReviewsInfoResponseBody ReviewsAggregatedInfo { get; set; }

        /// <summary>
        /// Url
        /// </summary>
        [DataMember(Name = "url")]
        public string Url { get; set; }

        /// <summary>
        /// FreeCancellation
        /// </summary>
        [DataMember(Name = "free_cancellation")]
        public bool FreeCancellation { get; set; }

        /// <summary>
        /// City
        /// </summary>
        [DataMember(Name = "city")]
        public CityResponseBody City { get; set; }
    }

    /// <summary>
    /// PriceResponseBody model
    /// </summary>
    [Serializable]
    [DataContract]
    public class PriceResponseBody
    {
        /// <summary>
        /// Currency (e.g. "GBP")
        /// </summary>
        [DataMember(Name = "currency")]
        public string Currency { get; set; }

        /// <summary>
        /// Value
        /// </summary>
        [DataMember(Name = "value")]
        public decimal Value { get; set; }
    }

    /// <summary>
    /// Review stars info model
    /// </summary>
    [Serializable]
    [DataContract]
    public class ReviewsInfoResponseBody
    {
        /// <summary>
        /// One star
        /// </summary>
        [DataMember(Name = "1")]
        public uint One { get; set; }

        /// <summary>
        /// Two stars
        /// </summary>
        [DataMember(Name = "2")]
        public uint Two { get; set; }

        /// <summary>
        /// Three stars
        /// </summary>
        [DataMember(Name = "3")]
        public uint Three { get; set; }

        /// <summary>
        /// Four stars
        /// </summary>
        [DataMember(Name = "4")]
        public uint Four { get; set; }

        /// <summary>
        /// Five stars
        /// </summary>
        [DataMember(Name = "5")]
        public uint Five { get; set; }
    }

    /// <summary>
    /// City response body
    /// </summary>
    [Serializable]
    [DataContract]
    public class CityResponseBody
    {
        /// <summary>
        /// City id in musement service
        /// </summary>
        [DataMember(Name = "id")]
        public int Id { get; set; }

        /// <summary>
        /// City name in musement service
        /// </summary>
        [DataMember(Name = "name")]
        public string Name { get; set; }

        /// <summary>
        /// City name in musement service
        /// </summary>
        [DataMember(Name = "country")]
        public CountryResponseBody Country { get; set; }
    }

    /// <summary>
    /// Country response body
    /// </summary>
    [Serializable]
    [DataContract]
    public class CountryResponseBody
    {
        /// <summary>
        /// Country id in musement service
        /// </summary>
        [DataMember(Name = "id")]
        public int Id { get; set; }

        /// <summary>
        /// Country name in musement service
        /// </summary>
        [DataMember(Name = "name")]
        public string Name { get; set; }
    }
}
