using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Services.Extras
{
    /// <summary>
    /// Teansfers service
    /// </summary>
    public interface IExtrasService
    {
        /// <summary>
        /// Get alternative transfer options.
        /// If original offer has transfer returns also option to not include transfer: No Shared or No Private
        /// </summary>
        /// <param name="offer"></param>
        /// <returns></returns>
        Task<OfferExtras> Get(Offer offer);
    }
}
