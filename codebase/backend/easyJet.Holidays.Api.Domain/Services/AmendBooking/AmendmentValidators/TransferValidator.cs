using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators.Utils;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators
{
    /// <summary>
    /// Validation possibility of transfer amendment.
    /// </summary>
    public class TransferValidator : IAmendmentValidator
    {
        private readonly ApiSettings _apiSettings;
        private readonly ILuggageService _luggageService;

        /// <summary>
        /// Constructor for DI 
        /// </summary>
        public TransferValidator(IOptions<ApiSettings> apiSettings, ILuggageService luggageService)
        {
            _luggageService = luggageService;
            _apiSettings = apiSettings?.Value ?? throw new ArgumentNullException(nameof(apiSettings));
        }

        public async Task Validate(BookingResponse bookingResponse, IEnumerable<Memo> memo, AmendBookingSetting amendBookingSettings)
        {
            var totalHoursBeforeDeparture = BookingResponseValidatorUtils.TotalHoursBeforeDeparture(bookingResponse);

            //disabled or not by CMS settings
            if (!amendBookingSettings.IsAmendTransfersEnabled)
            {
                bookingResponse.AmendmentInfo.Transfer.AmendAllow = false;
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendTransfersDisabledOnSite);
            }

            //disabled or not by AmendFlightsThresholdHours CMS settings (default value 72 hours)
            if (totalHoursBeforeDeparture < amendBookingSettings.AmendTransfersThresholdHours)
            {
                bookingResponse.AmendmentInfo.Transfer.AmendAllow = false;
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus
                    .AmendTransfersDisabledByTimeBound);
            }

            // can amend flight only X times
            if (memo.Count(x => x.Code.Equals(_apiSettings.AmendBookingMemo.TransferChange.Code)) >=
                (amendBookingSettings.AmendTransferCount ?? 0))
            {
                bookingResponse.AmendmentInfo.Transfer.AmendAllow = false;
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus
                    .AmendTransferDisabledByChangeCountLimit);
            }

            if (await _luggageService.ContainsSportEquipment(bookingResponse.ExtraLuggageInfo?.Items))
            {
                bookingResponse.AmendmentInfo.Transfer.AmendAllow = false;
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow = false;
                bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendTransfersDisabledBySportEquipment);
            }
        }
    }
}