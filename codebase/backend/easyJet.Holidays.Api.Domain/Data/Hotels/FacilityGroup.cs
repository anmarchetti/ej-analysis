namespace easyJet.Holidays.Api.Domain.Data.Hotels
{
    public class FacilityGroup
    {
        public string Name { get; set; }

        public string TrackingId { get; set; }

        public int Order { get; set; }

        public List<Facility> FacilityFilteredTypes { get; set; }
    }
}
