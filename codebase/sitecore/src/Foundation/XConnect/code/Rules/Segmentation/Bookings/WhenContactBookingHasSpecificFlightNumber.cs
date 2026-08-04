using System;
using System.Linq;
using System.Linq.Expressions;
using easyJet.Foundation.XConnect.Common.Facets.Booking;
using Sitecore.Framework.Rules;
using Sitecore.XConnect;
using Sitecore.XConnect.Segmentation.Predicates;

namespace easyJet.Foundation.XConnect.Common.Rules.Segmentation.Bookings
{
    public class WhenContactBookingHasSpecificFlightNumber : ICondition, IContactSearchQueryFactory
    {
        public string FlightNumber { get; set; }

        public bool Evaluate(IRuleExecutionContext context)
        {
            var contact = context.Fact<Contact>();
            var bookings = contact.GetFacet<BookingsFacet>(BookingsFacet.DefaultFacetKey)?.Bookings?.Values;
            return bookings != null && bookings.Any(booking => booking.Flights.Any(flight => flight.Number == FlightNumber));
        }

        public Expression<Func<Contact, bool>> CreateContactSearchQuery(IContactSearchQueryContext context)
        {
            return contact =>
                contact.GetFacet<BookingsFacet>(BookingsFacet.DefaultFacetKey).Bookings.Values.Any(booking => booking.Flights.Any(flight => flight.Number == FlightNumber));
        }
    }
}