using System;
using System.Collections.Generic;

namespace easyJet.Foundation.XConnect.Common.Facets.Booking
{
    [Serializable]
    public class Booking
    {
        public string ReservationId { get; set; }

        public string Status { get; set; }

        public int VersionId { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        public int AdultsCount { get; set; }

        public int ChildrenCount { get; set; }

        public int InfantsCount { get; set; }

        public List<string> Transfers { get; set; }

        public string Theme { get; set; }

        public string Type { get; set; }

        public Accommodation Accommodation { get; set; }

        public List<Flight> Flights { get; set; }

        public decimal TotalAmount { get; set; }

        public DateTime BookingStartDate { get; set; }

        public DateTime BookingEndDate { get; set; }

        public string MarketCode { get; set; }

        public string Currency { get; set; }

        public string Language { get; set; }
    }
}