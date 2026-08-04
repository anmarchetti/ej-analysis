namespace easyJet.Foundation.Destinations.Models.Requests
{
    public class DestinationsByAirportCodesRequest : BaseByPaginationRequest
    {
        public DestinationsByAirportCodesRequest()
        {
            Take = Sitecore.Configuration.Settings.GetIntSetting("Destinations.GetByAirportCodes.Pagination", 10);
            Page = 1;
            ShouldGetItemsForAutocompleteOnly = true;
            ShouldGetItemsForDropdownOnly = false;
        }

        public string Query { get; set; }

        public string[] Codes { get; set; }

        public DestinationFilter Filter { get; set; }

        public bool ShouldGetItemsForAutocompleteOnly { get; set; }

        public bool ShouldGetItemsForDropdownOnly { get; set; }
    }
}