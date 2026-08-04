#nullable enable

namespace easyJet.Holidays.Api.Domain.Data.SmartSeer
{
    /// <summary>
    /// SmartSeer response body
    /// </summary>
    public class SmartSeerSortedBody
    {
        /// <summary>
        /// Sorted elemetns response 
        /// </summary>
        public SmartSeerResponseBody? Response { get; set; }

        /// <summary>
        /// SmartSeer tracking information
        /// </summary>
        public SmartSeerTrackingInfo? TrackingInfo { get; set; }

        /// <summary>
        /// Sponsored hotels
        /// </summary>
        public string[]? SponsoredHotels { get; set; }
    }
}
