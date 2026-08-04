using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Extensions;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class RoomFacility : BaseFacility
    {
        public RoomFacility()
        {
        }

        public RoomFacility(Item referenceTypeItem, Item referenceItem)
            : base(referenceTypeItem, referenceItem)
        {
            Id = referenceItem.ID.ToString();
            Distance = referenceItem.Fields[Constants.Fields.AccommodationFacilityItem.Distance]?.Value;
            SortOrder = referenceTypeItem.Parent.TemplateID == Constants.TemplateIds.RoomTypeFacilityGroup ? referenceTypeItem.GetSortOrder() : referenceItem.GetSortOrder();
            IsErrataInfo = MainUtil.GetBool(referenceTypeItem.Fields[Constants.Fields.FacilityTypeItem.SetAsFacilityErrata]?.Value, false);
            SeasonalFacilitiesDataRange = referenceItem
                .GetDescendantsByTemplate(Constants.TemplateIds.SeasonalFacility)
                .Select(item => new DateRange()
                {
                    Start = ((DateField)item.Fields[Constants.Fields.SeasonalFacility.StartDate]).GetIsoDate(),
                    End = ((DateField)item.Fields[Constants.Fields.SeasonalFacility.EndDate]).GetIsoDate()
                }).ToList();
        }

        public string Id { get; set; }

        public string Distance { get; set; }

        public int SortOrder { get; set; }

        public bool IsErrataInfo { get; set; }

        public List<DateRange> SeasonalFacilitiesDataRange { get; set; }
    }
}