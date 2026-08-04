using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Models.Domain;
using Sitecore.ContentSearch;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class TransfersComputedField : AccommodationReferenceComputedField
    {
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            return ComputeReference(
                indexableItem.Item,
                Constants.AccommodationReferences.Transfers,
                Constants.Fields.AccommodationTransferItem.TransferType);
        }

        protected internal override object MapReference(Item referenceTypeItem, Item referenceItem)
        {
            return new HotelTransfer
            {
                Name = GetFieldValue(referenceTypeItem, referenceItem, Constants.Fields.DatasourceItem.Name),
                Code = referenceTypeItem.Fields[Constants.Fields.DatasourceItem.Code]?.Value,
                Content = GetFieldValue(referenceTypeItem, referenceItem, Constants.Fields.AccommodationReferenceItem.Content),
                Airports = GetAirports(referenceItem),
                IconUrl = GetIcon(referenceTypeItem, referenceItem),
                ContentByDate = referenceItem.GetChildren().Select(x => new ContentByDate(x))
            };
        }

        private IEnumerable<Airport> GetAirports(Item item)
        {
            MultilistField multilist = item.Fields[Constants.Fields.AccommodationTransferItem.Airports];
            return multilist?.GetItems()?.Select(x => new Airport(x));
        }
    }
}