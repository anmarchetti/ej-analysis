using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Excursions
{
    /// <summary>
    /// Model returned by endpoint (controller)
    /// </summary>
    [Serializable]
    [DataContract]
    public class ExcursionsResponse
    {
        /// <summary>
        /// Excursions
        /// </summary>
        [DataMember(Name = "excursions")]
        public IEnumerable<Excursion> Excursions { get; set; }

        /// <summary>
        /// Link for go to musement site 
        /// </summary>
        [DataMember(Name = "excursionsLink")]
        public string ExcursionsLink { get; set; }
    }

    /// <summary>
    /// Excursion model
    /// </summary>
    [Serializable]
    [DataContract]
    public class Excursion
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
        [DataMember(Name = "likelyToSellOut")]
        public bool LikelyToSellOut { get; set; }

        /// <summary>
        /// CoverImageUrl
        /// </summary>
        [DataMember(Name = "coverImageUrl")]
        public string CoverImageUrl { get; set; }

        /// <summary>
        /// RetailPrice
        /// </summary>
        [DataMember(Name = "retailPrice")]
        public Price RetailPrice { get; set; }

        /// <summary>
        /// ReviewsNumber
        /// </summary>
        [DataMember(Name = "reviewsNumber")]
        public uint ReviewsNumber { get; set; }

        /// <summary>
        /// ReviewsAvg
        /// </summary>
        [DataMember(Name = "reviewsAvg")]
        public double ReviewsAvg { get; set; }

        /// <summary>
        /// ReviewsAggregatedInfo
        /// </summary>
        [DataMember(Name = "reviewsAggregatedInfo")]
        public ReviewsInfo ReviewsAggregatedInfo { get; set; }

        /// <summary>
        /// Url
        /// </summary>
        [DataMember(Name = "url")]
        public string Url { get; set; }

        /// <summary>
        /// FreeCancellation
        /// </summary>
        [DataMember(Name = "freeCancellation")]
        public bool FreeCancellation { get; set; }
    }

    /// <summary>
    /// 
    /// </summary>
    [Serializable]
    [DataContract]
    public class Price
    {
        /// <summary>
        /// Currency code (e.g. "GBP")
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
    public class ReviewsInfo
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
}
