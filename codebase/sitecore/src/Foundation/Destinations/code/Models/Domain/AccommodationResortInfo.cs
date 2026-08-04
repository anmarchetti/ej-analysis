using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class AccommodationResortInfo
    {
        public AccommodationResortInfo()
        {
        }

        public AccommodationResortInfo(HotelResortSearchResultItem document)
        {
            if (document != null)
            {
                ResortImageUrl = document.ResortImageUrl;
                ResortDescription = document.ResortDescription;
            }
        }

        public string ResortImageUrl { get; set; }

        public string ResortDescription { get; set; }
    }
}