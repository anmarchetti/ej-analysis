using System;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Foundation.HotelBeds.Reports.Models
{
    [ExcludeFromCodeCoverage]
    public class ResyncFaciltitesRecord
    {
        public string HotelCode { get; set; }

        public string HotelName { get; set; }

        public DateTime DateTime { get; set; }

        public string Message { get; set; }
    }
}