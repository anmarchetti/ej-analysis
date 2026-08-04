using System;
using System.Linq;
using System.Linq.Expressions;
using easyJet.Foundation.XConnect.Common.Facets.Booking;
using Sitecore.Framework.Rules;
using Sitecore.XConnect;
using Sitecore.XConnect.Segmentation.Predicates;

namespace easyJet.Foundation.XConnect.Common.Rules.Segmentation.Bookings
{
    public class WhenContactBookingHasSpecificReservationId : ICondition, IContactSearchQueryFactory
    {
        public string ReservationId { get; set; }

        public bool Evaluate(IRuleExecutionContext context)
        {
            var contact = context.Fact<Contact>();
            var bookings = contact.GetFacet<BookingsFacet>(BookingsFacet.DefaultFacetKey)?.Bookings?.Values;
            return bookings != null && bookings.Any(booking => booking.ReservationId == ReservationId);
        }

        public Expression<Func<Contact, bool>> CreateContactSearchQuery(IContactSearchQueryContext context)
        {
            return contact =>
                contact.GetFacet<BookingsFacet>(BookingsFacet.DefaultFacetKey).Bookings.Values.Any(booking => booking.ReservationId == ReservationId);
        }
    }
}