namespace easyJet.Holidays.Api.Domain.Data.Hotels
{
    public class HotelTransfer
    {
        public string Code { get; set; }

        public string Name { get; set; }

        public IEnumerable<Airport> Airports { get; set; }

        public string IconUrl { get; set; }

        public string Content { get; set; }

        public IEnumerable<ContentByDate> ContentByDate { get; set; }
    }

    public class ContentByDate
    {
        public DateTimeOffset? StartDate { get; set; }
        public DateTimeOffset? EndDate { get; set; }
        public string Content { get; set; }
    }
}