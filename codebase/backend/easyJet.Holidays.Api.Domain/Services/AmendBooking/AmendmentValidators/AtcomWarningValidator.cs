using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators;

public class AtcomWarningValidator : IAmendmentValidator
{
    private readonly AtcomSettings _atcomSettings;

    public AtcomWarningValidator(IOptions<AtcomSettings> atcomSettings)
    {
        _atcomSettings = atcomSettings.Value ?? throw new ArgumentException(nameof(atcomSettings));
    }

    public async Task Validate(BookingResponse bookingResponse, IEnumerable<Memo> memo, AmendBookingSetting amendBookingSettings)
    {
        if (!bookingResponse.ApiWarnings.IsNullOrNone(x => string.Equals(x.Code, _atcomSettings.AtcomWarningCodes.BookingOutOfSync)))
        {
            bookingResponse.AmendmentInfo.Route = false;
            bookingResponse.AmendmentInfo.Pax.AmendAllow = false;
            bookingResponse.AmendmentInfo.Pax.AmendNameOnly = false;
            bookingResponse.AmendmentInfo.ChangeDates = false;

            bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendDateDisabledByOutOfSync);
            bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendFlightsDisabledByOutOfSync);
            bookingResponse.AmendmentInfo.AmendBookingStatus.Add(AmendBookingStatus.AmendPassengerDisabledByOutOfSync);
        }
    }
}