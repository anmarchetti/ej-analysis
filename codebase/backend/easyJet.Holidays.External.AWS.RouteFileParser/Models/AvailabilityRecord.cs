namespace easyJet.Holidays.External.AWS.RouteFileParser
{
    public struct AvailabilityRecord
    {
        public string Dep { get; set; }
        public string Arr { get; set; }
        public DateTime Date { get; set; }
    }
}
