using System;

namespace easyJet.Foundation.Destinations.Models.Requests
{
    public class HotelsCodesByDateRequest : BaseByPaginationRequest
    {
        /// <summary>
        /// Gets or sets Date to get codes from updated hotels.
        /// </summary>
        public DateTime? LastUpdated { get; set; }
    }
}