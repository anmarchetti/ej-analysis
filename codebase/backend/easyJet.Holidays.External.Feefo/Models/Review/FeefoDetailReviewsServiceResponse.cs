using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.Feefo.Models.Review
{
    public class FeefoDetailReviewsServiceResponse : JsonApiResponse<FeefoDetailReviewsServiceResponseBody>
    {
        public override ApiError[] ApiErrors { get; }
    }

    public class FeefoDetailReviewsServiceResponseBody
    {
        [JsonProperty("summary")]
        public ResponseSummary Summary { get; set; }

        [JsonProperty("reviews")]
        public List<ResponseReview> Reviews { get; set; }
    }

    public class ReviewCustomer
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("email")]
        public string Email { get; set; }

        [JsonProperty("order_ref")]
        public string OrderRef { get; set; }

        [JsonProperty("display_name")]
        public string DisplayName { get; set; }
    }

    public class ReviewMerchant
    {
        [JsonProperty("identifier")]
        public string Identifier { get; set; }
    }

    public class ReviewMeta
    {
        [JsonProperty("count")]
        public int Count { get; set; }

        [JsonProperty("pages")]
        public int Pages { get; set; }

        [JsonProperty("page_size")]
        public int PageSize { get; set; }

        [JsonProperty("current_page")]
        public int CurrentPage { get; set; }
    }

    public class ReviewRating
    {
        [JsonProperty("min")]
        public int Min { get; set; }

        [JsonProperty("max")]
        public int Max { get; set; }

        [JsonProperty("rating")]
        public int Rating { get; set; }
    }

    public class ResponseReview
    {
        [JsonProperty("merchant")]
        public ReviewMerchant Merchant { get; set; }

        [JsonProperty("tags")]
        public List<Tag> Tags { get; set; }

        [JsonProperty("url")]
        public string Url { get; set; }

        [JsonProperty("social")]
        public ReviewSocial Social { get; set; }

        [JsonProperty("customer")]
        public ReviewCustomer Customer { get; set; }

        [JsonProperty("service")]
        public ReviewService Service { get; set; }

        [JsonProperty("products_purchased")]
        public List<string> ProductsPurchased { get; set; }

        [JsonProperty("last_updated_date")]
        public DateTime LastUpdatedDate { get; set; }
    }

    public class ReviewService
    {
        [JsonProperty("rating")]
        public ReviewRating Rating { get; set; }

        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("title")]
        public string Title { get; set; }

        [JsonProperty("review")]
        public string Review { get; set; }

        [JsonProperty("moderation_status")]
        public string ModerationStatus { get; set; }

        [JsonProperty("created_at")]
        public DateTime CreatedAt { get; set; }

        [JsonProperty("helpful_votes")]
        public int HelpfulVotes { get; set; }
    }

    public class ReviewSocial
    {
        [JsonProperty("facebook")]
        public string Facebook { get; set; }

        [JsonProperty("twitter")]
        public string Twitter { get; set; }

        [JsonProperty("google_plus")]
        public string GooglePlus { get; set; }
    }

    public class ResponseSummary
    {
        [JsonProperty("meta")]
        public ReviewMeta Meta { get; set; }
    }

    public class Tag
    {
        [JsonProperty("type")]
        public string Type { get; set; }

        [JsonProperty("key")]
        public string Key { get; set; }

        [JsonProperty("values")]
        public List<string> Values { get; set; }
    }
}