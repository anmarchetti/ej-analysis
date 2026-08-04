namespace easyJet.Feature.Tracker.Models.Eskel
{
    public class Guest
    {
        public int ReservationId { get; set; }

        public int Sequence { get; set; }

        public bool IsLeadPassenger { get; set; }

        public string Title { get; set; }

        public string Forename { get; set; }

        public string Surname { get; set; }

        public int Age { get; set; }

        public PassengerType? PassengerType { get; set; }
    }
}