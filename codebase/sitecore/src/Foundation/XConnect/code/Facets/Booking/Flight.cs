using System;

namespace easyJet.Foundation.XConnect.Common.Facets.Booking
{
    [Serializable]
    public class Flight
    {
        public string Number { get; set; }

        public string From { get; set; }

        public string To { get; set; }

        public bool IsOutboundDirection { get; set; }

        public DateTime DepartureTime { get; set; }

        public DateTime ArrivalTime { get; set; }
    }
}