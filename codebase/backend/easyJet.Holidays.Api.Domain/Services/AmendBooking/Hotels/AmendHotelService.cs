using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using Force.DeepCloner;
using Microsoft.Extensions.Logging;
using System.Net;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.Hotels
{
    /// <summary>
    /// Service for hotel change
    /// </summary>
    public class AmendHotelService : IAmendHotelService
    {
        private const string CanNotToValidateOfferExceptionMessage = "Can not to validate selected offer";

        private readonly IBookingRepository _bookingRepository;
        private readonly ITradeAgentAuthenticationService _tradeAgentAuthenticationService;
        private readonly IAuthenticationService _authenticationService;
        private readonly IAccommodationOfferService _accommodationOfferService;
        private readonly IAlternativeHotelService _alternativeHotelService;
        private readonly ILogger<AmendHotelService> _logger;
        private readonly IAmendPromocodeHandlerService _amendPromocodeHandlerService;
        private readonly ITransferService _transfersService;

        /// <summary>
        /// 
        /// </summary>
        /// <param name="bookingRepository"></param>
        /// <param name="tradeAgentAuthenticationService"></param>
        /// <param name="authenticationService"></param>
        /// <param name="accommodationOfferService"></param>
        /// <param name="alternativeHotelService"></param>
        /// <param name="logger"></param>
        /// <param name="amendPromocodeHandlerService"></param>
        /// <param name="transferService"></param>
        public AmendHotelService(
            IBookingRepository bookingRepository,
            ITradeAgentAuthenticationService tradeAgentAuthenticationService,
            IAuthenticationService authenticationService,
            IAccommodationOfferService accommodationOfferService,
            IAlternativeHotelService alternativeHotelService,
            ILogger<AmendHotelService> logger,
            IAmendPromocodeHandlerService amendPromocodeHandlerService,
            ITransferService transferService)
        {
            _bookingRepository = bookingRepository;
            _tradeAgentAuthenticationService = tradeAgentAuthenticationService;
            _authenticationService = authenticationService;
            _accommodationOfferService = accommodationOfferService;
            _alternativeHotelService = alternativeHotelService;
            _logger = logger;
            _amendPromocodeHandlerService = amendPromocodeHandlerService;
            _transfersService = transferService;
        }

        /// <inheritdoc/>
        public async Task<GetAmendHotelListResponse> GetAmendHotelList(GetAmendHotelListRequest request)
        {
            ArgumentNullException.ThrowIfNull(request);

            var booking = await _bookingRepository
                .GetBaseBooking(request.BookingRef)
                .WhenLoggedInAsLeadPaxOrTradeAgent(_tradeAgentAuthenticationService, _authenticationService);

            var alternativeHotelSearchRequest = _alternativeHotelService.CreateAlternativeHotelsSearchRequest(booking);
            var filters = await _alternativeHotelService.BuildPackageSearchRequest(request.SearchParameters, booking);

            var searchResponse = await _accommodationOfferService.AlternativeHotels(alternativeHotelSearchRequest, filters);

            if (searchResponse.Offers == null)
            {
                return new GetAmendHotelListResponse
                {
                    BookingRef = request.BookingRef,
                    AmendHotelOffers = Array.Empty<AmendHotelOffer>(),
                    Filters = Array.Empty<Filter>(),
                    Status = new Status()
                };
            }

            await _alternativeHotelService.EnrichHotelsInformation(searchResponse);
            await _transfersService.EnrichTransferWithCmsInfo(searchResponse.Offers);

            var getAmendHotelListResponse = _alternativeHotelService.BuildAmendHotelListResponse(booking, searchResponse);
            return getAmendHotelListResponse;
        }

        /// <inheritdoc/>
        public async Task<AmendHotelResponse> ValidateAlternativeHotel(AmendHotelRequest request)
        {
            ThrowIfNotValid(request);

            var bookingResponse = await _bookingRepository
                .GetBooking(request.BookingRef)
                .WhenLoggedInAsLeadPaxOrTradeAgent(_tradeAgentAuthenticationService, _authenticationService);

            ThrowIfAmendmentRestrict(bookingResponse);

            request.AmendHotelOffer.Transfers =
                await GetTransferInformation(request, bookingResponse.Package.Transport);
            
            var amendHotelResponse = await ValidateHotelOption(request.AmendHotelOffer, bookingResponse);

            await _transfersService.EnrichTransferWithCmsInfo(
                amendHotelResponse.AmendHotelOffer.Accom.Code,
                bookingResponse.Package.Transport,
                amendHotelResponse.AmendHotelOffer.Transfers);

            return amendHotelResponse;
        }

        /// <inheritdoc/>
        public async Task<GetAmendHotelRoomsResponse> GetAlternativeRooms(AmendHotelRequest request)
        {
            ThrowIfNotValid(request);

            var bookingResponse = await _bookingRepository
                .GetBooking(request.BookingRef)
                .WhenLoggedInAsLeadPaxOrTradeAgent(_tradeAgentAuthenticationService, _authenticationService);

            ThrowIfAmendmentRestrict(bookingResponse);

            var alternativeHotelRoomsSearchRequest =
                _alternativeHotelService.CreateAlternativeHotelRoomsSearchRequest(bookingResponse,
                    request.AmendHotelOffer);
            var offers = await _accommodationOfferService.AlternativeHotelRooms(alternativeHotelRoomsSearchRequest);
            var combinedOfferList = CombineRoomsWithBoardOptions(offers.Offers);

            var alternativeRoomAndBoardPriceTasks = combinedOfferList.Select(async alternativePackage =>
            {
                try
                {
                    var amendHotelOffer = alternativePackage.MapToAmendHotelOffer();
                    amendHotelOffer.Transfers = request.AmendHotelOffer.Transfers;

                    var amendHotelResponse = await ValidateHotelOption(amendHotelOffer, bookingResponse, request.AmendHotelOffer);

                    return amendHotelResponse;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, CanNotToValidateOfferExceptionMessage);
                    return null;
                }
            });

            var validatedOffers = await Task.WhenAll(alternativeRoomAndBoardPriceTasks);
            var responseOffers = validatedOffers
                .Where(hotel => IsAlternativeOptionShouldReturnInResponse(hotel, request))
                .ToList();

            foreach (var amendHotelResponse in responseOffers)
            {
                amendHotelResponse!.AmendHotelOffer.Transfers = request.AmendHotelOffer.Transfers;
            }

            var result = new GetAmendHotelRoomsResponse
            {
                AmendHotelOffers = responseOffers,
                UpsellAmount = CalculateUpsellAmount(request, responseOffers)
            };
            
            return result;
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<AmendHotelResponse>> GetAlternativeTransfers(AmendHotelRequest request)
        {
            ThrowIfNotValid(request);

            var bookingResponse = await _bookingRepository
                .GetBooking(request.BookingRef)
                .WhenLoggedInAsLeadPaxOrTradeAgent(_tradeAgentAuthenticationService, _authenticationService);

            ThrowIfAmendmentRestrict(bookingResponse);

            var offer = request.AmendHotelOffer.MapToOffer(bookingResponse);

            var alternativeTransfers = await _transfersService.GetAll(offer, request.AmendHotelOffer.Accom.Prom);
            alternativeTransfers = alternativeTransfers.Where(transfer =>
                !transfer.Code.Equals(request.AmendHotelOffer.Transfers?.FirstOrDefault()?.Code, StringComparison.Ordinal));

            var transferValidationTasks = alternativeTransfers.Select(async transferItem =>
            {
                try
                {
                    var clonedRequest = request.DeepClone();
                    clonedRequest.AmendHotelOffer.Transfers = [transferItem];

                    var amendHotelResponse = await ValidateHotelOption(clonedRequest.AmendHotelOffer, bookingResponse, request.AmendHotelOffer);

                    return amendHotelResponse;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, CanNotToValidateOfferExceptionMessage);
                    return null;
                }
            });

            var validatedOffers = await Task.WhenAll(transferValidationTasks);
            
            var result = validatedOffers.Where(hotel => hotel is not null);

            await Task.WhenAll(result.Select(amendHotelResponse =>
                _transfersService.EnrichTransferWithCmsInfo(
                    amendHotelResponse!.AmendHotelOffer.Accom.Code,
                    bookingResponse.Package.Transport,
                    amendHotelResponse.AmendHotelOffer.Transfers)
            ));


            return result;
        }

        private async Task<AmendHotelResponse> ValidateHotelOption(AmendHotelOffer amendHotelOffer,
            BookingResponse bookingResponse, AmendHotelOffer requestAmendHotelOffer = null)
        {
            var updatedBooking = bookingResponse.MergeWithAmendHotelOffer(amendHotelOffer);

            var validatedResponse = await _bookingRepository.GetValidateAmendBookingResponse(updatedBooking);

            ThrowIfValidationFail(validatedResponse);

            if (bookingResponse.HasPromocode())
            {
                validatedResponse =
                    await _amendPromocodeHandlerService.HandlePromocode(updatedBooking, bookingResponse,
                        validatedResponse);
            }

            ThrowIfValidationFail(validatedResponse);

            var amendHotelResponse =
                await _alternativeHotelService.BuildAmendHotel(bookingResponse, validatedResponse, amendHotelOffer, requestAmendHotelOffer);

            return amendHotelResponse;
        }

        private static void ThrowIfAmendmentRestrict(BookingResponse bookingResponse)
        {
            if (!bookingResponse.AmendmentInfo.Accom)
            {
                throw new ApiException(
                    ApiExceptionCodes.AmendHotelRestriction,
                    "Can not amend hotel.",
                    null,
                    null,
                    HttpStatusCode.BadRequest);
            }
        }

        private static void ThrowIfValidationFail(ValidateAmendBookingResponse validatedResponse)
        {
            if (validatedResponse is null)
            {
                throw new ApiException(
                    ApiExceptionCodes.CanNotValidateAlternativeHotel,
                    CanNotToValidateOfferExceptionMessage,
                    null,
                    null,
                    HttpStatusCode.BadRequest);
            }
        }

        private static void ThrowIfNotValid(AmendHotelRequest request)
        {
            if (request is null || string.IsNullOrEmpty(request.BookingRef) || request.AmendHotelOffer is null)
            {
                throw new ApiException(
                    ApiExceptionCodes.InvalidModelState,
                    "The amend hotel request is invalid.",
                    null,
                    null,
                    HttpStatusCode.BadRequest);
            }
        }

        private static List<Offer> CombineRoomsWithBoardOptions(List<Offer> offers)
        {
            var resultOffer = new List<Offer>();

            foreach (var offer in offers)
            {
                resultOffer.Add(offer);

                var offersWithAlternativeBoard = offer.AltBoards?.Select(x => CombineRoomWithBoardOption(offer, x)) ??
                                                 [];

                resultOffer.AddRange(offersWithAlternativeBoard);
            }

            return resultOffer;
        }

        private static Offer CombineRoomWithBoardOption(Offer offer, AltBoardType altBoard)
        {
            var clonedOffer = offer.DeepClone();

            foreach (var unit in clonedOffer.Accom.Unit)
            {
                unit.Board = altBoard.Code;
                unit.BoardType = altBoard;
            }

            return clonedOffer;
        }

        private async Task<List<TransferItem>> GetTransferInformation(AmendHotelRequest request,
            Transport bookingTransport)
        {
            var offer = new Offer
            {
                Accom = request.AmendHotelOffer.Accom,
                Transfers = request.AmendHotelOffer.Transfers,
                Transport = bookingTransport
            };

            var transfer = (await _transfersService.BuildTransfers(offer, true))?.ToList();

            return transfer;
        }

        private static bool IsAlternativeOptionShouldReturnInResponse(AmendHotelResponse hotel, AmendHotelRequest request)
        {
            var result = hotel is not null
                         && (!hotel.AmendHotelOffer.Accom.Unit[0].Code.Equals(request.AmendHotelOffer.Accom.Unit[0].Code, StringComparison.Ordinal)
                         || !hotel.AmendHotelOffer.Accom.Unit[0].Board.Equals(request.AmendHotelOffer.Accom.Unit[0].Board, StringComparison.Ordinal));
            return result;
        }

        private static decimal CalculateUpsellAmount(AmendHotelRequest request, IEnumerable<AmendHotelResponse> offers)
        {
            var roomCode = request.AmendHotelOffer.Accom.Unit[0].Code;
            var boardCode = request.AmendHotelOffer.Accom.Unit[0].Board;

            var result = offers
                .Where(x => x.AmendHotelOffer.Accom.Unit[0].Code.Equals(roomCode, StringComparison.OrdinalIgnoreCase) || 
                            x.AmendHotelOffer.Accom.Unit[0].Board.Equals(boardCode, StringComparison.OrdinalIgnoreCase))
                .Where(x => x.AmendHotelOffer.AmendmentChargesInfo.AmendmentCharges > 0)
                .DefaultIfEmpty()
                .Min(x => x?.AmendHotelOffer?.AmendmentChargesInfo?.AmendmentCharges ?? 0m);

            return result;
        }
    }
}