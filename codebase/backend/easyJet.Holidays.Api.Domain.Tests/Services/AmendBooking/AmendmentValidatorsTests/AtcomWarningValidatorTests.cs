using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.Extensions.Options;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendmentValidatorsTests;

public class AtcomWarningValidatorTests
{
    [Fact]
    public async Task OutOfSyncValidationTest_RestrictAmendments()
    {
        var bookingResponse = new BookingResponse
        {
            AmendmentInfo = new AmendmentsInfo
            {
                AmendBookingStatus = new List<AmendBookingStatus>(),
                ChangeDates = true,
                Pax = new Pax
                {
                    AmendAllow = true,
                    AmendNameOnly = true
                },
                Route = true
            },
            ApiWarnings = new[] { new ApiError { Code = "W8055" } }
        };

        var atcomSettings = Options.Create(new AtcomSettings
        {
            AtcomWarningCodes = new AtcomWarningCodes
            {
                BookingOutOfSync = "W8055"
            }
        });

        var sut = new AtcomWarningValidator(atcomSettings);

        await sut.Validate(bookingResponse, Enumerable.Empty<Memo>(), null);

        using (new AssertionScope())
        {
            bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().BeFalse();
            bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().BeFalse();
            bookingResponse.AmendmentInfo.Route.Should().BeFalse();
            bookingResponse.AmendmentInfo.ChangeDates.Should().BeFalse();

            bookingResponse.AmendmentInfo.AmendBookingStatus.Should().Contain(AmendBookingStatus.AmendDateDisabledByOutOfSync);
            bookingResponse.AmendmentInfo.AmendBookingStatus.Should().Contain(AmendBookingStatus.AmendFlightsDisabledByOutOfSync);
            bookingResponse.AmendmentInfo.AmendBookingStatus.Should().Contain(AmendBookingStatus.AmendPassengerDisabledByOutOfSync);
        }
    }
}