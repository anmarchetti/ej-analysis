namespace easyJet.Holidays.Api.Domain.Data.Filters
{
    public class FlightFilters
    {
        public string Name { get; set; }
        public string Code { get; set; }
        public TimeSlot[] TimeSlots { get; set; }
    }
}