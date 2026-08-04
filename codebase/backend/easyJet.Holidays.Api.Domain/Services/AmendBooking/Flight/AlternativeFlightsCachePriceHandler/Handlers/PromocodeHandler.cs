using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Data.Promotion;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Promotions;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler.Handlers
{
    /// <summary>
    /// we have price tier for discount code
    /// so we should calculate discount amount for this changes
    /// </summary>
    public class PromocodeHandler : IFlightCachePriceHandler
    {
        private readonly IPromotionValidatorService _promotionValidatorService;
        /// <summary>
        /// ctor
        /// </summary>
        public PromocodeHandler(IPromotionValidatorService promotionValidatorService)
        {
            _promotionValidatorService = promotionValidatorService;
        }

        /// <inheritdoc />
        public async Task Handle(AlternativeFlightsCachePriceCalculationContext context)
        {
            if (!string.IsNullOrEmpty(context.AmendFlightSearchRequest?.DiscountCode))
                await UpdateAlternativeFlightPriceWithPromoCodes(context.AmendFlightSearchRequest, context.AlternativeFlightOffers);
        }

        /// <summary>
        /// If booking contains promo code we should enrich package price with discount.
        /// Discount amount calculate by sitecore rules. 
        /// </summary>
        /// <param name="alternativeFlightsSearchRequest">Alternative flight search request.</param>
        /// <param name="offers">Available offers.</param>
        /// <returns>Modified offers.</returns>
        private async Task UpdateAlternativeFlightPriceWithPromoCodes(
            AmendFlightSearchRequest alternativeFlightsSearchRequest,
            List<AlternativeFlightOffer> offers)
        {
            var request = new MatchPromocodesRequestBase
            {
                VoucherCode = alternativeFlightsSearchRequest.DiscountCode,
                MarketCode = alternativeFlightsSearchRequest.MarketCode,
                ValidateBookingRequests = offers
            };

            var promocodeValues = await _promotionValidatorService.GetPromocodeDiscountsForOffers(request);
            if (promocodeValues?.PromocodeDiscounts.IsNullOrEmpty() == false)
            {
                ModifyPrices(alternativeFlightsSearchRequest, offers, promocodeValues);
            }
        }

        /// <summary>
        /// Calculate discount amount.
        /// </summary>
        /// <param name="amendFlightSearchRequest">Current booking information.</param>
        /// <param name="offers">Available offers.</param>
        /// <param name="promocodeValues">Available promo codes for booking</param>
        private void ModifyPrices(AmendFlightSearchRequest amendFlightSearchRequest, List<AlternativeFlightOffer> offers, PromocodeDiscount promocodeValues)
        {
            var NAdults = amendFlightSearchRequest.Adults();
            var NChildren = amendFlightSearchRequest.Children();

            foreach (var offer in offers)
            {
                promocodeValues.PromocodeDiscounts.TryGetValue(offer.Id, out PromocodeDiscounts promocodeValue);

                if (promocodeValue is null)
                {
                    continue;
                }

                if (promocodeValue.DiscountAmountPerBooking > 0)
                {
                    offer.DiscountAmount += promocodeValue.DiscountAmountPerBooking;
                }

                if (promocodeValue.PercentageDiscountPerBooking > 0)
                {
                    offer.DiscountAmount += offer.Price * (promocodeValue.PercentageDiscountPerBooking / 100);
                }

                if (promocodeValue.AdultDiscountAmountPerPerson > 0)
                {
                    offer.DiscountAmount += promocodeValue.AdultDiscountAmountPerPerson * NAdults;
                }

                if (promocodeValue.ChildDiscountAmountPerPerson > 0)
                {
                    offer.DiscountAmount += promocodeValue.ChildDiscountAmountPerPerson * NChildren;
                }

                if (promocodeValue.AdultPercentageAmountPerPerson > 0)
                {
                    offer.DiscountAmount += offer.PricePP * promocodeValue.AdultPercentageAmountPerPerson / 100 * NAdults;
                }

                if (promocodeValue.ChildPercentageAmountPerPerson > 0)
                {
                    offer.DiscountAmount += offer.PricePP * promocodeValue.ChildPercentageAmountPerPerson / 100 * NChildren;
                }
            }
        }
    }
}
