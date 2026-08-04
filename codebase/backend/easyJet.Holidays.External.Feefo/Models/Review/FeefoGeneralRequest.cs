using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Feefo.Models.Review
{
    public class FeefoGeneralRequest : JsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;

        /* GENERAL */

        [DataMember(Name = "merchant_identifier")]
        public string MerchantIdentifier { get; set; }

        [DataMember(Name = "tags")]
        public string Tags { get; set; }

        [DataMember(Name = "date_time")]
        public string DateTime { get; set; }

        [DataMember(Name = "updated_date_time")]
        public string UpdatedDateTime { get; set; }

        [DataMember(Name = "since_period")]
        public string SincePeriod { get; set; }

        [DataMember(Name = "since_updated_period")]
        public string SinceUpdatedPeriod { get; set; }

        [DataMember(Name = "origin")]
        public string Origin { get; set; }

        [DataMember(Name = "id")]
        public string ID { get; set; }

        [DataMember(Name = "parent_product_sku")]
        public string ParentProductSKU { get; set; }

        [DataMember(Name = "product_sku")]
        public string ProductSKU { get; set; }

        [DataMember(Name = "customer_reference")]
        public string CustomerReference { get; set; }

        [DataMember(Name = "customer_email")]
        public string CustomerEmail { get; set; }

        [DataMember(Name = "order_reference")]
        public string OrderReference { get; set; }

        [DataMember(Name = "rating")]
        public string Rating { get; set; }

        [DataMember(Name = "children")]
        public string Children { get; set; }

        [DataMember(Name = "media")]
        public string Media { get; set; }

        [DataMember(Name = "empty_product_comments")]
        public string EmptyProductComments { get; set; }

        [DataMember(Name = "Unanswered_feedback")]
        public string UnansweredFeedback { get; set; }

        [DataMember(Name = "enhanced_insight")]
        public string EnhancedInsight { get; set; }

        [DataMember(Name = "feature")]
        public string Feature { get; set; }
    }
}
