using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;

using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking
{
    /// <summary>
    /// Service for amend passenger information
    /// </summary>
    /// <seealso cref="IAmendPassengerService" />
    public class AmendBookingPassengerService : IAmendPassengerService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IAmendPassengerValidationService _amendPassengerValidationService;
        private readonly ApiSettings _apiSettings;
        private readonly IReferenceDataService _referenceDataService;
        private readonly ITradeAgentAuthenticationService _tradeAgentAuthService;
        private readonly IAuthenticationService _authenticationService;

        public AmendBookingPassengerService(
            IBookingRepository bookingRepository,
            IAmendPassengerValidationService amendPassengerValidationService,
            IOptions<ApiSettings> apiSettings,
            IReferenceDataService referenceDataService,
            ITradeAgentAuthenticationService tradeAgentAuthService,
            IAuthenticationService authenticationService)
        {
            _bookingRepository = bookingRepository;
            _amendPassengerValidationService = amendPassengerValidationService;
            _apiSettings = apiSettings?.Value ?? throw new ArgumentNullException(nameof(apiSettings));
            _referenceDataService = referenceDataService;
            _tradeAgentAuthService = tradeAgentAuthService;
            _authenticationService = authenticationService;
        }

        /// <summary>
        /// Passenger name changes validation.
        /// </summary>
        /// <param name="amendNameRequest">The amend name request.</param>
        /// <returns></returns>
        /// <exception cref="easyJet.Holidays.Api.Common.Exceptions.ApiException">
        /// null - Customer is not logged in or is not the lead passenger for the booking
        /// or
        /// null - Can not change more than 3 characters
        /// or
        /// null - Can not change more than one times for each passenger.
        /// </exception>
        public async Task<bool> ValidatePaxNameChange(AmendPaxRequest amendNameRequest)
        {
            var booking = await _bookingRepository
                .GetBooking(amendNameRequest.BookingReference)
                .WhenLoggedInAsLeadPaxOrTradeAgent(_tradeAgentAuthService, _authenticationService);

            var bookingMemo = await _bookingRepository.GetBookingMemo(booking.BookingReference);
            var amendBookingSetting = await _referenceDataService.GetAmendBookingSetting();

            var result = PaxNameChangesValidation(booking, amendNameRequest.Guest, bookingMemo, amendBookingSetting);

            return result;
        }

        /// <summary>
        /// Passenger name changes validation.
        /// </summary>
        /// <param name="booking">The booking response.</param>
        /// <param name="amendPersonWithDetails">List of passenger.</param>
        /// <returns></returns>
        /// <exception cref="easyJet.Holidays.Api.Common.Exceptions.ApiException">
        /// null - Customer is not logged in or is not the lead passenger for the booking
        /// or
        /// null - Can not change more than 3 characters
        /// or
        /// null - Can not change more than one times for each passenger.
        /// </exception>
        public async Task<bool> ValidatePaxNameChange(BookingResponse booking, IEnumerable<AmendPersonWithDetails> amendPersonWithDetails)
        {
            var bookingMemo = await _bookingRepository.GetBookingMemo(booking.BookingReference);
            var amendBookingSetting = await _referenceDataService.GetAmendBookingSetting();

            foreach (var amendPerson in amendPersonWithDetails)
            {
                PaxNameChangesValidation(booking, amendPerson, bookingMemo, amendBookingSetting);
            }

            return true;
        }

        /// <summary>
        /// Validate availability to amend passengers details by sitecore change amount limit settings.
        /// </summary>
        /// <param name="amendPaxRequest">Request with bookingRef and passenger detail information.</param>
        /// <returns>Flag for each passenger in request.</returns>
        /// <exception cref="ArgumentNullException">Passanger information can not be null.</exception>
        public async Task<IEnumerable<AmendPaxValidationResponse>> ValidatePaxChangeLimit(AmendPaxValidationRequest amendPaxRequest)
        {
            if (string.IsNullOrEmpty(amendPaxRequest?.BookingReference))
            {
                throw new ArgumentException(nameof(amendPaxRequest.BookingReference));
            }

            if (amendPaxRequest?.Guests == null)
            {
                throw new ArgumentNullException(nameof(amendPaxRequest.Guests));
            }

            var bookingMemo = await _bookingRepository
                .GetBookingMemo(amendPaxRequest.BookingReference, x => x.Code.Equals(_apiSettings.AmendBookingMemo.NameChange.Code));

            var amendBookingSetting = await _referenceDataService.GetAmendBookingSetting();

            var result = amendPaxRequest.Guests.Select(personDetail => new AmendPaxValidationResponse
            {
                PaxId = personDetail.Index,
                CanBeChanged = CanAmendPaxByChangeCountLimit(bookingMemo, amendBookingSetting, personDetail.Index)
            });

            return result;
        }

        /// <summary>
        /// Passenger name changes validation.
        /// </summary>
        /// <param name="booking">The booking response.</param>
        /// <param name="amendPerson">Updated passenger information.</param>
        /// <param name="bookingMemo">Memo information for current booking.</param>
        /// <param name="amendBookingSettings">Sitecore settings for amend operations.</param>
        /// <returns></returns>
        /// <exception cref="easyJet.Holidays.Api.Common.Exceptions.ApiException">
        /// null - Customer is not logged in or is not the lead passenger for the booking
        /// or
        /// null - Can not change more than 3 characters
        /// or
        /// null - Can not change more than one times for each passenger.
        /// </exception>
        private bool PaxNameChangesValidation(
            BookingResponse booking,
            AmendPersonWithDetails amendPerson,
            IEnumerable<Memo> bookingMemo,
            AmendBookingSetting amendBookingSettings)
        {
            var guest = booking.Guests.Single(x => x.Index == amendPerson.Index);

            var oldName = guest.FirstName + guest.LastName;
            var newName = amendPerson.FirstName + amendPerson.LastName;

            // Check that user change less than 3 characters

            var changedCharactersCount = _amendPassengerValidationService.CalculateNumberChangedCharacters(oldName, newName);

            if (changedCharactersCount > amendBookingSettings.AmendPassengerNameCharacterCount)
            {
                throw new ApiException(ApiExceptionCodes.AmendPaxNameDigitCountRestriction, null, "Can not change more than 3 characters.");
            }

            if (changedCharactersCount > 0)
            {
                amendPerson.PaxNameChanged = true;
            }

            // Check that user don`t change lead passenger information.

            if (changedCharactersCount > 0 && _amendPassengerValidationService.IsAmendingLeadPassenger(booking.Guests, amendPerson.Index))
            {
                throw new ApiException(ApiExceptionCodes.AmendPaxNameLeadRestriction, null, "Can not change lead passenger information.");
            }

            // Check that we can change not more ones per passenger
            var paxMemo = bookingMemo?.Where(x => x.Code.Equals(_apiSettings.AmendBookingMemo.NameChange.Code));
            var amendNameHistoryInformation = new AmendPaxHistory(paxMemo);
            var passengerNameChangeCount = _amendPassengerValidationService.CalculateNameChangeCount(amendNameHistoryInformation.AmendPaxHistoryItems, amendPerson.Index);

            if (changedCharactersCount > 0 && passengerNameChangeCount >= amendBookingSettings.AmendPassengerNameCount)
            {
                throw new ApiException(ApiExceptionCodes.AmendPaxNameLimitRestriction, null, "Can not change name more.");
            }

            return true;
        }

        /// <summary>
        /// Amend count limit validation by sitecore settings.
        /// </summary>
        /// <param name="paxMemo">Booking memo wich related to the passenger.</param>
        /// <param name="amendBookingSettings">Sitecore amend booking settings.</param>
        /// <param name="paxId">Passenger id.</param>
        /// <returns>Boolean flag.</returns>
        private bool CanAmendPaxByChangeCountLimit(IEnumerable<Memo> paxMemo, AmendBookingSetting amendBookingSettings, string paxId)
        {
            var amendNameHistoryInformation = new AmendPaxHistory(paxMemo);
            var passengerNameChangeCount = _amendPassengerValidationService.CalculateNameChangeCount(amendNameHistoryInformation.AmendPaxHistoryItems, paxId);
            var result = amendBookingSettings.AmendPassengerNameCount > passengerNameChangeCount;
            return result;
        }
    }
}