using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Mappers.ApiResponseValidators;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Models.ModifyBooking;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.External.Atcom.Services.Amend
{
    /// <summary>
    /// Provides methods for retrieving and validating amended booking responses,
    /// interacting with an external API, and performing booking modifications.
    /// </summary>
    public class AmendBookingRepository : IAmendBookingRepository
    {
        private readonly EndpointsProvider _endpointProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ApiResponseValidators _apiResponseValidators;
        private readonly IReferenceDataService _referenceDataService;
        private readonly IModifyBookingMapper _modifyBookingMapper;
        private readonly IApiService _apiService;
        private readonly ISettingsService _settingsService;
        private readonly ILogger<AmendBookingRepository> _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="AmendBookingRepository"/> class.
        /// </summary>
        /// <param name="endpointProvider">An object that provides endpoint URIs.</param>
        /// <param name="httpContextAccessor">Provides access to the current HTTP context and its cookies.</param>
        /// <param name="apiResponseValidators">Responsible for validating API responses and handling errors.</param>
        /// <param name="referenceDataService">Retrieves reference data such as benefits.</param>
        /// <param name="modifyBookingMapper">Responsible for mapping booking objects to modify booking requests.</param>
        /// <param name="apiService">Used to send requests and receive responses from an external API.</param>
        /// <param name="settingsService">Retrieves configuration and settings for booking processes.</param>
        /// <param name="logger">Log information.</param>
        public AmendBookingRepository(
            EndpointsProvider endpointProvider,
            IHttpContextAccessor httpContextAccessor,
            ApiResponseValidators apiResponseValidators,
            IReferenceDataService referenceDataService,
            IModifyBookingMapper modifyBookingMapper,
            IApiService apiService,
            ISettingsService settingsService,
            ILogger<AmendBookingRepository> logger)
        {
            _endpointProvider = endpointProvider;
            _httpContextAccessor = httpContextAccessor;
            _apiResponseValidators = apiResponseValidators;
            _referenceDataService = referenceDataService;
            _modifyBookingMapper = modifyBookingMapper;
            _apiService = apiService;
            _settingsService = settingsService;
            _logger = logger;
        }

        ///<inheritdoc/>
        public async Task<ValidateAmendBookingResponse> GetValidateAmendBookingResponse(BookingResponse booking, bool stateful = false)
        {
            ArgumentNullException.ThrowIfNull(booking);
            try
            {
                var benefits = await _referenceDataService.GetBenefits();
                var infoModifyBookingRequest = _modifyBookingMapper.BuildInfoModifyBookingRequest(booking);
                var validateResponseAction = _apiResponseValidators.ValidateAtcomResponseCatchApiPromocodeErrorsAction;

                if (!stateful)
                {
                    infoModifyBookingRequest.DiscardSession = true;
                }

                var amendBookingRequest = new InfoModifyBookingRequest
                {
                    Endpoint = _endpointProvider.GetEndpoint(AtcomEndpoint.Booking, _httpContextAccessor.HttpContext?.Request?.Cookies),
                    Payload = { Body = infoModifyBookingRequest },
                    ValidateResponse = validateResponseAction
                };

                var infoModifyBookingResponse = validateResponseAction != null
                    ? await _apiService
                        .GetResponseContentAsyncWithCustomErrorMapping<InfoModifyBookingRequest,
                            InfoModifyBookingResponse>(
                            amendBookingRequest,
                            ApiExceptionCodes.BookingModifyError)
                    : await _apiService
                        .GetResponseContentAsyncWithErrorMapping<InfoModifyBookingRequest,
                            InfoModifyBookingResponse>(
                            amendBookingRequest,
                            ApiExceptionCodes.BookingModifyError);

                var priceBreakdownSettings = await _settingsService.GetPriceBreakdownSettings();
                var validateAmendBookingResponse = await _modifyBookingMapper.Map(infoModifyBookingResponse, priceBreakdownSettings, benefits.Children, false);

                EnhanceResponse(booking, validateAmendBookingResponse);

                return validateAmendBookingResponse;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Can not to validate changes for booking {BookingReference}", booking.BookingReference);
                return null;
            }
        }

        /// <summary>
        /// Enhances the <see cref="ValidateAmendBookingResponse"/> with additional payment information
        /// and handles certain edge cases for negative balances.
        /// </summary>
        /// <param name="booking">The original booking containing its payment details.</param>
        /// <param name="validateAmendBookingResponse">The response to be enriched with additional data.</param>
        private static void EnhanceResponse(BookingResponse booking, ValidateAmendBookingResponse validateAmendBookingResponse)
        {
            validateAmendBookingResponse.PaymentInfo.AmendmentCharges =
                validateAmendBookingResponse.PaymentInfo.TotalPrice - booking.PaymentInfo.TotalPrice;

            //Handle case when BalanceDueAmount < 0
            //This happens when a refund/credit action on a booking has failed in the past due to an error in the payment system
            //In the result there is no payment information about refund/credit in Atcom and this booking has negative BalanceDueAmount
            if (booking.PaymentInfo.BalanceDueAmount < 0)
            {
                validateAmendBookingResponse.PaymentInfo.AmendmentCharges += booking.PaymentInfo.BalanceDueAmount;
            }
        }
    }
}