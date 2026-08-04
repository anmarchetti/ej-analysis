using System;
using Sitecore.XConnect;

namespace easyJet.Foundation.XConnect.Common.Goals
{
    public class HotelDetails : Goal
    {
        public static Guid HotelPageVisitDefinitionId { get; } = new Guid("5FA62015-671B-42FE-9A7B-E13B76326D0E");

        public HotelDetails(DateTime timestamp)
            : base(HotelPageVisitDefinitionId, timestamp)
        {
        }

        public string AccommodationId { get; set; }

        public string Name { get; set; }

        public string CountryCode { get; set; }

        public string LocationCode { get; set; }

        public string ThemeCode { get; set; }

        public string HighestPriorityTypeCode { get; set; }
    }
}