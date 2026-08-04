using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers.Interfaces;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.RoomAndBoard;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Mappers;
using easyJet.Holidays.Api.Domain.Mappers.Builders;
using Force.DeepCloner;
using System.Net;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking
{
    /// <summary>
    /// Service from amending bookings room and board 
    /// </summary>
    public class AmendBookingRoomAndBoardService : IAmendBookingRoomAndBoardService
    {
        private readonly IAccommodationOfferService _accommodationOfferService;
        private readonly IBookingRepository _bookingRepository;
        private readonly IHotelThemeService _packageThemeService;
        private readonly IValidateBookingResponseMapper _validateBookingResponseMapper;
        private readonly IAmendPromocodeHandlerService _amendPromocodeHandlerService;
        private readonly IHotelsService _hotelsService;
        private readonly IOfferHotelMapper _offerHotelMapper;
        private readonly IAmendBookingRepository _amendBookingRepository;

        public AmendBookingRoomAndBoardService
        (
            IAccommodationOfferService accommodationOfferService,
            IBookingRepository bookingRepository,
            IHotelThemeService packageThemeService,
            IValidateBookingResponseMapper validateBookingResponseMapper,
            IAmendPromocodeHandlerService amendPromocodeHandlerService,
            IHotelsService hotelsService,
            IOfferHotelMapper offerHotelMapper,
            IAmendBookingRepository amendBookingRepository)
        {
            _accommodationOfferService = accommodationOfferService;
            _bookingRepository = bookingRepository;
            _packageThemeService = packageThemeService;
            _validateBookingResponseMapper = validateBookingResponseMapper;
            _amendPromocodeHandlerService = amendPromocodeHandlerService;
            _hotelsService = hotelsService;
            _offerHotelMapper = offerHotelMapper;
            _amendBookingRepository = amendBookingRepository;
        }

        /// <inheritdoc />      
        public async Task<AmendRoomVariantsResponse> GetAvailableRoomAndBoards(string bookingReference)
        {
            var booking = await _bookingRepository.GetBaseBooking(bookingReference);
            var alternativeFlightsSearchRequest = booking.Map(AmendFlightSearchRequestMapType.RoomAndBoard);
            var alternativeFlights = await GetAlternativeFlights(booking, alternativeFlightsSearchRequest);

            var currentFlight = alternativeFlightsSearchRequest.GetCurrentFlight(alternativeFlights) ??
                throw new ApiException(ApiExceptionCodes.AmendRoomSearchError, "Can not to find current flight in Atcom.", null, null, HttpStatusCode.BadRequest, null);

            var alternativeRoomVariants = await GetAlternativeRoomAndBoards(booking, alternativeFlightsSearchRequest, currentFlight);

            if (IsEmpty(alternativeRoomVariants))
                throw new ApiException(ApiExceptionCodes.AmendRoomSearchError, "Can not to find room in Atcom.", null, null, HttpStatusCode.BadRequest, null);

            var offers = CombineOffersWithAvailableBoards(alternativeRoomVariants.SearchOffersResponses.First().Offers);

            RemoveMatchingOffer(offers, booking);

            var amendValidationRequest = new AmendRoomValidationRequest
            {
                BookingRef = bookingReference,
                DiscountCode = string.Empty, //skip promocodes validation on amend-room-and-board/info request as that results in less atcom calls
                RoomVariants = offers.RoomVariants,
                SelectedRoomVariant = new AmendRoomVariant
                {
                    Units = booking.Package.Accom.Rooms,
                    BookingPrice = booking.PaymentInfo.TotalPrice,
                    OfferPrice = booking.PaymentInfo.TotalPrice
                }
            };

            offers.RoomVariants = await ValidateAlternativeRoomAndBoard(amendValidationRequest, booking);

            if (offers.RoomVariants.IsNullOrEmpty())
            {
                throw new ApiException(ApiExceptionCodes.AmendRoomSearchError, "Can not to find room in Atcom.", null, null, HttpStatusCode.BadRequest, null);
            }

            await EnrichUnitRoomAndBoardInfo(currentFlight, offers);

            var (roomCode, boardCode) = booking.GetFirstRoomsCodes();
            offers.UpsellAmount = CalculateUpsellAmount(offers, roomCode, boardCode);

            return offers;
        }

        /// <inheritdoc /> 
        public async Task<IEnumerable<AmendRoomVariant>> ValidateAlternativeRoomAndBoard(AmendRoomValidationRequest request)
        {
            ArgumentNullException.ThrowIfNull(request?.SelectedRoomVariant);

            if (request.RoomVariants.IsNullOrEmpty())
            {
                return [];
            }

            var originalBooking = await _bookingRepository.GetBooking(request.BookingRef);

            var result = await ValidateAlternativeRoomAndBoard(request, originalBooking);

            return result;
        }

        private async Task<IEnumerable<AmendRoomVariant>> ValidateAlternativeRoomAndBoard(AmendRoomValidationRequest request, BookingResponse booking)
        {
            var validationTasks = request.RoomVariants.Select(variant => ValidateRoomVariant(variant, booking, request));

            var result = await Task.WhenAll(validationTasks);

            result = result.Where(x => x is not null).ToArray();

            return result;
        }

        private void RemoveMatchingOffer(AmendRoomVariantsResponse offers, BookingResponse bookingResponse)
        {
            var (roomCode, boardCode) = bookingResponse.GetFirstRoomsCodes();

            offers.RoomVariants = offers.RoomVariants.Where(x => !(x.Units.FirstOrDefault()?.Code == roomCode && x.Units.FirstOrDefault()?.Board == boardCode)).ToList();
        }

        private decimal CalculateUpsellAmount(AmendRoomVariantsResponse offers, string roomCode, string boardCode)
        {
            return offers.RoomVariants
                .Where(x => x.RoomType.Equals(roomCode, StringComparison.OrdinalIgnoreCase) || x.BoardType.Equals(boardCode, StringComparison.OrdinalIgnoreCase))
                .Where(x => x.FullAmendmentCharges > 0)
                .DefaultIfEmpty()
                .Min(x => x?.FullAmendmentCharges ?? 0m);
        }

        private async Task EnrichUnitRoomAndBoardInfo(Offer currentFlight, AmendRoomVariantsResponse offers)
        {
            var hotels = await LoadHotelsForAllSystems(currentFlight.Accom.Id);

            foreach (var roomVariant in offers.RoomVariants)
            {
                foreach (var unit in roomVariant.Units)
                {
                    await _offerHotelMapper.EnrichBoardTypeAndRoomType(hotels.FirstOrDefault(), unit, currentFlight.Date, currentFlight.Stay);
                }
            }
        }

        private async Task<IEnumerable<Hotel>> LoadHotelsForAllSystems(string accomId)
        {
            var requestIds = new List<string>
            {
               accomId,
            };

            return await _hotelsService.Search(requestIds.ToArray());
        }

        private async Task<AmendRoomVariant> ValidateRoomVariant(AmendRoomVariant roomVariant, BookingResponse originalBooking, AmendRoomValidationRequest request)
        {
            var updatedBooking = originalBooking.MergeWithRoomComposition(roomVariant);

            var validatedResponse = await _amendBookingRepository.GetValidateAmendBookingResponse(updatedBooking);

            if (validatedResponse is null)
            {
                return null;
            }

            var result = _validateBookingResponseMapper.MapToRoomVariant(validatedResponse, originalBooking, request);

            // promocode validation requires extra atcom call and it's only done for the last validate request
            if (!string.IsNullOrEmpty(request.DiscountCode))
            {
                validatedResponse = await _amendPromocodeHandlerService.HandlePromocode(updatedBooking, originalBooking, validatedResponse);
                result = _validateBookingResponseMapper.MapToRoomVariant(validatedResponse, originalBooking, request);
            }

            if (result.Units.IsNullOrEmpty())
            {
                return result;
            }

            UpdateRoomAndBoardTypeInfo(roomVariant, result);

            return result;
        }

        private static void UpdateRoomAndBoardTypeInfo(AmendRoomVariant roomVariant, AmendRoomVariant result)
        {
            result.Units.First().RoomType = roomVariant.Units.First().RoomType;
            result.Units.First().BoardType = roomVariant.Units.First().BoardType;
            result.Units.First().Availability = roomVariant.Units.First().Availability;
            result.Units.First().FreeForKids = roomVariant.Units.First().FreeForKids;
        }

        private AmendRoomVariantsResponse CombineOffersWithAvailableBoards(IEnumerable<Offer> offers)
        {
            List<AmendRoomVariant> roomVariantList = new();

            foreach (var offer in offers)
            {
                foreach (var altBoard in offer?.AltBoards ?? new List<AltBoardType>())
                {
                    roomVariantList.Add(new AmendRoomVariant
                    {
                        Units = offer.Accom.Unit.Select(x => CreateUnitForAlternativeBoard(x, altBoard)).ToList(),
                        OfferPrice = altBoard.Price,
                        OfferPricePp = altBoard.PricePP
                    });
                }

                roomVariantList.Add(new AmendRoomVariant
                {
                    Units = offer.Accom.Unit,
                    OfferPrice = offer.Price,
                    OfferPricePp = offer.PricePP
                });
            }

            return new AmendRoomVariantsResponse { RoomVariants = roomVariantList };
        }

        private Unit CreateUnitForAlternativeBoard(Unit unit, AltBoardType altBoard)
        {
            var clonedUnit = unit.DeepClone();

            clonedUnit.Board = altBoard.Code;
            clonedUnit.Code = altBoard.UnitCode;
            clonedUnit.Price = altBoard.Price;
            clonedUnit.PricePP = altBoard.PricePP;

            return clonedUnit;
        }

        private async Task<RoomVariantsResponse> GetAlternativeRoomAndBoards(
            BookingResponse booking,
            AmendFlightSearchRequest alternativeFlightsSearchRequest,
            Offer currentFlight)
        {
            return await _accommodationOfferService.RoomVariants(
                RoomVariantsSearchRequestBuilder.BuildRoomVariantsRequest(booking, alternativeFlightsSearchRequest, currentFlight)
            );
        }

        private async Task<SearchOffersResponse> GetAlternativeFlights(BookingResponse booking, AmendFlightSearchRequest alternativeFlightsSearchRequest)
            => await _accommodationOfferService.AlternativeFlights(alternativeFlightsSearchRequest, await _packageThemeService.GetPackageThemeType(booking.Prom));

        private bool IsEmpty(RoomVariantsResponse roomVariants)
            => roomVariants.SearchOffersResponses.IsNullOrEmpty() || roomVariants.SearchOffersResponses.First().Offers.IsNullOrEmpty();
    }
}