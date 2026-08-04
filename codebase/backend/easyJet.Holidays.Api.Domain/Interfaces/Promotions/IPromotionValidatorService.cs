using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Promotion;

namespace easyJet.Holidays.Api.Domain.Interfaces.Promotions
{
    /// <summary>
    /// Promotion validator service.
    /// </summary>
    public interface IPromotionValidatorService
    {
        /// <summary>
        /// Validate booking criteria and voucher code against sitecore promotion.
        /// </summary>
        /// <param name="validateBookingRequest"></param>
        /// <returns>Validate Promotion.</returns>
        Task<ValidatePromotion> Validate(ValidateBookingRequest validateBookingRequest);

        /// <summary>
        /// Validate booking criteria and voucher code against sitecore promotion using atcom promo code.
        /// </summary>
        /// <param name="validateBookingRequest"></param>
        /// <param name="atcomPromoCode"></param>
        /// <returns>Validate Promotion.</returns>
        Task<ValidatePromotion> ValidateByAtcomPromoCode(Offer offer, string atcomPromoCode, string marketCode);

        /// <summary>
        /// Try to match promocode discouts for list of offers
        /// </summary>
        /// <param name="matchPromocodesRequestBase"></param>
        /// <returns></returns>
        Task<PromocodeDiscount> GetPromocodeDiscountsForOffers(MatchPromocodesRequestBase matchPromocodesRequestBase);

        /// <summary>
        /// Get promotions for the offers
        /// </summary>
        /// <param name="searchOffers">offers to check</param>
        /// <param name="hotels"></param>
        /// <returns></returns>
        Task<SearchOffersResponse> ExtendOffersWithPromotions(SearchOffersResponse searchOffers, IEnumerable<Hotel> hotels);

        /// <summary>
        /// Get promotions for the offers
        /// </summary>
        /// <param name="accomodationOffers">offers to check</param>
        /// <param name="hotels"></param>
        /// <returns></returns>
        Task<AccommodationOffersResponse> ExtendOffersWithPromotions(AccommodationOffersResponse accomodationOffers, IEnumerable<Hotel> hotels);

        /// <summary>
        /// Extend live price model with promotions
        /// </summary>
        /// <param name="livePrice">Model to extend</param>       
        /// <param name="hotels"></param>
        /// <returns></returns>
        Task<IEnumerable<LivePriceSummaryModel>> ExtendOffersWithPromotions(List<LivePriceSummaryModel> livePrice, IEnumerable<Hotel> hotels);
        
        /// <summary>
        /// Get promotions for the package
        /// </summary>
        /// <param name="validateBookingResponse">validate booking response</param>
        /// <param name="validateBookingRequest">validate booking request to get promotions</param>
        /// <returns>>validate booking response</returns>
        Task<ValidateBookingResponse> ExtendValidatePackageWithPromotions(ValidateBookingResponse validateBookingResponse, ValidateBookingRequest validateBookingRequest);

        /// <summary>
        /// Check whether promotion exists in CMS (without validation of configured CMS parameters)
        /// </summary>
        /// <param name="promoCode">Promo code to check</param>
        /// <returns></returns>
        Task<bool> PromoExists(string promoCode);

        /// <summary>
        /// Get correct promocode tier for Atcom
        /// </summary>
        /// <param name="offer"> Offer</param>
        /// <param name="discountCode">Promo code</param>
        /// <returns>Atcom promo code</returns>
        Task<CmsPromocode> GetAtcomPromoCode(Offer offer, string discountCode, string marketCode);
    }
}
