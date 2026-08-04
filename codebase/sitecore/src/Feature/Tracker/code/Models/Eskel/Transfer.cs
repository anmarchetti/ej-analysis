using System;

namespace easyJet.Feature.Tracker.Models.Eskel
{
    public class Transfer
    {
        public int ReservationId { get; set; }

        public string Airport { get; set; }

        public DateTime? ArrivalTime { get; set; }

        public string Hotel { get; set; }

        public string SupplierCode { get; set; }

        public string SupplierName { get; set; }

        public int TotalPax { get; set; }
    }
}