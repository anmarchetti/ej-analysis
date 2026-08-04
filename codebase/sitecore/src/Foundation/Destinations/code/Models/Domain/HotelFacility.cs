using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class HotelFacility : BaseFacility
    {
        public HotelFacility()
        {
        }

        public HotelFacility(Item referenceTypeItem, Item referenceItem)
            : base(referenceTypeItem, referenceItem)
        {
            Id = referenceItem.ID.ToString();
            Distance = referenceItem.Fields[Constants.Fields.AccommodationFacilityItem.Distance]?.Value;
            SortOrder = int.TryParse(referenceItem.Fields[Constants.Fields.StandardFields.SortOrder]?.Value, out int sortOrder) ? sortOrder : 0;
            IsErrataInfo = MainUtil.GetBool(referenceTypeItem.Fields[Constants.Fields.FacilityTypeItem.SetAsFacilityErrata]?.Value, false);
            Tooltip = referenceTypeItem.Fields[Constants.Fields.FacilityTypeItem.TooltipText]?.Value;
        }

        public string Id { get; set; }

        public string Distance { get; set; }

        public int SortOrder { get; set; }

        public bool IsErrataInfo { get; set; }

        public string Icon { get; set; }

        public string Tooltip { get; set; }
    }
}