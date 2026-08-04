using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.AWS.SalesforceSync.Models
{
    /// <summary>
    /// Wrapper for the Salesforce flow inputs payload.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class SalesforceRequest
    {
        /// <summary>
        /// Gets or sets the list of input sets to be processed by the Salesforce flow.
        /// </summary>
        [JsonProperty(PropertyName = "inputs")]
        public IEnumerable<Input>? Inputs { get; set; }
    }

    /// <summary>
    /// Represents a single set of inputs for the Salesforce flow, including booking,
    /// hotel, rooms, customer details, passengers, special requests, flights, and memos.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class Input
    {
        
        /// <summary>
        /// Gets or sets the booking details.
        /// </summary>
        [JsonProperty(PropertyName = "booking")]
        public Booking? Booking { get; set; }

        /// <summary>
        /// Gets or sets the hotel information.
        /// </summary>
        [JsonProperty(PropertyName = "hotel")]
        public Hotel? Hotel { get; set; }

        /// <summary>
        /// Gets or sets the collection of room details.
        /// </summary>
        [JsonProperty(PropertyName = "rooms")]
        public IEnumerable<Room>? Rooms { get; set; }

        /// <summary>
        /// Gets or sets the customer personal details.
        /// </summary>
        [JsonProperty(PropertyName = "customerDetails")]
        public CustomerDetails? CustomerDetails { get; set; }

        /// <summary>
        /// Gets or sets the list of passengers.
        /// </summary>
        [JsonProperty(PropertyName = "passengers")]
        public IEnumerable<Passenger>? Passengers { get; set; }

        /// <summary>
        /// Gets or sets any special requests made by the customer.
        /// </summary>
        [JsonProperty(PropertyName = "specialRequests")]
        public IEnumerable<SpecialRequest>? SpecialRequests { get; set; }

        /// <summary>
        /// Gets or sets the flight itinerary information.
        /// </summary>
        [JsonProperty(PropertyName = "flights")]
        public IEnumerable<Flight>? Flights { get; set; }

        /// <summary>
        /// Gets or sets additional memos attached to the booking.
        /// </summary>
        [JsonProperty(PropertyName = "memos")]
        public IEnumerable<Memo>? Memos { get; set; }
    }

    /// <summary>
    /// Contains basic booking information such as reservation, status, and dates.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class Booking
    {
        /// <summary>Gets or sets the unique reservation identifier.</summary>
        [JsonProperty(PropertyName = "reservationId")]
        public string? ReservationId { get; set; }

        /// <summary>Gets or sets the current booking status.</summary>
        [JsonProperty(PropertyName = "bookingStatus")]
        public string? BookingStatus { get; set; }

        /// <summary>Gets or sets the agent identifier who created the booking.</summary>
        [JsonProperty(PropertyName = "agent")]
        public string? Agent { get; set; }

        /// <summary>Gets or sets the agent's name.</summary>
        [JsonProperty(PropertyName = "agentname")]
        public string? AgentName { get; set; }

        /// <summary>Gets or sets the version identifier of the booking.</summary>
        [JsonProperty(PropertyName = "versionId")]
        public string? VersionId { get; set; }

        /// <summary>Gets or sets the market code.</summary>
        [JsonProperty(PropertyName = "market")]
        public string? Market { get; set; }

        /// <summary>Gets or sets the language code.</summary>
        [JsonProperty(PropertyName = "language")]
        public string? Language { get; set; }

        /// <summary>Gets or sets the number of adult passengers.</summary>
        [JsonProperty(PropertyName = "adults")]
        public int? Adults { get; set; }

        /// <summary>Gets or sets the number of child passengers.</summary>
        [JsonProperty(PropertyName = "children")]
        public int? Children { get; set; }

        /// <summary>Gets or sets the number of infant passengers.</summary>
        [JsonProperty(PropertyName = "infants")]
        public int? Infants { get; set; }

        /// <summary>Gets or sets the holiday arrival date.</summary>
        [JsonProperty(PropertyName = "holidayArrivalDate")]
        public DateTime? HolidayArrivalDate { get; set; }

        /// <summary>Gets or sets the holiday departure date.</summary>
        [JsonProperty(PropertyName = "holidayDepartureDate")]
        public DateTime? HolidayDepartureDate { get; set; }

        /// <summary>Gets or sets the total duration of the holiday.</summary>
        [JsonProperty(PropertyName = "duration")]
        public string? Duration { get; set; }

        /// <summary>Gets or sets the origin of the booking.</summary>
        [JsonProperty(PropertyName = "bookingOrigin")]
        public string? BookingOrigin { get; set; }

        /// <summary>Gets or sets the country code for the holiday destination.</summary>
        [JsonProperty(PropertyName = "country")]
        public string? Country { get; set; }

        /// <summary>Gets or sets the transfer type included with the booking.</summary>
        [JsonProperty(PropertyName = "transfer")]
        public string? Transfer { get; set; }

        /// <summary>Gets or sets the type of holiday package.</summary>
        [JsonProperty(PropertyName = "holidayType")]
        public string? HolidayType { get; set; }

        /// <summary>Gets or sets the board type (meal plan).</summary>
        [JsonProperty(PropertyName = "board")]
        public string? Board { get; set; }

        /// <summary>Gets or sets the total booking amount.</summary>
        [JsonProperty(PropertyName = "bookingAmount")]
        public decimal? BookingAmount { get; set; }

        /// <summary>Gets or sets the last updated timestamp.</summary>
        [JsonProperty(PropertyName = "updatedDate")]
        public DateTime? UpdatedDate { get; set; }

        /// <summary>Gets or sets the creation timestamp.</summary>
        [JsonProperty(PropertyName = "createdDate")]
        public DateTime? CreatedDate { get; set; }

        /// <summary>Gets or sets the currency code for the booking.</summary>
        [JsonProperty(PropertyName = "currencyCode")]
        public string? CurrencyCode { get; set; }

        /// <summary>Gets or sets the trade email associated with the booking.</summary>
        [JsonProperty(PropertyName = "trade_email")]
        public string? TradeEmail { get; set; }

        /// <summary>Gets or sets whether the booking is non-refundable.</summary>
        [JsonProperty(PropertyName = "nonRefundable")]
        public bool? NonRefundable { get; set; }
    }

    /// <summary>
    /// Represents a physical mailing address.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class Address
    {
        
        /// <summary>Gets or sets the street name.</summary>
        [JsonProperty(PropertyName = "street")]
        public string? Street { get; set; }
        /// <summary>Gets or sets the postal zip code.</summary>
        [JsonProperty(PropertyName = "zipcode")]
        public string? ZipCode { get; set; }
        /// <summary>Gets or sets the city name.</summary>
        [JsonProperty(PropertyName = "city")]
        public string? City { get; set; }
        /// <summary>Gets or sets the ISO country code.</summary>
        [JsonProperty(PropertyName = "countryISOCode")]
        public string? CountryIsoCode { get; set; }
        /// <summary>Gets or sets the recipient name.</summary>
        [JsonProperty(PropertyName = "name")]
        public string? Name { get; set; }
        /// <summary>Gets or sets the house number.</summary>
        [JsonProperty(PropertyName = "houseNo")]
        public string? HouseNo { get; set; }
        /// <summary>Gets or sets the company or care-of line.</summary>
        [JsonProperty(PropertyName = "co")]
        public string? Co { get; set; }
        /// <summary>Gets or sets the regional subdivision (state/province).</summary>
        [JsonProperty(PropertyName = "region")]
        public string? Region { get; set; }
        /// <summary>Gets or sets the post office box number.</summary>
        [JsonProperty(PropertyName = "poBox")]
        public string? PoBox { get; set; }
        /// <summary>Gets or sets the PO box zip code.</summary>
        [JsonProperty(PropertyName = "poBoxZipCode")]
        public string? PoBoxZipCode { get; set; }
        /// <summary>Gets or sets the PO box city.</summary>
        [JsonProperty(PropertyName = "poBoxCity")]
        public string? PoBoxCity { get; set; }
    }

    /// <summary>
    /// Captures the primary customer details associated with a booking.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class CustomerDetails
    {
        
        /// <summary>Gets or sets the unique customer identifier.</summary>
        [JsonProperty(PropertyName = "customerID")]
        public string? CustomerId { get; set; }
        /// <summary>Gets or sets whether multiple customers are present.</summary>
        [JsonProperty(PropertyName = "morethanonepresent")]
        public bool? MoreThanOnePresent { get; set; }
        /// <summary>Gets or sets the customer's first name.</summary>
        [JsonProperty(PropertyName = "fName")]
        public string? FirstName { get; set; }
        /// <summary>Gets or sets the customer's last name.</summary>
        [JsonProperty(PropertyName = "lName")]
        public string? LastName { get; set; }
        /// <summary>Gets or sets the customer's title (Mr/Ms/etc.).</summary>
        [JsonProperty(PropertyName = "title")]
        public string? Title { get; set; }
        /// <summary>Gets or sets the customer's address.</summary>
        [JsonProperty(PropertyName = "address")]
        public Address? Address { get; set; }
        /// <summary>Gets or sets whether multiple addresses are present.</summary>
        [JsonProperty(PropertyName = "morethanoneaddresspresent")]
        public bool? MoreThanOneAddressPresent { get; set; }
        /// <summary>Gets or sets the list of customer email addresses.</summary>
        [JsonProperty(PropertyName = "email")]
        public IEnumerable<Email>? Email { get; set; }
        /// <summary>Gets or sets the mobile number.</summary>
        [JsonProperty(PropertyName = "mobilenumber")]
        public string? MobileNumber { get; set; }
        /// <summary>Gets or sets the phone number.</summary>
        [JsonProperty(PropertyName = "phonenumber")]
        public string? PhoneNumber { get; set; }
        /// <summary>Gets or sets the telco number.</summary>
        [JsonProperty(PropertyName = "telconumber")]
        public string? TelcoNumber { get; set; }
        /// <summary>Gets or sets whether multiple numbers of a single type are present.</summary>
        [JsonProperty(PropertyName = "morethanoneofasingletypeofnumberpresent")]
        public bool? MoreThanOneOfASingleTypeOfNumberPresent { get; set; }
    }

    /// <summary>
    /// Represents an email contact entry for a customer.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class Email
    {
        
        /// <summary>Gets or sets the type of email (e.g., "Work", "Personal").</summary>
        [JsonProperty(PropertyName = "type")]
        public string? Type { get; set; }
        /// <summary>Gets or sets the email address.</summary>
        [JsonProperty(PropertyName = "emailAddress")]
        public string? EmailAddress { get; set; }
    }

    /// <summary>
    /// Contains flight segment information for outbound or inbound journeys.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class Flight
    {
        
        /// <summary>Gets or sets the flight number.</summary>
        [JsonProperty(PropertyName = "flightNumber")]
        public string? FlightNumber { get; set; }
        /// <summary>Gets or sets the departure airport code.</summary>
        [JsonProperty(PropertyName = "flightFrom")]
        public string? FlightFrom { get; set; }
        /// <summary>Gets or sets the arrival airport code.</summary>
        [JsonProperty(PropertyName = "flightTo")]
        public string? FlightTo { get; set; }
        /// <summary>Gets or sets the departure timestamp with offset.</summary>
        [JsonProperty(PropertyName = "departureTime")]
        public DateTimeOffset? DepartureTime { get; set; }
        /// <summary>Gets or sets the arrival timestamp with offset.</summary>
        [JsonProperty(PropertyName = "arrivalTime")]
        public DateTimeOffset? ArrivalTime { get; set; }
        /// <summary>Gets or sets the flight direction (Outbound/Return).</summary>
        [JsonProperty(PropertyName = "direction")]
        public string? Direction { get; set; }
        /// <summary>Gets or sets an external reference code if available.</summary>
        [JsonProperty(PropertyName = "externalReferenceCode")]
        public string? ExternalReferenceCode { get; internal set; }
    }

    /// <summary>
    /// Represents hotel booking information.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class Hotel
    {
        
        /// <summary>Gets or sets the hotel name.</summary>
        [JsonProperty(PropertyName = "name")]
        public string? Name { get; set; }
        /// <summary>Gets or sets the hotel code.</summary>
        [JsonProperty(PropertyName = "code")]
        public string? Code { get; set; }
        /// <summary>Gets or sets the hotel country.</summary>
        [JsonProperty(PropertyName = "country")]
        public string? Country { get; set; }
        /// <summary>Gets or sets the partner reservation number.</summary>
        [JsonProperty(PropertyName = "partnerReservationNumber")]
        public string? PartnerReservationNumber { get; set; }
        /// <summary>Gets or sets whether multiple hotel entries are present.</summary>
        [JsonProperty(PropertyName = "morethanonepresent")]
        public bool? MoreThanOnePresent { get; set; }
        /// <summary>Gets or sets whether an ad-hoc booking is present.</summary>
        [JsonProperty(PropertyName = "adhocbookingpresent")]
        public bool? AdhocBookingPresent { get; set; }
    }

    /// <summary>
    /// Represents a memo or note attached to the booking.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class Memo
    {
        
        /// <summary>Gets or sets the memo type.</summary>
        [JsonProperty(PropertyName = "type")]
        public string? Type { get; set; }
        /// <summary>Gets or sets the memo code.</summary>
        [JsonProperty(PropertyName = "code")]
        public string? Code { get; set; }
        /// <summary>Gets or sets the memo content text.</summary>
        [JsonProperty(PropertyName = "content")]
        public string? Content { get; set; }
        /// <summary>Gets or sets the date and time the memo was created.</summary>
        [JsonProperty(PropertyName = "memoDateTime")]
        public DateTime? MemoDateTime { get; set; }
    }

    /// <summary>
    /// Represents a single passenger in the booking.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class Passenger
    {
        
        /// <summary>Gets or sets the passenger's first name.</summary>
        [JsonProperty(PropertyName = "firstName")]
        public string? FirstName { get; set; }
        /// <summary>Gets or sets the passenger's last name.</summary>
        [JsonProperty(PropertyName = "lastName")]
        public string? LastName { get; set; }
        /// <summary>Gets or sets the passenger number in the cabin sequence.</summary>
        [JsonProperty(PropertyName = "paxNumber")]
        public int? PaxNumber { get; set; }
        /// <summary>Gets or sets whether this passenger is the lead name.</summary>
        [JsonProperty(PropertyName = "islead")]
        public bool? IsLead { get; set; }
    }

    /// <summary>
    /// Represents a room type included in the booking.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class Room
    {
        
        /// <summary>Gets or sets the room type code.</summary>
        [JsonProperty(PropertyName = "code")]
        public string? Code { get; set; }
        /// <summary>Gets or sets the room type name.</summary>
        [JsonProperty(PropertyName = "name")]
        public string? Name { get; set; }
    }

    /// <summary>
    /// Represents a special request code and description.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class SpecialRequest
    {
        /// <summary>Gets or sets the special request code.</summary>
        [JsonProperty(PropertyName = "code")]
        public string? Code { get; set; }
        /// <summary>Gets or sets the request description.</summary>
        [JsonProperty(PropertyName = "name")]
        public string? Name { get; set; }
    }
}