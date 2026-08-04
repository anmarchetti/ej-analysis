using System.Collections.Generic;
using easyJet.Foundation.Atcom.Models.External;
using easyJet.Foundation.Destinations.Models.Domain;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Atcom.Models.Domain
{
    public class UpdateHotelData
    {
        public Item Item { get; set; }

        public AccommodationDataObject AtcomDataItem { get; set; }

        public Dictionary<string, AccommodationHeaderDataEntry> VrpDataByCode { get; set; }

        public Dictionary<string, AtcomAccommodation> AccommodationsByCode { get; set; }

        public Dictionary<string, ThemeTypeIds> ThemesTypesIdsGroupedByTypeCode { get; set; }

        public bool WasNewVersionAdded { get; set; }

        public string RootPath { get; set; }

        public string ResortName { get; set; }
    }
}