using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace easyJet.Foundation.Tracking.Models.Requests
{
    /// <summary>
    /// Represents user search request model.
    /// </summary>
    public class UserSearchRequest
    {
        /// <summary>
        /// Gets or sets 'from' user searh parameter.
        /// </summary>
        [JsonProperty("from")]
        public List<string> From { get; set; }

        /// <summary>
        /// Gets or sets 'to' user searh parameter.
        /// </summary>
        [JsonProperty("to")]
        public List<string> To { get; set; }

        /// <summary>
        /// Gets or sets start date of user searh parameter.
        /// </summary>
        [JsonProperty("startDate")]
        public string StartDate { get; set; }

        /// <summary>
        /// Gets or sets end date of user searh parameter.
        /// </summary>
        [JsonProperty("endDate")]
        public string EndDate { get; set; }
    }
}