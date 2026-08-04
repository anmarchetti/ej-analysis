using System;
using Newtonsoft.Json;

namespace easyJet.Feature.Tracker.Models.Eskel
{
    public class Payment
    {
        [JsonProperty("reseverationId")]
        public string ReservationId { get; set; }

        public int Sequence { get; set; }

        public DateTime? PaymentDate { get; set; }

        public decimal Amount { get; set; }

        public string CurrencyCode { get; set; }

        public string PaymentMethod { get; set; }
    }
}