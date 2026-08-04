using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.Feefo.Models.Review
{
    public class FeefoReviewsSummaryResponse : JsonApiResponse<FeefoReviewsSummaryResponseBody>
    {
        public override ApiError[] ApiErrors { get; }
    }

    public class FeefoReviewsSummaryResponseBody
    {
        [JsonProperty("merchant")]
        public SummaryMerchant Merchant { get; set; }

        [JsonProperty("meta")]
        public SummaryMeta Meta { get; set; }

        [JsonProperty("rating")]
        public SummaryRating Rating { get; set; }
    }

    public class SummaryMerchant
    {
        [JsonProperty("identifier")]
        public string Identifier { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("url")]
        public string Url { get; set; }

        [JsonProperty("logo")]
        public string Logo { get; set; }

        [JsonProperty("review_url")]
        public string ReviewUrl { get; set; }

        [JsonProperty("addressCountry")]
        public string AddressCountry { get; set; }

        [JsonProperty("addressLocality")]
        public string AddressLocality { get; set; }

        [JsonProperty("addressRegion")]
        public string AddressRegion { get; set; }

        [JsonProperty("postalCode")]
        public string PostalCode { get; set; }

        [JsonProperty("streetAddress")]
        public string StreetAddress { get; set; }

        [JsonProperty("telephone")]
        public string Telephone { get; set; }
    }

    public class SummaryMeta
    {
        [JsonProperty("count")]
        public int Count { get; set; }

        [JsonProperty("pages")]
        public int Pages { get; set; }

        [JsonProperty("verified_count")]
        public int VerifiedCount { get; set; }

        [JsonProperty("imported_count")]
        public int ImportedCount { get; set; }

        [JsonProperty("page_size")]
        public int PageSize { get; set; }
    }

    public class SummaryProduct
    {
        [JsonProperty("count")]
        public int Count { get; set; }

        [JsonProperty("1_star")]
        public int OneStar { get; set; }

        [JsonProperty("2_star")]
        public int TwoStar { get; set; }

        [JsonProperty("3_star")]
        public int ThreeStar { get; set; }

        [JsonProperty("4_star")]
        public int FourStar { get; set; }

        [JsonProperty("5_star")]
        public int FiveStar { get; set; }
    }

    public class SummaryRating
    {
        [JsonProperty("min")]
        public double Min { get; set; }

        [JsonProperty("max")]
        public double Max { get; set; }

        [JsonProperty("rating")]
        public double Rating { get; set; }

        [JsonProperty("service")]
        public SummaryService Service { get; set; }

        [JsonProperty("product")]
        public SummaryProduct Product { get; set; }
    }

    public class SummaryService
    {
        [JsonProperty("count")]
        public int Count { get; set; }

        [JsonProperty("1_star")]
        public int OneStar { get; set; }

        [JsonProperty("2_star")]
        public int TwoStar { get; set; }

        [JsonProperty("3_star")]
        public int ThreeStar { get; set; }

        [JsonProperty("4_star")]
        public int FourStar { get; set; }

        [JsonProperty("5_star")]
        public int FiveStar { get; set; }
    }
}