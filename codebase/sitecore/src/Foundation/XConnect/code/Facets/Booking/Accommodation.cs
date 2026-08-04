using System;

namespace easyJet.Foundation.XConnect.Common.Facets.Booking
{
    [Serializable]
    public class Accommodation
    {
        public string Id { get; set; }

        public string Name { get; set; }

        public string Resort { get; set; }

        public string Region { get; set; }

        public string Country { get; set; }
    }
}