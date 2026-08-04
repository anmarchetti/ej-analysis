using easyJet.Holidays.Api.Domain.Data;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Interfaces.AmendBooking
{
    /// <summary>
    /// Inteface with properties used in sorting strategy
    /// </summary>
    public interface ISortableOffer : IPriceModel
    {
        /// <summary>
        /// Offer transport data
        /// </summary>
        Transport Transport { get; set; }
        /// <summary>
        /// Total price modified by promocode value
        /// </summary>
        decimal ModifiedPrice { get; set; }
    }
}