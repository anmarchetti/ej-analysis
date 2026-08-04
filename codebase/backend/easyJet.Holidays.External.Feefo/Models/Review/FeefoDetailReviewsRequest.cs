using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Feefo.Models.Review
{
    internal class FeefoDetailReviewsRequest : FeefoGeneralRequest
    {
        [DataMember(Name = "sort")]
        public string Sort { get; set; }

        [DataMember(Name = "page_size")]
        public string PageSize { get; set; }

        [DataMember(Name = "page")]
        public string Page { get; set; }

        [DataMember(Name = "fields")]
        public string Fields { get; set; }
    }
}
