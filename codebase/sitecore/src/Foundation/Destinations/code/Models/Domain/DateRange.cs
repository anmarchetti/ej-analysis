using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    /// <summary>
    /// Date range between two dates.
    /// </summary>
    public class DateRange
    {
        /// <summary>
        /// Gets or sets start date.
        /// </summary>
        public string Start { get; set; }

        /// <summary>
        /// Gets or sets end date.
        /// </summary>
        public string End { get; set; }
    }
}