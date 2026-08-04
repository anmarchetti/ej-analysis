using System.Globalization;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class OfferFilter
    {
        public string Code { get; set; }

        public string Name { get; set; }

        public bool Enabled { get; set; }

        public string Value { get; set; }

        public string TrackingId { get; set; }

        public OfferFilter(Item item)
        {
            Name = item.Fields[Constants.Fields.OfferFilterItem.Name]?.Value;
            Code = item.Fields[Constants.Fields.OfferFilterItem.Code]?.Value;
            Enabled = item.Fields[Constants.Fields.OfferFilterItem.Enabled]?.Value == "1";
            Value = item.Fields[Constants.Fields.OfferFilterItem.Value]?.Value;
            TrackingId = item.Fields[Constants.Fields.OfferFilterItem.TrackingId]?.Value;
        }
    }
}