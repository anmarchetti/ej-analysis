namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class HotelFilters : HotelFacilitiesDatasource
    {
        public string Code { get; set; }

        public string Name { get; set; }

        public int StarRating { get; set; }

        public double TripAdvisorRating { get; set; }

        public BoardTypeFilter[] Boards { get; set; }

        public FacilityHeader[] FacilityGroups { get; set; }
    }
}