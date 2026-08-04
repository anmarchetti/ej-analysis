using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Services.Offers
{
    public interface IHotelOfferService
    {
        /// <summary>
        /// If transfer code is not synthetic and not default we should replace offer transfer with specified code
        /// </summary>
        /// <param name="offer"></param>
        /// <param name="transferCode"></param>
        /// <returns>Whether offer transfer was updated or not</returns>
        bool SetOfferTransfer(Offer offer, string transferCode);

        /// <summary>
        /// Recalculates offer price based on transfer
        /// Atcom can't give us price for selected transfer, only for default from cache.
        /// If we need offer with non-default transfer we should validate package (do slow request)
        /// </summary>
        /// <param name="offer"></param>
        /// <returns></returns>
        Task RecalculateOfferPriceWithTransfer(Offer offer);

        /// <summary>
        /// Enrich offer with cms data.
        /// </summary>
        /// <param name="offers">Offer</param>
        /// <returns>Enriched offer.</returns>
        Task<Offer> EnrichOfferWithCmsHotelData(Offer offers);
        Task EnrichHotelData(Offer offer);
    }
}