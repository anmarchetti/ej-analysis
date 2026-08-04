using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers.Interfaces;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Promotion;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Promotions;
using easyJet.Holidays.Api.Domain.Services.Offers;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking
{
    /// <summary>
    /// <inheritdoc />
    /// </summary>
    public class AmendPromocodeHandlerService : IAmendPromocodeHandlerService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IPromotionValidatorService _promotionValidatorService;
        private readonly IValidateBookingResponseMapper _validateBookingResponseMapper;
        private readonly IHotelOfferService _hotelOfferService;

        /// <summary>
        /// ctor
        /// </summary>
        /// <param name="bookingRepository"></param>
        /// <param name="promotionValidatorService"></param>
        /// <param name="validateBookingResponseMapper"></param>
        /// <param name="hotelOfferService"></param>
        /// <exception cref="ArgumentNullException"></exception>
        public AmendPromocodeHandlerService(
            IBookingRepository bookingRepository,
            IPromotionValidatorService promotionValidatorService,
            IValidateBookingResponseMapper validateBookingResponseMapper,
            IHotelOfferService hotelOfferService)
        {
            _bookingRepository = bookingRepository;
            _promotionValidatorService = promotionValidatorService;
            _validateBookingResponseMapper = validateBookingResponseMapper;
            _hotelOfferService = hotelOfferService;
        }

        /// <summary>
        /// <inheritdoc />
        /// </summary>
        public async Task<ValidateAmendBookingResponse> HandlePromocode(BookingResponse updatedBooking, BookingResponse originalBooking, ValidateAmendBookingResponse validatedOfferResponse)
        {
            var promocode = await GetAtcomPromocode(originalBooking, validatedOfferResponse);

            if (!promocode.ValidationResults.IsNullOrEmpty())
                return validatedOfferResponse.ConcatenateApiErrors(promocode.ValidationResults);

            var amendBookingInfoWithPromocode = await _bookingRepository.GetValidateAmendBookingResponse(updatedBooking.UpdatePromoCode(promocode.Promocode));

            if (amendBookingInfoWithPromocode.ApiErrors.IsNullOrEmpty())
                return amendBookingInfoWithPromocode;

            return validatedOfferResponse.ConcatenateApiErrors(amendBookingInfoWithPromocode.ApiErrors);
        }

        public async Task<CmsPromocode> GetAtcomPromocode(BookingResponse originalBooking, ValidateAmendBookingResponse validatedOfferResponse)
        {
            ArgumentNullException.ThrowIfNull(validatedOfferResponse);

            var offer = await _validateBookingResponseMapper.MapToOffer(validatedOfferResponse);

            // promo code is also needs to be validated against hotel properties (not only offer) such as Hotel Type
            await _hotelOfferService.EnrichHotelData(offer);

            // when validating promocode during amend use booking date, not holiday start date
            offer.Date = validatedOfferResponse.BookingDate.DateTime;

            var promocode = await _promotionValidatorService.GetAtcomPromoCode(offer, originalBooking.DiscountCode, originalBooking.MarketCode);
            return promocode;
        }
    }
}
