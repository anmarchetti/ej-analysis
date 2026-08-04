using easyJet.Holidays.Api.Domain.Data.Guests;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    public class AmendPersonWithDetails : PersonWithDetails
    {
        /// <summary>
        /// Gets or sets a value indicating whether passenger information was amend.
        /// </summary>
        /// <value>
        ///   <c>true</c> if passenger information was amend; otherwise, <c>false</c>.
        /// </value>
        public bool PaxNameChanged { get; set; }
    }
}