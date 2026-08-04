using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Cms.Models.Promotion;

namespace easyJet.Holidays.External.Cms.Mappers
{
    public static class ValidatePromotionBaseMapper
    {
        public static ValidatePromotionBase BuildValidatePromotionBaseFromOffer(Offer offer)
        {
            return new ValidatePromotionBase()
            {
                Airport = offer?.Transport?.Routes[0]?.DepPt,
                DepartureDate = offer?.Transport?.Routes[0]?.DepDate,
                ReturnDate = offer?.Transport?.Routes[1]?.DepDate,
                Duration = offer?.Stay,
                Price = offer?.PriceExcludingTouristTax ?? 0,
                PricePP = offer?.PricePPExcludingTouristTax ?? 0,
                BoardType = offer?.FirstUnit()?.Board,
                HolidayTheme = offer?.Accom?.Theme?.Name,
                HolidayType = offer?.Accom?.Type?.Name,
                HotelType = offer?.Hotel?.HotelType?.Code,
                PromoCollectionCode = offer?.Accom?.Prom,
                HotelCode = offer?.Accom?.Code,
                BookingDate = DateTime.UtcNow,
                NAdults = offer?.Accom?.Unit?.Sum(x => x.Occupation.Adults),
                NChildren = offer?.Accom?.Unit?.Sum(x => x.Occupation.Children),
                NInfants = offer?.Accom?.Unit?.Sum(x => x.Occupation.Infants),
                Id = offer?.Id
            };
        }

        /// <summary>
        /// Build promotions request from offers model
        /// </summary>
        /// <param name="offer"></param>
        /// <returns></returns>
        public static ValidatePromotionBase BuildBaseRequestItem(Offer offer, PromoCodeSettings promoCodeSettings)
        {
            var request = ValidatePromotionBaseMapper.BuildValidatePromotionBaseFromOffer(offer);

            if (!promoCodeSettings.IsSeatsCalculationIncluded)
            {
                if (SeatsUtils.HasSelectedSeats(offer.SeatSelection))
                {
                    request.Price -= SeatsUtils.GetSeatsPrice(offer.SeatSelection);
                    request.PricePP -= SeatsUtils.GetSeatsPricePerPerson(offer.SeatSelection, offer.Accom.Unit);
                }
            }

            return request;
        }

        /// <summary>
        /// Build promotions request from offers model
        /// </summary>
        /// <param name="offer"></param>
        /// <returns></returns>
        public static ValidatePromotionBase BuildBaseRequestItemFromLivePriceSummaryModel(LivePriceSummaryModel livePrice)
        {
            return new ValidatePromotionBase()
            {
                Airport = livePrice.SearchCriteria?.DepPt,
                DepartureDate = livePrice.SearchCriteria?.Range?.Start,
                ReturnDate = livePrice.SearchCriteria?.Range?.End,
                Duration = (byte?)livePrice.SearchCriteria?.Duration,
                Price = livePrice.PriceExcludingTouristTax,
                PricePP = livePrice.PricePPExcludingTouristTax,
                BoardType = null,
                HolidayTheme = livePrice.SearchCriteria?.ThemeTypesCodes?.LastOrDefault(),
                HolidayType = livePrice.SearchCriteria?.ThemeTypesCodes?.FirstOrDefault(),
                HotelType = null,
                HotelCode = livePrice.AccomCode,
                BookingDate = DateTime.UtcNow,
                NAdults = livePrice.SearchCriteria?.Adults,
                NChildren = livePrice.SearchCriteria?.Children,
                NInfants = livePrice.SearchCriteria?.Infants,
            };
        }

        /// <summary>
        /// Build promotions request from validate booking request model
        /// </summary>
        /// <param name="validateBookingRequest">validate booking request</param>
        /// <param name="priceInfo">price info</param>
        /// <returns>Validate Promotion Base</returns>
        public static ValidatePromotionBase BuildBaseRequestItemFromValidatePackageRequest(ValidateBookingRequest validateBookingRequest, PriceInfo priceInfo)
        {
            return new ValidatePromotionBase()
            {
                Airport = validateBookingRequest?.Offer?.Transport?.Routes[0]?.DepPt,
                DepartureDate = validateBookingRequest?.Offer?.Transport?.Routes[0]?.DepDate,
                ReturnDate = validateBookingRequest?.Offer?.Transport?.Routes[1]?.DepDate,
                Duration = validateBookingRequest?.Offer?.Stay,
                Price = priceInfo?.TotalPrice ?? 0,
                PricePP = priceInfo?.PricePP ?? 0,
                BoardType = validateBookingRequest?.Offer?.FirstUnit()?.Board,
                HolidayTheme = validateBookingRequest?.Offer?.Accom?.Theme?.Name,
                HolidayType = validateBookingRequest?.Offer?.Accom?.Type?.Name,
                HotelType = validateBookingRequest?.Offer?.Hotel?.HotelType?.Code,
                PromoCollectionCode = validateBookingRequest?.Offer?.Accom?.Prom,
                HotelCode = validateBookingRequest?.Offer?.Accom?.Code,
                BookingDate = DateTime.UtcNow,
                NAdults = validateBookingRequest?.Offer?.Accom?.Unit?.Sum(x => x.Occupation.Adults),
                NChildren = validateBookingRequest?.Offer?.Accom?.Unit?.Sum(x => x.Occupation.Children),
                NInfants = validateBookingRequest?.Offer?.Accom?.Unit?.Sum(x => x.Occupation.Infants),
                Id = validateBookingRequest?.Offer?.Id
            };
        }

        public static ValidatePromotionBase BuildBaseRequestItem(Offer offer, PromoCodeSettings promoCodeSettings, string customerPromoCode, string market)
        {
            var request = ValidatePromotionBaseMapper.BuildValidatePromotionBaseFromOffer(offer);

            IncludeSeatsPrice(offer, promoCodeSettings, request);

            request.BookingDate = offer.Date ?? DateTime.UtcNow;
            request.VoucherCode = customerPromoCode;
            request.MarketCode = market;

            return request;
        }

        private static void IncludeSeatsPrice(Offer offer, PromoCodeSettings promoCodeSettings, ValidatePromotionBase request)
        {
            if (!SeatsUtils.HasSelectedSeats(offer.SeatSelection))
                return;

            if (promoCodeSettings.IsSeatsCalculationIncluded)
            {
                request.Price += SeatsUtils.GetSeatsPrice(offer.SeatSelection);
                request.PricePP += SeatsUtils.GetSeatsPricePerPerson(offer.SeatSelection, offer.Accom.Unit);
                return;
            }

            request.Price -= SeatsUtils.GetSeatsPrice(offer.SeatSelection);
            request.PricePP -= SeatsUtils.GetSeatsPricePerPerson(offer.SeatSelection, offer.Accom.Unit);
        }
    }
}