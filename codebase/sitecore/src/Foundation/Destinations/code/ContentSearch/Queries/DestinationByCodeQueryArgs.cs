using easyJet.Foundation.Destinations.Models;

namespace easyJet.Foundation.Destinations.ContentSearch.Queries
{
    public class DestinationByCodeQueryArgs
    {
        public string Query { get; set; }

        public string[] Codes { get; set; }

        public int Page { get; set; }

        public int Take { get; set; }

        public DestinationFilter Filter { get; set; }

        public bool ShouldGetItemsForAutocompleteOnly { get; set; }

        public bool ShouldGetItemsForDropdownOnly { get; set; }

        public bool IncludeSearchByAirportCode { get; set; }

        // EUXE-1140 allows user to search by non-latin character ex. 'Ä'
        public bool ShouldBeCultureSearch { get; set; }
    }
}