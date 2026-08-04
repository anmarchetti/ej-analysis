using CsvHelper.Configuration.Attributes;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class FamilyFacilityTabRow
    {
        [Index(0)]
        public string HotelName { get; set; }

        [Index(1)]
        public string GiataCode { get; set; }

        [Index(2)]
        public string Description { get; set; }
    }
}
