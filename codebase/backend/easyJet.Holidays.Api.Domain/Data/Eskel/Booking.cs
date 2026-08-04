namespace easyJet.Holidays.Api.Domain.Data.Eskel
{
    public class Booking
    {
        public Guest[] Guests { get; set; }
        public Flight[] Flights { get; set; }
        public Hotel[] Hotels { get; set; }
        public Transfer[] Transfers { get; set; }
        public Payment[] Payments { get; set; }
        /// <summary>
        /// Make sure to set IncludeMemos to true when sending request to get them
        /// </summary>
        public Memo[] Memos { get; set; }
        public double BookingPrice { get; set; }
        public int ReseverationId { get; set; }
        public DateTime? CreatedDateTime { get; set; }
        public DateTime? ConfirmedDateTime { get; set; }
        public DateTime? CancellationDateTime { get; set; }
        public DateTime? DepartureDate { get; set; }
        public DateTime? ReturnDate { get; set; }
        public string EmailAddress { get; set; }
        public string PhoneNumber { get; set; }
        public string PostCode { get; set; }
        public string BookingStatus { get; set; }
        public string AgentCode { get; set; }
        public string AgentName { get; set; }
    }

    public class Guest
    {
        public int ReseverationId { get; set; }
        public int Seqeuence { get; set; }
        public bool IsLeadPassenger { get; set; }
        public string Title { get; set; }
        public string Forename { get; set; }
        public string Surname { get; set; }
        public int Age { get; set; }
        public string PassengerType { get; set; }
    }

    public class Flight
    {
        public int ReseverationId { get; set; }
        public string FlightNumber { get; set; }
        public string Direction { get; set; }
        public string Source { get; set; }
        public string DepartureAirport { get; set; }
        public string ArrivalAirport { get; set; }
        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }
        public int TotalPax { get; set; }
    }

    public class Hotel
    {
        public int ReseverationId { get; set; }
        public string Code { get; set; }
        public string RoomCode { get; set; }
        public string Name { get; set; }
        public int TotalNights { get; set; }
        public string BoardCode { get; set; }
        public string BoardName { get; set; }
        public string StarRating { get; set; }
    }

    public class Transfer
    {
        public int ReseverationId { get; set; }
        public string Airport { get; set; }
        public DateTime ArrivalTime { get; set; }
        public string Hotel { get; set; }
        public string SupplierCode { get; set; }
        public string SupplierName { get; set; }
        public int TotalPax { get; set; }
    }

    public class Payment
    {
        public int ReseverationId { get; set; }
        public int Sequence { get; set; }
        public DateTime PaymentDate { get; set; }
        public double Amount { get; set; }
        public string CurrencyCode { get; set; }
        public string PaymentMethod { get; set; }
    }

    public class Memo
    {
        public int ReseverationId { get; set; }
        public int Sequence { get; set; }
        public DateTime MemoDate { get; set; }
        public long MemoCodeId { get; set; }
        public string MemoCodeDescription { get; set; }
        public string MemoDescription { get; set; }
        public string MemoDescription2 { get; set; }
    }
}
