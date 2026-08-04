using System;
using System.Linq;
using System.Linq.Expressions;
using easyJet.Foundation.XConnect.Common.Facets.Booking;
using Sitecore.Framework.Rules;
using Sitecore.XConnect;
using Sitecore.XConnect.Segmentation.Predicates;

namespace easyJet.Foundation.XConnect.Common.Rules.Segmentation.Bookings
{
    public class WhenContactBookingHasSpecificHotelName : ICondition, IContactSearchQueryFactory
    {
        public string HotelName { get; set; }

        public StringOperationType Comparison { get; set; }

        public bool Evaluate(IRuleExecutionContext context)
        {
            var contact = context.Fact<Contact>();
            var bookings = contact.GetFacet<BookingsFacet>(BookingsFacet.DefaultFacetKey)?.Bookings?.Values;
            return bookings != null && bookings.Any(booking => Comparison.Evaluate(booking.Accommodation.Name, HotelName));
        }

        public Expression<Func<Contact, bool>> CreateContactSearchQuery(IContactSearchQueryContext context)
        {
            return contact =>
                contact.GetFacet<BookingsFacet>(BookingsFacet.DefaultFacetKey).Bookings.Values.Any(booking => Comparison.Evaluate(booking.Accommodation.Name, HotelName));
        }
    }
}