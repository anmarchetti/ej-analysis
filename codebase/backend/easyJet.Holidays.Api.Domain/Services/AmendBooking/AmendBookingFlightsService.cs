using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Mappers;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler;
using easyJet.Holidays.Api.Domain.Utils.Comparers;
using Force.DeepCloner;
using Microsoft.Extensions.Logging;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking
{
    /// <summary>
    /// Amend booking flights service
    /// </summary>
    public class AmendBookingFlightsService : IAmendBookingFlightsService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IAccommodationOfferService _accommOfferService;
        private readonly ILogger<AmendBookingFlightsService> _logger;
        private readonly IBookingResponseOfferMapper _bookingResponseOfferMapper;
        private readonly IHotelThemeService _hotelThemeService;
        private readonly IAmendPromocodeHandlerService _amendPromocodeHandlerService;
        private readonly IAmendTransportBuildService _amendTransportBuildService;
        private readonly IAlternativeFlightsCachePriceService _alternativeFlightsCachePriceChain;
        private readonly IAirportsMapper _airportsMapper;
        private readonly IAmendBookingRepository _amendBookingRepository;

        /// <summary>
        /// Amend booking flights service ctor
        /// </summary>
        public AmendBookingFlightsService(IBookingRepository bookingRepository,
            IAccommodationOfferService accommOfferService,
            ILogger<AmendBookingFlightsService> logger,
            IBookingResponseOfferMapper bookingResponseOfferMapper,
            IHotelThemeService hotelThemeService,
            IAirportsMapper airportsMapper,
            IAmendPromocodeHandlerService amendPromocodeHandlerService,
            IAmendTransportBuildService amendTransportBuildService,
            IAlternativeFlightsCachePriceService alternativeFlightsCachePriceChain,
            IAmendBookingRepository amendBookingRepository)
        {
            _bookingRepository = bookingRepository;
            _accommOfferService = accommOfferService;
            _logger = logger;
            _bookingResponseOfferMapper = bookingResponseOfferMapper;
            _hotelThemeService = hotelThemeService;
            _amendPromocodeHandlerService = amendPromocodeHandlerService;
            _amendTransportBuildService = amendTransportBuildService;
            _alternativeFlightsCachePriceChain = alternativeFlightsCachePriceChain;
            _amendBookingRepository = amendBookingRepository;
            _airportsMapper = airportsMapper;
        }

        /// <summary>
        /// Get alternative flights from Atcom cache
        /// </summary>
        /// <param name="bookingReference">Booking ref.</param>
        /// <returns>Alternative flight for booking.</returns>
        public async Task<AmendFlightOfferResponse> GetAlternativeFlights(string bookingReference)
        {
            if (string.IsNullOrEmpty(bookingReference))
                throw new ArgumentNullException(bookingReference, $"{nameof(bookingReference)} can not be null or empty.");

            _logger.LogInformation("GetAlternativeFlights methods start. BookingRef : {BookingRef}", bookingReference);

            var booking = await _bookingRepository.GetBaseBooking(bookingReference);

            var packageTheme = await _hotelThemeService.GetPackageThemeType(booking.Prom);

            var alternativeFlightsSearchRequest = booking.Map(AmendFlightSearchRequestMapType.Flight);

            var mappedOffer = _bookingResponseOfferMapper.Map(booking);

            var amendFlightOfferResponse = await GetAlternativeFlights(alternativeFlightsSearchRequest, packageTheme, mappedOffer);

            return amendFlightOfferResponse;
        }

        /// <inheritdoc />
        public async Task<IEnumerable<AmendDatesOffer>> GetAlternativeFlights(AmendDatesOffer request)
        {
            _logger.LogInformation("GetAlternativeFlights methods start. BookingRef : {BookingRef}", request.BookingRef);

            var packageTheme = await _hotelThemeService.GetPackageThemeType(request.Offer.Accom.Prom);
            var alternativeFlightsSearchRequest = request.Offer.Map(request.DiscountCode);

            alternativeFlightsSearchRequest.MarketCode = request.MarketCode;

            var amendFlightOfferResponse = await GetAlternativeFlights(alternativeFlightsSearchRequest, packageTheme, request.Offer);

            return amendFlightOfferResponse?.Offers.Select(x => CreateAmendDatesOffer(x, request)).ToList();
        }

        public async Task<AlternativeFlightFullPriceResponse> GetAlternativeFlightFullPrice(AlternativeFlightFullPriceRequest alternativeFlightFullPriceRequest)
        {
            if (alternativeFlightFullPriceRequest.AlternativePackages.IsNullOrEmpty())
                return null;

            var bookingResponse = await _bookingRepository.GetBooking(alternativeFlightFullPriceRequest.BookingReference);

            var transportsWithAmendPriceTasks = alternativeFlightFullPriceRequest.AlternativePackages.Select(async alternativePackage =>
            {
                try
                {
                    var updatedBooking = bookingResponse.MergeWithTransport(alternativePackage.Transport);
                    var validatedResponse = await _amendBookingRepository.GetValidateAmendBookingResponse(updatedBooking);
                    if (!AmendTransportComparer.Equals(validatedResponse?.Transport, alternativePackage?.Transport))
                        return null;

                    if (bookingResponse.HasPromocode())
                        validatedResponse = await _amendPromocodeHandlerService.HandlePromocode(updatedBooking, bookingResponse, validatedResponse);

                    return await _amendTransportBuildService.BuildAmendTransport(bookingResponse, validatedResponse, alternativePackage);
                }
                catch (Exception e)
                {
                    _logger.LogError("Can't get amend price", e);
                    return null;
                }
            });

            var transportsWithAmendPrice = await Task.WhenAll(transportsWithAmendPriceTasks);

            return new AlternativeFlightFullPriceResponse
            {
                AmendTransports = transportsWithAmendPrice?.Where(transport => transport != null)
            };
        }

        private async Task<AmendFlightOfferResponse> GetAlternativeFlights(
            AmendFlightSearchRequest alternativeFlightsSearchRequest,
            PackageThemeType packageTheme,
            Offer requestOffer)
        {
            var alternativeFlightsWithoutDetails = await _accommOfferService.AlternativeFlights(alternativeFlightsSearchRequest, packageTheme);

            if (alternativeFlightsWithoutDetails.Offers.IsNullOrEmpty())
                return null;

            alternativeFlightsWithoutDetails.DeleteCurrentFlight(alternativeFlightsSearchRequest);

            await _airportsMapper.EnrichAirportDetails(alternativeFlightsWithoutDetails.Offers);

            var offers = alternativeFlightsWithoutDetails.Offers.Select(offer => offer.MapToAlternativeFlightOffer()).ToList();

            var context = new AlternativeFlightsCachePriceCalculationContext
            {
                AlternativeFlightOffers = offers,
                RequestOffer = requestOffer,
                PackageTheme = packageTheme,
                AmendFlightSearchRequest = alternativeFlightsSearchRequest
            };

            await _alternativeFlightsCachePriceChain.Handle(context);

            return new AmendFlightOfferResponse { Offers = offers };
        }

        private AmendDatesOffer CreateAmendDatesOffer(AlternativeFlightOffer alternativeFlightOffer, AmendDatesOffer request)
        {
            alternativeFlightOffer.Accom = request.Offer.Accom;
            alternativeFlightOffer.Transfers = request.Offer.Transfers;

            var result = request.DeepClone();
            result.Offer = alternativeFlightOffer;

            return result;
        }
    }
}