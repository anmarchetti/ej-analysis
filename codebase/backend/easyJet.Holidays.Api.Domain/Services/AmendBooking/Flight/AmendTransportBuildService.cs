using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Factories.PromoCodeBreakDownFactory;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Utils.Comparers;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight
{
    /// <summary>
    /// Build for AmendTransport
    /// </summary>
    public class AmendTransportBuildService : IAmendTransportBuildService
    {
        private readonly IErrataInfoService _errataInfoService;
        private readonly IPromoCodeBreakDownFactory _promocodeBreakDownFactory;
        private readonly ILanguageService _languageService;
        private readonly IAirportsMapper _airportsMapper;
        private readonly IAmendmentChargesService _amendmentChargesService;


        /// <summary>
        /// ctor
        /// </summary>
        /// <param name="errataInfoService"></param>
        /// <param name="promoCodeBreakDownFactory"></param>
        /// <param name="languageService"></param>
        /// <param name="airportsMapper"></param>
        /// <param name="amendmentChargesService"></param>
        public AmendTransportBuildService(
            IErrataInfoService errataInfoService,
            IPromoCodeBreakDownFactory promoCodeBreakDownFactory,
            ILanguageService languageService,
            IAirportsMapper airportsMapper,
            IAmendmentChargesService amendmentChargesService)
        {
            _errataInfoService = errataInfoService;
            _promocodeBreakDownFactory = promoCodeBreakDownFactory;
            _languageService = languageService;
            _airportsMapper = airportsMapper;
            _amendmentChargesService = amendmentChargesService;
        }

        /// <inheritdoc />
        public async Task<AmendTransport> BuildAmendTransport(BookingResponse bookingResponse,
            ValidateAmendBookingResponse validateAmendBookingResponse, AlternativePackage alternativePackage)
        {
            if (validateAmendBookingResponse is null)
            {
                return null;
            }

            if (!AmendTransportComparer.Equals(validateAmendBookingResponse?.Transport, alternativePackage?.Transport))
            {
                return null;
            }

            var result = new AmendTransport
            {
                AmendmentCharges = validateAmendBookingResponse?.PaymentInfo?.AmendmentCharges,
                Routes = alternativePackage?.Transport?.Routes,
                PackagePrice = validateAmendBookingResponse?.PaymentInfo?.TotalPrice,
                PackagePricePP = validateAmendBookingResponse?.PaymentInfo?.PricePP,
                SeatSelection = validateAmendBookingResponse?.SeatSelection,
                PromoCodeBreakDown = _promocodeBreakDownFactory.Create(validateAmendBookingResponse, bookingResponse),
                AmendmentPaymentInfo = _amendmentChargesService.CalculateAmendmentPaymentInfo(bookingResponse, validateAmendBookingResponse)
            };

            await _airportsMapper.EnrichAirportDetails(result);
            await _errataInfoService.EnrichWithFlightErrataInfo(result, _languageService.GetCurrentLanguage());

            return result;
        }
    }
}