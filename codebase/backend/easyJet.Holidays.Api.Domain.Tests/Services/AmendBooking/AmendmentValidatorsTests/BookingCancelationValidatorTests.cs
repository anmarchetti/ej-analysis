using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using FluentAssertions;
using FluentAssertions.Execution;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendmentValidatorsTests;

public class BookingCancelationValidatorTests
{
    private Mock<IReferenceDataService> _referenceDataServiceMock = new Mock<IReferenceDataService>();
    private BookingCancelationValidator _sut;

    [Fact]
    public async Task Validate_ValidSitecoreSettings_CanBeCanceled()
    {
        var bookingResponse = new BookingResponse
        {
            BookingDate = DateTime.Now.AddHours(-48),
            AmendmentInfo = new AmendmentsInfo()
        };

        var settings = new AmendBookingSetting
        {
            CancellationRestrictionHours = 24
        };

        _referenceDataServiceMock.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(settings);

        var sub = new BookingCancelationValidator();

        await sub.Validate(bookingResponse, null, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

        using (new AssertionScope())
        {
            bookingResponse.AmendmentInfo.CanBookingCancelled.Should().BeTrue();
        }
    }

    [Fact]
    public async Task Validate_NullSitecoreSettings_CanBeCanceled()
    {
        var bookingResponse = new BookingResponse
        {
            BookingDate = DateTime.Now.AddHours(-48),
            AmendmentInfo = new AmendmentsInfo()
        };

        var settings = new AmendBookingSetting
        {
            CancellationRestrictionHours = null
        };

        _referenceDataServiceMock.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(settings);

        var sub = new BookingCancelationValidator();

        await sub.Validate(bookingResponse, null, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

        using (new AssertionScope())
        {
            bookingResponse.AmendmentInfo.CanBookingCancelled.Should().BeTrue();
        }
    }

    [Fact]
    public async Task Validate_CanNotBeCanceled()
    {
        var bookingResponse = new BookingResponse
        {
            BookingDate = DateTime.Now.AddHours(-48),
            AmendmentInfo = new AmendmentsInfo()
        };

        var settings = new AmendBookingSetting
        {
            CancellationRestrictionHours = 72
        };

        _referenceDataServiceMock.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(settings);

        var sub = new BookingCancelationValidator();

        await sub.Validate(bookingResponse, null, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

        using (new AssertionScope())
        {
            bookingResponse.AmendmentInfo.CanBookingCancelled.Should().BeFalse();
            bookingResponse.AmendmentInfo.AmendBookingStatus.Should().Contain(AmendBookingStatus.CancellationDisabledByTimeBound);
        }
    }
}