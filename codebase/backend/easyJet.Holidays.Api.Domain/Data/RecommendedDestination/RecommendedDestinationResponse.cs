using easyJet.Holidays.Api.Domain.Data.SmartSeer;
using System.Collections.ObjectModel;

namespace easyJet.Holidays.Api.Domain.Data.RecommendedDestination
{
    /// <summary>
    /// Recommended destinations response
    /// </summary>
    public class RecommendedDestinationResponse
    {
        /// <summary>
        /// Collection of recommended destinations
        /// </summary>
        public IEnumerable<RecommendedDestination> Destinations { get; set; }
        
        /// <summary>
        /// SmartSeer tracking info
        /// </summary>
        public SmartSeerTrackingInfo TrackingInfo { get; set; }
    }
}
