using easyJet.Foundation.SitecoreExtensions.ContentSearch.BaseSearchTypes;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.SearchTypes
{
    public class BaseTransferInfoSearchResultItem : BaseSearchResultItem
    {
        [IndexField("airportid")]
        public string AirportId { get; set; }

        [IndexField("resortid")]
        public string ResortId { get; set; }

        [IndexField("resortname")]
        public string ResortName { get; set; }

        [IndexField("duration")]
        public int Duration { get; set; }

        [IndexField("arrivalinstr")]
        public string ArrivalInstr { get; set; }

        [IndexField("depinstr")]
        public string DepInstr { get; set; }

        [IndexField("type")]
        public string Type { get; set; }

        [IndexField("productid")]
        public string ProductId { get; set; }
    }
}