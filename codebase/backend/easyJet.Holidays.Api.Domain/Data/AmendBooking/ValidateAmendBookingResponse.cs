using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    /// <summary>
    /// Validate amend booking response
    /// </summary>
    public class ValidateAmendBookingResponse : ValidateBookingResponse
    {
        /// <summary>
        /// Lead passenger details
        /// </summary>
        public LeadPassenger LeadPassenger { get; set; }

        /// <summary>
        /// Offer routes
        /// </summary>
        public Transport Transport { get; set; }

        /// <summary>
        /// Duration of the booking
        /// </summary>
        public int Duration { get; set; }

        /// <summary>
        /// DateTime when a booking was made, isn't affected by amends
        /// </summary>
        [IgnoreDataMember]
        public DateTimeOffset BookingDate { get; init; }
    }
}