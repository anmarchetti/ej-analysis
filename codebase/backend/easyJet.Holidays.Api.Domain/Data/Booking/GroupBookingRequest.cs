using Amazon.DynamoDBv2.DataModel;
using easyJet.Holidays.Api.Domain.Data.Attributes;
using easyJet.Holidays.Api.Domain.Data.Common.DataAnnotations;
using easyJet.Holidays.Api.Domain.Utils.Aws;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    /// <summary>
    /// Group booking request. is being made when there are more, than 9 passengers to book a holiday for
    /// </summary>
    public class GroupBookingRequest
    {
        /// <summary>
        /// Trade agent, who makes the booking request
        /// </summary>
        [Required]
        [StringLength(32)]
        [RegularExpression("^[- \\w\\d]+$")]
        public string AgentName { get; set; }

        /// <summary>
        /// Trade agent's contact email
        /// </summary>
        [Required]
        [StringLength(256)]
        [ValidEmail]
        public string Email { get; set; }

        /// <summary>
        /// Association of British Travel Agents number, which is assigned to all Trade agents, who joined it
        /// </summary>
        [Required]
        [RegularExpression("^\\d+$")]
        public string ABTANumber { get; set; }

        /// <summary>
        /// Number of rooms, desired for the booking. 0 means "I don't mind"
        /// </summary>
        [Range(0, 20)]
        public int NumberOfRooms { get; set; }

        /// <summary>
        /// Total passengers count by passenger type
        /// </summary>
        public TotalPassengers TotalPassengers { get; set; }

        /// <summary>
        /// Departure airport
        /// </summary>
        [Required]
        public DepartureAirport DepartureAirport { get; set; }

        /// <summary>
        /// Departure date
        /// </summary>
        [ValidDepartureDate]
        public DateTime DepartureDate { get; set; }

        /// <summary>
        /// Duration of the holiday
        /// </summary>
        [Range(1, 28)]
        public int DurationOfHoliday { get; set; }

        /// <summary>
        /// Board basis. no business info on this field was provided
        /// </summary>
        [Required]
        public string BoardBasis { get; set; }

        /// <summary>
        /// The desired hotel or at least region, containing hotels, which could provide the accomodation for all the requested passengers
        /// </summary>
        [Required]
        [RegularExpression("^[ \\w,]+$")]
        public string DestinationHotelOrRegion { get; set; }

        /// <summary>
        /// Additional details for the request
        /// </summary>
        [StringLength(200)]
        [RegularExpression("^[\\w\\s,-.]*$")]
        public string AdditionalDetails { get; set; }

        /// <summary>
        /// List of rooms. should be populated, when NumberOfRooms is set to value other, than 0
        /// </summary>
        public List<GroupBookingRoom> Rooms { get; set; }
    }

    /// <summary>
    /// Total passengers counts for group booking, split by passenger type
    /// </summary>
    public class TotalPassengers
    {
        /// <summary>
        /// Adult count
        /// </summary>
        [Range(1, 60)]
        public int Adults { get; set; }

        /// <summary>
        /// Children count
        /// </summary>
        [Range(0, 60)]
        public int Children { get; set; }

        /// <summary>
        /// Infants count
        /// </summary>
        [Range(0, 60)]
        public int Infants { get; set; }
    }

    /// <summary>
    /// Departure airport
    /// </summary>
    public class DepartureAirport
    {
        /// <summary>
        /// Airport code
        /// </summary>
        [StringLength(int.MaxValue, MinimumLength = 1)]
        public string Airport { get; set; }

        /// <summary>
        /// Whether the departure could take place not at the same exact datetime, the booking is made for
        /// </summary>
        [DynamoDBProperty(typeof(BooleanConverter))]
        public bool IAmFlexible { get; set; }
    }

    /// <summary>
    /// Room accommodation with passengers data
    /// </summary>
    public class GroupBookingRoom
    {
        /// <summary>
        /// Room number. used for ordering
        /// </summary>
        [Range(1, 20)]
        public int RoomNumber { get; set; }

        /// <summary>
        /// Adults count for the room
        /// </summary>
        [Range(1, 60)]
        public int Adults { get; set; }

        /// <summary>
        /// Children count for the room
        /// </summary>
        [Range(0, 60)]
        public int Children { get; set; }

        /// <summary>
        /// Ages for all children (not for infants)
        /// </summary>
        public List<int> ChildAges { get; set; } = new List<int>();

        /// <summary>
        /// Infants count for the room
        /// </summary>
        [Range(0, 60)]
        public int Infants { get; set; }
    }


}