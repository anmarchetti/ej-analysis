namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    /// <summary>
    /// The kind of change carried by an amend/commit request. Used as the
    /// <c>amendment_type</c> dimension of the ejh.web.amend_booking.count metric
    /// and analytics event.
    /// </summary>
    public enum AmendmentType
    {
        /// <summary>
        /// The amendment could not be classified from the request payload.
        /// </summary>
        Unknown,

        /// <summary>
        /// Change of accommodation (hotel).
        /// </summary>
        Hotel,

        /// <summary>
        /// Change of holiday start date / duration.
        /// </summary>
        Dates,

        /// <summary>
        /// Change of transfers.
        /// </summary>
        Transfer,

        /// <summary>
        /// Change of seat selection.
        /// </summary>
        Seats,

        /// <summary>
        /// Change of room and board.
        /// </summary>
        Room,

        /// <summary>
        /// Change of flights.
        /// </summary>
        Flight,

        /// <summary>
        /// Change of passenger name(s).
        /// </summary>
        Name
    }
}
