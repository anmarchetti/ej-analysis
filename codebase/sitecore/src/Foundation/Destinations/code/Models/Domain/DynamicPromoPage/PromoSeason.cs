using System;
using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Domain.DynamicPromoPage
{
    public class PromoSeason
    {
        public string Name { get; set; }

        public DateTime StartDateTime { get; set; }

        public DateTime EndDateTime { get; set; }

        public List<PromoPage> PromoPages { get; set; }

        public bool IsValid() => StartDateTime <= DateTime.Now && EndDateTime >= DateTime.Now;
    }
}
