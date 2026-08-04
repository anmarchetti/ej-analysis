using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net;

namespace easyJet.Holidays.Api.Domain.Services.Booking
{
    /// <summary>
    /// Service for booking changes: cancellation, amend special request, change privacy
    /// </summary>
    /// <param name="atcomSettings"></param>
    /// <param name="logger"></param>
    /// <param name="bookingRepository"></param>
    /// <param name="bookingFetchService"></param>
    /// <param name="bookingSpecialRequestService"></param>
    /// <param name="authenticationService"></param>
    /// <param name="hotelsService"></param>
    public class BookingChangeService(
        IOptions<AtcomSettings> atcomSettings,
        ILogger<BookingChangeService> logger,
        IBookingRepository bookingRepository,
        IBookingFetchService bookingFetchService,
        IBookingSpecialRequestService bookingSpecialRequestService,
        IAuthenticationService authenticationService,
        IHotelsService hotelsService)
        : IBookingChangeService
    {
        private readonly AtcomSettings _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));

        /// <inheritdoc />
        public async Task<BookingResponse> AmendSpecialRequests(AmendSsrRequest request)
        {
            ArgumentNullException.ThrowIfNull(request);
            var booking = await bookingRepository.GetBooking(request);
            booking = await bookingSpecialRequestService.EnsureAmmendSSr(booking, true);
            await bookingFetchService.EnrichAndSecureBookingResponse(booking);
            await bookingSpecialRequestService.AmmendSpecialRequestsFromBooking(request.SpecialRequests, booking);
            booking.AmendmentInfo.SpecialRequest = await bookingSpecialRequestService.ValidateSpecialRequestAmendmends(booking);
            await hotelsService.EnrichBookingResponse(booking);
            return booking;
        }

        /// <inheritdoc />
        public async Task<List<Memo>> ChangeBookingPrivacy(BookingResponse booking, bool isPrivate)
        {
            ArgumentNullException.ThrowIfNull(booking);
            var customerEmail = await authenticationService.GetCustomerEmail();
            var bookingEmail = booking.CustomerDetails?.Email ?? string.Empty;
            if (!bookingEmail.Equals(customerEmail, StringComparison.OrdinalIgnoreCase))
            {
                throw new ApiException(ApiExceptionCodes.BookingCannotSetPrivacy, "Can not change a booking privacy. Only booking owner can do this", null, null, HttpStatusCode.BadRequest);
            }

            var privacyMemo = SetPrivacyToMemo(booking.Memo, isPrivate);

            await bookingRepository.ModifyMemo(booking.BookingReference, privacyMemo);
            return await bookingRepository.GetBookingMemo(booking.BookingReference);
        }

        /// <summary>
        /// Check if booking has memo "PRVC" and set privacy attribute
        /// </summary>
        /// <param name="memo">Booking memo props</param>
        /// <param name="isPrivate">Private attribute</param> 
        /// <returns></returns>
        private BookingMemo SetPrivacyToMemo(List<Memo> memo, bool isPrivate)
        {
            var privacyMemo = memo.FirstOrDefault(x => x.Code == _atcomSettings.ChangeBooking.Memo.BookingPrivacyCode);
            if (privacyMemo != null)
            {
                return new BookingMemo
                {
                    Code = privacyMemo.Code,
                    Description = isPrivate ? _atcomSettings.ChangeBooking.Memo.BookingIsPrivateText : _atcomSettings.ChangeBooking.Memo.BookingIsNotPrivateText,
                    Key = privacyMemo.Key
                };
            }
            else
            {
                return new BookingMemo
                {
                    Code = _atcomSettings.ChangeBooking.Memo.BookingPrivacyCode,
                    Description = isPrivate ? _atcomSettings.ChangeBooking.Memo.BookingIsPrivateText : _atcomSettings.ChangeBooking.Memo.BookingIsNotPrivateText,
                };
            }
        }
    }
}