namespace easyJet.Holidays.Api.Domain.Data.Hotels
{
    public class Facility
    {
        public string Code { get; set; }

        public string Name { get; set; }

        public string TrackingId { get; set; }

        public FacilityFilterGroup FacilityFilterGroup { get; set; }

        public int Order { get; set; }

        public string Tooltip { get; set; }
    }
}
