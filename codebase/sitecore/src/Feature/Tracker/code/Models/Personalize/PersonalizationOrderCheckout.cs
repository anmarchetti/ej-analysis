using System.Collections.Generic;

namespace easyJet.Feature.Tracker.Models.Personalize
{
    public class PersonalizationOrderCheckout
    {
        public string ReferenceId { get; set; }

        public Dictionary<string, string> Experiences { get; set; }

        public decimal Price { get; set; }

        public string CurrencyCode { get; set; }

        public string Status { get; set; }

        public string CardType { get; set; }
    }
}
