using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace easyJet.Feature.Tracker.Models.Eskel
{
    public class Booking
    {
        [JsonProperty("reseverationId")]
        public string ReservationId { get; set; }

        public DateTime? CreatedDateTime { get; set; }

        public DateTime? ConfirmedDateTime { get; set; }

        public DateTime? CancellationDateTime { get; set; }

        public DateTime? DepartureDate { get; set; }

        public DateTime? ReturnDate { get; set; }

        public string EmailAddress { get; set; }

        public string PhoneNumber { get; set; }

        public string PostCode { get; set; }

        public string AgentName { get; set; }

        public BookingStatus BookingStatus { get; set; }

        public IReadOnlyCollection<Flight> Flights { get; set; }

        public IReadOnlyCollection<Guest> Guests { get; set; }

        public IReadOnlyCollection<Hotel> Hotels { get; set; }

        public IReadOnlyCollection<Transfer> Transfers { get; set; }

        public IReadOnlyCollection<Payment> Payments { get; set; }
    }
}