using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Booking
{
    /// <summary>
    /// Bookings special request services
    /// </summary>
    public class BookingSpecialRequestService : IBookingSpecialRequestService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IReferenceDataService _referenceDataService;
        private readonly AtcomSettings _atcomSettings;
        private readonly ApiSettings _apiSettings;
        private readonly ILogger<BookingSpecialRequestService> _logger;
        private readonly ISpecialRequestValidator _sepcialRequestValidator;

        public BookingSpecialRequestService(
            IBookingRepository bookingRepository,
            IReferenceDataService referenceDataService,
            IOptions<AtcomSettings> atcomSettings,
            IOptions<ApiSettings> apiSettings,
            ILogger<BookingSpecialRequestService> logger,
            ISpecialRequestValidator sepcialRequestValidator)
        {
            _bookingRepository = bookingRepository;
            _referenceDataService = referenceDataService;
            _atcomSettings = atcomSettings?.Value;
            _apiSettings = apiSettings?.Value ?? throw new ArgumentNullException(nameof(apiSettings));
            _logger = logger;
            _sepcialRequestValidator = sepcialRequestValidator;
        }

        /// <summary>
        /// Add special requests to booking
        /// </summary>
        /// <param name="requestCodes">Codes of special requests</param>
        /// /// <param name="bookingResponse">Booking response</param>
        /// <returns></returns>
        public async Task<BookingResponse> AddSpecialRequestsToBooking(string requestCodes, BookingResponse bookingResponse, string sessionId, string requestId)
        {
            if (string.IsNullOrEmpty(requestCodes))
            {
                return bookingResponse;
            }

            try
            {
                List<SpecialRequestsGroup> specialRequestGroups = await _referenceDataService.GetSpecialRequestGroups();
                bookingResponse.SpecialRequests = requestCodes.Split(',').Select(code => GetSpecialRequest(code, specialRequestGroups)).Where(x => x != null).ToArray();

                if (!bookingResponse.SpecialRequests.Any())
                {
                    return bookingResponse;
                }

                await _bookingRepository.ModifyMemo(bookingResponse.BookingReference, bookingResponse.SpecialRequests.Select(x => new BookingMemo()
                {
                    Code = x.Code,
                    ServiceCode = GetSSRServiceCode(x.GroupCode, bookingResponse, specialRequestGroups),
                    Status = _atcomSettings.SsrNormalStatusCode,
                    Description = x.Name
                }));

                return bookingResponse;
            }
            catch (Exception e)
            {
                if (e is ApiException)
                {
                    var ex = (ApiException)e;
                    throw new CommitBookingException("failed to commit booking", bookingResponse.BookingReference, ex.InnerErrors, sessionId, requestId, ex);
                }

                throw new CommitBookingException("failed to commit booking", bookingResponse.BookingReference, new List<ApiError>().ToArray(), sessionId, requestId, e);
            }
        }

        /// <inheritdoc/>
        public async Task<BookingResponse> AmmendSpecialRequestsFromBooking(IEnumerable<string> requestCodes, BookingResponse bookingResponse)
        {
            await ValidateSpecialRequestContradictionaryGroup(requestCodes.ToArray());

            try
            {
                List<SpecialRequestsGroup> specialRequestGroups = await _referenceDataService.GetSpecialRequestGroups();

                var requestToAdd = requestCodes
                    .Where(x => !bookingResponse.SpecialRequests.Any(s => s.Code == x))
                    .Select(code => GetSpecialRequest(code, specialRequestGroups))
                    .Where(x => x != null);

                var requestToDelete = bookingResponse.SpecialRequests.Where(x => !requestCodes.Contains(x.Code));

                var memoRequests = requestToAdd.Select(x => new BookingMemo()
                {
                    Code = x.Code,
                    ServiceCode = GetSSRServiceCode(x.GroupCode, bookingResponse, specialRequestGroups),
                    Delete = false,
                    Status = _atcomSettings.SsrNormalStatusCode,
                    Description = x.Name
                }).ToList();

                memoRequests.AddRange(requestToDelete.Select(x => new BookingMemo()
                {
                    Code = x.Code,
                    ServiceCode = GetSSRServiceCode(x.GroupCode, bookingResponse, specialRequestGroups),
                    Key = bookingResponse.Memo.FirstOrDefault(m => m.Code == x.Code).Key,
                    Description = x.Name,
                    Delete = true
                }));

                var amendSpecialRequestMemoCode = new BookingMemo
                {
                    Code = _apiSettings.AmendBookingMemo.SpecialRequestChange.Code,
                    Description = _apiSettings.AmendBookingMemo.SpecialRequestChange.Description
                };

                memoRequests.Add(amendSpecialRequestMemoCode);

                if (memoRequests.Any())
                {
                    await _bookingRepository.ModifyMemo(bookingResponse.BookingReference, memoRequests);
                    bookingResponse.SpecialRequests = requestCodes.Select(code => GetSpecialRequest(code, specialRequestGroups)).Where(x => x != null).ToArray();
                }
                return bookingResponse;
            }
            catch (Exception e)
            {
                throw new ApiException(ApiExceptionCodes.SpecialRequestAmmendError);
            }
        }

        public async Task<bool> ValidateSpecialRequestAmendmends(BookingResponse booking)
        {
            var memo = await _bookingRepository.GetBookingMemo(booking.BookingReference);
            var amendBookingSettings = await _referenceDataService.GetAmendBookingSetting();

            await _sepcialRequestValidator.Validate(booking, memo, amendBookingSettings);

            return booking.AmendmentInfo.SpecialRequest;
        }

        /// <inheritdoc/>
        public async Task<BookingResponse> EnsureAmmendSSr(BookingResponse booking, bool shouldThrowError = false)
        {
            ApiException ex = null;

            if (!booking.AmendmentInfo.SpecialRequest)
            {
                switch (booking.AmendmentInfo.AmendBookingStatus)
                {
                    case var status when status == null || !status.Any():
                        break;

                    case var status when status.Contains(AmendBookingStatus.SSRAmendAllowedOnyForActiveBookings):
                        ex = GetExceptionOrThrow(ApiExceptionCodes.SSRAmendAllowedOnyForActiveBookings, shouldThrowError);
                        break;

                    case var status when status.Contains(AmendBookingStatus.SSRAmmendNotAllowedForHBG):
                        ex = GetExceptionOrThrow(ApiExceptionCodes.SSRAmmendNotAllowedForHBG, shouldThrowError);
                        break;

                    case var status when status.Contains(AmendBookingStatus.SSRAmendNotAllowedForDC):
                        ex = GetExceptionOrThrow(ApiExceptionCodes.SSRAmendNotAllowedForDC, shouldThrowError);
                        break;

                    case var status when status.Contains(AmendBookingStatus.SSRAmendDepartureDate):
                        ex = GetExceptionOrThrow(ApiExceptionCodes.SSRAmendDepartureDate, shouldThrowError);
                        break;

                    case var status when status.Contains(AmendBookingStatus.SSRAmendIsDisabled):
                        ex = GetExceptionOrThrow(ApiExceptionCodes.SSRAmendIsDisabled, shouldThrowError);
                        break;

                    case var status when status.Contains(AmendBookingStatus.AmendSpecialRequestDisabledByChangeCountLimit):
                        ex = GetExceptionOrThrow(ApiExceptionCodes.AmendSpecialRequestDisabledByChangeCountLimit, shouldThrowError);
                        break;

                    case var status when status.Contains(AmendBookingStatus.SSRAmendIsDisabledOnSiteForDIHotels):
                        ex = GetExceptionOrThrow(ApiExceptionCodes.SSRAmendIsDisabledOnSiteForDIHotels, shouldThrowError);
                        break;

                    case var status when status.Contains(AmendBookingStatus.AmendMemoDisabled):
                        ex = GetExceptionOrThrow(ApiExceptionCodes.AmendMemoDisabled, shouldThrowError);
                        break;

                    case var status when status.Contains(AmendBookingStatus.SSRAmendIsDisabledOnSiteForDIHotels):
                        ex = GetExceptionOrThrow(ApiExceptionCodes.SSRAmendIsDisabledOnSiteForDIHotels, shouldThrowError);
                        break;
                }
            }

            booking.AmendmentInfo.SpecialRequest = ex == null;
            return booking;
        }

        /// <summary>
        /// Make sure that adding special requests is allowed for the booking.
        /// </summary>
        /// <param name="bookingAccommodation"></param>
        /// <returns></returns>
        public async Task EnsureCreateSpecialRequests(BookingAccommodation bookingAccommodation)
        {
            SpecialRequestSettingsSitecore specialRequestSettings = await _referenceDataService.GetSpecialRequestSettings();

            if (!specialRequestSettings.IsSpecialRequestActive)
            {
                //Check if IsSpecialRequestActive is enabled in CMS
                throw new ApiException(ApiExceptionCodes.SSRAddIsDisabled);
            }

            if (bookingAccommodation.IsExt && !specialRequestSettings.IsEligibleToAddForHBG)
            {
                // If adding ssr not allowed for HBG
                throw new ApiException(ApiExceptionCodes.SSRAddNotAllowedForHBG);
            }

            if (!bookingAccommodation.IsExt && !specialRequestSettings.IsEligibleToAddForDC)
            {
                // If adding ssr not allowed for DC
                throw new ApiException(ApiExceptionCodes.SSRAddNotAllowedForDC);
            }
        }

        public async Task<List<SpecialRequest>> GetSpecialRequestsByCodes(IEnumerable<string> codes)
        {
            List<SpecialRequestsGroup> specialRequestGroups = await _referenceDataService.GetSpecialRequestGroups();

            return codes.Select(code => GetSpecialRequest(code, specialRequestGroups)).Where(x => x != null).ToList();
        }

        /// <summary>
        /// Validates the special request codes.
        /// </summary>
        /// <param name="codes">The codes.</param>
        /// <exception cref="easyJet.Holidays.Api.Common.Exceptions.ApiException">At list one special request code is invalid</exception>
        public async Task ValidateSpecialRequestCodes(IEnumerable<string> codes)
        {
            List<SpecialRequestsGroup> specialRequestGroups = await _referenceDataService.GetSpecialRequestGroups();

            if (codes.Any(code => !specialRequestGroups.Exists(g => g.SpecialRequests.Exists(r => r.Code == code))))
            {
                _logger.LogError("At list one special request code is invalid");
                throw new ApiException(ApiExceptionCodes.BookingCannotAddSpecialRequest, "At list one special request code is invalid", null, null, System.Net.HttpStatusCode.BadRequest);
            }
        }

        /// <summary>
        /// Validates the special request contradictionary group.
        /// </summary>
        /// <param name="codes">The codes.</param>
        /// <exception cref="easyJet.Holidays.Api.Common.Exceptions.ApiException">Booking has more the one special request in {contradictoryGroup.Name}</exception>
        public async Task ValidateSpecialRequestContradictionaryGroup(IEnumerable<string> codes)
        {
            var specialRequestContradictoryGroups = await _referenceDataService.GetSpecialRequestContradictoryGroups();

            foreach (var contradictoryGroup in specialRequestContradictoryGroups)
            {
                var contradictoryRequestInGroup = contradictoryGroup.SpecialRequests.Where(x => codes.Contains(x.Code)).Count();
                if (contradictoryRequestInGroup > 1)
                {
                    _logger.LogError($"Booking has more the one special request in {contradictoryGroup.Name}");
                    throw new ApiException(ApiExceptionCodes.BookingCannotHasContradictorySpecialRequest, $"Booking has more the one special request in {contradictoryGroup.Name}", null, null, System.Net.HttpStatusCode.BadRequest);
                }
            }
        }

        private SpecialRequest GetSpecialRequest(string code, List<SpecialRequestsGroup> specialRequestGroups)
        {
            SpecialRequestsGroup group = specialRequestGroups?.FirstOrDefault(g => g?.SpecialRequests?.Exists(r => r.Code == code) ?? false) ?? null;
            SpecialRequest ssr = group?.SpecialRequests.FirstOrDefault(r => r.Code == code) ?? null;

            if (ssr != null)
            {
                ssr.GroupCode = group.Code;
            }

            return ssr;
        }

        private string GetSSRServiceCode(string groupCode, BookingResponse bookingResponse, List<SpecialRequestsGroup> specialRequestGroups)
        {
            return groupCode == _atcomSettings?.SpecialRequestsType?.Accommodation
                            ? bookingResponse.Package.Accom.Id
                            : groupCode == _atcomSettings?.SpecialRequestsType?.Transfer
                                ? (bookingResponse.Transfers.FirstOrDefault()?.Id ?? null)
                                : null;
        }

        private ApiException GetExceptionOrThrow(ExceptionCode apiExceptionCodes, bool shouldThrowError)
        {
            var exception = new ApiException(apiExceptionCodes);

            return !shouldThrowError ? exception : throw exception;
        }
    }
}