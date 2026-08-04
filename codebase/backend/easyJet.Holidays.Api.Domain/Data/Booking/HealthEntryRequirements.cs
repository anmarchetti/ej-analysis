namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    public class HealthEntryRequirement
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public string Image { get; set; }
        public string Icon { get; set; }
        public CTA CTA { get; set; }
        public string TrackingLabel { get; set; }
    }

    public class CTA
    {
        public string Anchor { get; set; }
        public string Linktype { get; set; }
        public string Text { get; set; }
        public string Target { get; set; }
        public string Url { get; set; }
    }
}
