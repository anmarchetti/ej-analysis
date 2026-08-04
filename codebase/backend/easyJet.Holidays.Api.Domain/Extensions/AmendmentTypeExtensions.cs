using easyJet.Holidays.Api.Domain.Data.AmendBooking;

namespace easyJet.Holidays.Api.Domain.Extensions
{
    /// <summary>
    /// Classifies an amend/commit request into a single <see cref="AmendmentType"/>.
    /// </summary>
    /// <remarks>
    /// This reimplements the legacy ELK dashboard rules that used to match the raw
    /// request body. Hotel and date changes are checked first because their payloads
    /// also carry the fields used by the other change types (a date change includes the
    /// full target offer with transport/transfers/units; a hotel change nests those under
    /// <c>amendHotelOffer</c>). Checking them first reproduces the original
    /// "AND NOT (offer.date OR amendHotelOffer)" exclusions.
    /// </remarks>
    public static class AmendmentTypeExtensions
    {
        /// <summary>
        /// Determines the amendment type for the given request using a priority-ordered
        /// set of checks (first match wins).
        /// </summary>
        /// <param name="request">The amend/commit request.</param>
        /// <returns>The resolved <see cref="AmendmentType"/>, or <see cref="AmendmentType.Unknown"/>.</returns>
        public static AmendmentType ResolveAmendmentType(this AmendInfoBookingRequest request)
        {
            if (request == null)
            {
                return AmendmentType.Unknown;
            }

            if (request.AmendHotelOffer != null)
            {
                return AmendmentType.Hotel;
            }

            if (request.Offer?.Date != null)
            {
                return AmendmentType.Dates;
            }

            if (!request.Transfers.IsNullOrEmpty())
            {
                return AmendmentType.Transfer;
            }

            if (!request.SeatSelection.IsNullOrEmpty())
            {
                return AmendmentType.Seats;
            }

            if (!request.Units.IsNullOrEmpty())
            {
                return AmendmentType.Room;
            }

            if (request.Transport != null)
            {
                return AmendmentType.Flight;
            }

            if (!request.Pax.IsNullOrEmpty())
            {
                return AmendmentType.Name;
            }

            return AmendmentType.Unknown;
        }

        /// <summary>
        /// Maps an <see cref="AmendmentType"/> to the string label used for the
        /// <c>amendment_type</c> metric dimension and analytics property.
        /// </summary>
        public static string ToMetricLabel(this AmendmentType type) => type switch
        {
            AmendmentType.Hotel => "hotel",
            AmendmentType.Dates => "dates",
            AmendmentType.Transfer => "transfer",
            AmendmentType.Seats => "seats",
            AmendmentType.Room => "room",
            AmendmentType.Flight => "flight",
            AmendmentType.Name => "name",
            _ => "unknown"
        };
    }
}
