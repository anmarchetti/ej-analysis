namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class HotelBoard
    {
        public string Code { get; set; }

        public string Name { get; set; }

        public string ItemName { get; set; }

        public string Content { get; set; }

        public string Description { get; set; }

        public string IconUrl { get; set; }

        public DatasourceObject BoardGroup { get; set; }
    }
}