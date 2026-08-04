using System.Runtime.Serialization;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.SearchTypes
{
    public class TransferInfoDurationResultItem
    {
        [IndexField("duration")]
        public int Duration { get; set; }

        [IndexField("productid")]
        public string ProductId { get; set; }

        [IndexField(BuiltinFields.LatestVersion)]
        public bool IsLatestVersion { get; set; }

        [IndexField("_language")]
        [DataMember]
        public virtual string Language { get; set; }
    }
}