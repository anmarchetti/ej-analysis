using System;

namespace easyJet.Feature.Tracker.Models.Eskel
{
    public class Flight
    {
        public int ReservationId { get; set; }

        public string FlightNumber { get; set; }

        public DirectionType Direction { get; set; }

        public string Source { get; set; }

        public string DepartureAirport { get; set; }

        public string ArrivalAirport { get; set; }

        public DateTime DepartureTime { get; set; }

        public DateTime ArrivalTime { get; set; }

        public int TotalPax { get; set; }
    }
}