namespace easyJet.Foundation.Destinations.Models.Requests
{
    public class ResortByIdsRequest
    {
        /// <summary>
        /// Gets or sets a value indicating whether to include hotel coordinates. Needed for map integrations.
        /// </summary>
        public bool WithHotelCoordinates { get; set; }

        public string[] AtcomIds { get; set; }
    }
}