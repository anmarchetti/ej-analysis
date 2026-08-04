using easyJet.Holidays.Api.Domain.Data;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.RequestedPrice;

namespace easyJet.Holidays.Api.Domain.Services.Offers
{
    /// <summary>
    /// Prices service
    /// </summary>
    public interface IPricesService
    {
        /// <summary>
        /// Round Price and PricePP using Math.Ceiling
        /// </summary>
        /// <param name="items">Collection of items to update</param>
        void RoundPrice(IEnumerable<IPriceModel> items);

        /// <summary>
        /// Round Price and PricePP using Math.Ceiling 
        /// </summary>
        /// <param name="item">Item to update</param>
        void RoundPrice(IPriceTotalModel item);

        /// <summary>
        /// Round <see cref="SearchOffersResponse"/>:
        /// - Offers (including AltBoards, Units, Transfers)
        /// - Status
        /// </summary>
        /// <param name="response">Item to update</param>
        void RoundPrice(SearchOffersResponse response);

        /// <summary>
        /// Round offer price inclugin AltBoards, Units, Transfers
        /// </summary>
        /// <param name="offers">Offers to update</param>
        void RoundPrice(IEnumerable<Offer> offers);

        /// <summary>
        /// Round live price models
        /// </summary>
        /// <param name="models">Live price items</param>
        void RoundPrice(IEnumerable<LivePriceSummaryModel> models);

        /// <summary>
        /// Round requested price models
        /// </summary>
        /// <param name="models">requested price items</param>
        void RoundPrice(IEnumerable<RequestedPriceSummaryModel> models);

        /// <summary>
        /// Round price category model
        /// </summary>
        /// <param name="model">Price category</param>
        void RoundPrice(PriceCategory model);

        /// <summary>
        /// Round specific value
        /// </summary>
        /// <param name="value">Value to round</param>
        /// <returns></returns>
        decimal RoundPrice(decimal value);

        /// <summary>
        /// Round specific value
        /// </summary>
        /// <param name="value">Value to round</param>
        decimal? RoundPrice(decimal? value);
    }
}
