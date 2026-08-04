using System;
using System.Collections.Generic;

namespace easyJet.Foundation.Atcom.Models.Domain
{
    public class SeasonalFacilities
    {
        /// <summary>
        /// Gets or sets facility code.
        /// </summary>
        public string FacilityCode { get; set; }

        /// <summary>
        /// Gets or sets seasonal facilities date range.
        /// </summary>
        public List<DateRange> DateRanges { get; set; }
    }
}