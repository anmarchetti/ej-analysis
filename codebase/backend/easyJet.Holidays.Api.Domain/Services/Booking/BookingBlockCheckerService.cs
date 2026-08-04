#nullable enable
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Text.RegularExpressions;

namespace easyJet.Holidays.Api.Domain.Services.Booking
{
    /// <inheritdoc />
    public sealed  class BookingBlockCheckerService(ISettingsService settingsService, IOptions<ApiSettings> apiSettings) : IBookingBlockCheckerService
    {
        /// <inheritdoc />
        public async Task<bool> CheckIfBookingIsBlocked(BookingResponse bookingResponse)
        {
            var cancelCreditSettings = await settingsService.GetCancelCreditSettings();
            var maximumFailures = cancelCreditSettings?.AllowedAmountOfFailures ?? 1;

            if (bookingResponse?.Memo == null || bookingResponse.Memo.Count == 0)
            {
                return false;
            }

            var configuredFailedCancellationCode = apiSettings.Value.BookingsMemos?.FailedCancellation?.Code;
            var failedCancellationMemo = bookingResponse.Memo.LastOrDefault(x =>
                x.Code?.Equals(configuredFailedCancellationCode, StringComparison.OrdinalIgnoreCase) == true);

            if (failedCancellationMemo == null)
            {
                return false;
            }

            var failures = GetTrailingNumberFromMemoText(failedCancellationMemo.Text);
            return failures >= maximumFailures;
        }
        
        /// <inheritdoc />
        public int GetTrailingNumberFromMemoText(string memoText)
        {
            if (string.IsNullOrWhiteSpace(memoText))
            {
                return 0;
            }
            
            var colonIndex = memoText.IndexOf(':', StringComparison.InvariantCultureIgnoreCase);
            if (colonIndex == -1) return 0;

            var numberPart = memoText.Substring(colonIndex + 1).Trim();
            return int.Parse(numberPart, NumberStyles.None, CultureInfo.InvariantCulture);
        }
    }
}
