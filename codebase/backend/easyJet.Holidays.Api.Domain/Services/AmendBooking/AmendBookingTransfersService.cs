using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers.Interfaces;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Transfers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking
{
    public class AmendBookingTransfersService : IAmendBookingTransfersService
    {
        private readonly IAuthenticationService _authenticationService;
        private readonly IBookingRepository _bookingRepository;
        private readonly ITransferService _transfersService;
        private readonly IBookingResponseOfferMapper _bookingResponseOfferMapper;
        private readonly ILogger<AmendBookingTransfersService> _logger;
        private readonly ITradeAgentAuthenticationService _tradeAgentAuthService;
        private readonly IValidateBookingResponseMapper _validateBookingResponseMapper;
        private readonly IAmendPromocodeHandlerService _amendPromocodeHandlerService;
        private readonly IAmendBookingRepository _amendBookingRepository;

        /// <summary>
        /// Constructor of AmendBookingTransfersService
        /// </summary>
        public AmendBookingTransfersService(
            IAuthenticationService authenticationService,
            IBookingRepository bookingRepository,
            ITransferService transfersService,
            IBookingResponseOfferMapper bookingResponseOfferMapper,
            ILogger<AmendBookingTransfersService> logger,
            ITradeAgentAuthenticationService tradeAgentAuthService,
            IValidateBookingResponseMapper validateBookingResponseMapper,
            IAmendPromocodeHandlerService amendPromocodeHandlerService,
            IAmendBookingRepository amendBookingRepository)
        {
            _authenticationService = authenticationService;
            _bookingRepository = bookingRepository;
            _logger = logger;
            _tradeAgentAuthService = tradeAgentAuthService;
            _validateBookingResponseMapper = validateBookingResponseMapper;
            _transfersService = transfersService;
            _bookingResponseOfferMapper = bookingResponseOfferMapper;
            _amendPromocodeHandlerService = amendPromocodeHandlerService;
            _amendBookingRepository = amendBookingRepository;
        }

        /// <summary>
        /// Get amend transfers price
        /// </summary>
        /// <param name="amendBookingTransfersRequest"></param>
        /// <returns></returns>
        public async Task<AmendBookingTransfersResponse> GetAmendTransfersPrice(AmendBookingTransfersRequest amendBookingTransfersRequest)
        {
            var bookingResponse = await
                    _bookingRepository.GetBooking(amendBookingTransfersRequest.BookingReference)
                    .IfTransfersAmendmentAllowed()
                    .WhenLoggedInAsLeadPaxOrTradeAgent(_tradeAgentAuthService, _authenticationService);

            var transferWithAmendPrice = await GetAmendPrice(amendBookingTransfersRequest.Transfers, bookingResponse);

            return new AmendBookingTransfersResponse()
            {
                Transfers = transferWithAmendPrice,
            };
        }

        /// <summary>
        /// Get alternative transfers with amendment price
        /// </summary>
        /// <param name="alternativeTransfersSearchRequest"></param>
        /// <returns></returns>
        /// <exception cref="ArgumentException"></exception>
        public async Task<AmendBookingTransfersResponse> GetAlternativeTransfersWithPrice(AlternativeTransfersSearchRequest alternativeTransfersSearchRequest)
        {
            var bookingResponse = await
                    _bookingRepository.GetBooking(alternativeTransfersSearchRequest.BookingReference)
                    .IfTransfersAmendmentAllowed()
                    .WhenLoggedInAsLeadPaxOrTradeAgent(_tradeAgentAuthService, _authenticationService);

            var offer = _bookingResponseOfferMapper.Map(bookingResponse);

            var transfers = await _transfersService.GetAll(offer, bookingResponse.Prom);

            //delete default transfer type to return only alternative transfers
            var alternativeTransfers = transfers.Where(item => item.Type != offer.Transfers?.FirstOrDefault()?.Type);

            alternativeTransfers = RemoveSharedTransferForLuxBooking(bookingResponse, alternativeTransfers);

            var transferWithAmendPrice = await GetAmendPrice(alternativeTransfers, bookingResponse);

            return new AmendBookingTransfersResponse()
            {
                Transfers = transferWithAmendPrice,
            };
        }

        private static IEnumerable<TransferItem> RemoveSharedTransferForLuxBooking(BookingResponse bookingResponse,
            IEnumerable<TransferItem> alternativeTransfers)
        {
            if (BookingUtils.IsLuxuryBooking(bookingResponse))
            {
                alternativeTransfers = alternativeTransfers
                    .Where(item => item.Type != TransferItemType.Shared);
            }

            return alternativeTransfers;
        }


        /// <summary>
        /// Get Alternative transfer options for amend date flow.
        /// </summary>
        /// <param name="request">Current offer state for amend dates flow.</param>
        /// <returns>Available offers.</returns>
        public async Task<IEnumerable<AmendDatesOffer>> GetAlternativeTransfers(AmendDatesOffer request)
        {
            var booking = await _bookingRepository.GetBaseBooking(request.BookingRef);
            var requestTransferCode = request.Offer.Transfers.Any()
                ? request.Offer.Transfers[0].Code
                : String.Empty;

            var alternativeTransfers = await _transfersService.GetAll(request.Offer, booking.Prom);

            alternativeTransfers = alternativeTransfers.Where(transfer => !transfer.Code.Equals(requestTransferCode));

            var bookingResponses = alternativeTransfers
                .Select(transfer => request.Offer.MergeTransferItem(transfer))
                .Select(offer => booking.MergeWithOffer(offer));

            var availableOffer =
                (await Task.WhenAll(bookingResponses.Select(bookingResponse => GetAmendPrice(bookingResponse, booking, request))))
                .Where(x => x is not null);

            return availableOffer;
        }

        private async Task<AmendDatesOffer> GetAmendPrice(BookingResponse bookingResponse, BookingResponse originalBooking, AmendDatesOffer amendDatesOffer)
        {
            var amendBookingInfo = await _amendBookingRepository.GetValidateAmendBookingResponse(bookingResponse);

            if (amendBookingInfo is null) return null;

            if (bookingResponse.HasPromocode())
                amendBookingInfo = await _amendPromocodeHandlerService.HandlePromocode(bookingResponse, originalBooking, amendBookingInfo);

            return await _validateBookingResponseMapper.MapToAmendDatesOffer(amendBookingInfo, bookingResponse, amendDatesOffer);
        }

        private async Task<IEnumerable<AmendTransferItem>> GetAmendPrice(IEnumerable<TransferItem> newTransfers,
            BookingResponse bookingResponse)
        {
            if (newTransfers.IsNullOrEmpty())
                return new List<AmendTransferItem>();

            var transferWithAmendPriceTasks = newTransfers.Select(async (transfer) =>
            {
                try
                {
                    var updatedBooking = bookingResponse.MergeWithTransfer(transfer);
                    var validatedResponse = await _amendBookingRepository.GetValidateAmendBookingResponse(updatedBooking);

                    if (validatedResponse is null) return null;

                    if (bookingResponse.HasPromocode())
                        validatedResponse = await _amendPromocodeHandlerService.HandlePromocode(updatedBooking, bookingResponse, validatedResponse);

                    return _validateBookingResponseMapper.MapToAmendTransferItem(bookingResponse, transfer, validatedResponse);
                }
                catch (Exception e)
                {
                    _logger.LogError(e, "Can't get amend transfer info");

                    return null;
                }
            });

            var transferWithAmendPrice = await Task.WhenAll(transferWithAmendPriceTasks);
            return transferWithAmendPrice.Where(item => item != null);
        }
    }
}