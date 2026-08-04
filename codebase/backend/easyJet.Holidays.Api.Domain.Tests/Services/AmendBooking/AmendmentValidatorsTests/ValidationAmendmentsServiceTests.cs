using AutoFixture;
using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Services.AmendBooking;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators;
using easyJet.Holidays.Tests.Domain;
using Moq;
using System.ComponentModel.DataAnnotations;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendmentValidatorsTests;

public class ValidationAmendmentsServiceTests
{
    private IFixture fixture = FixtureUtils.AutoMoqFixture();


    [Theory, AutoData]
    public async Task ValidateAmendments_NullBookingResponse_FinishWithoutValidation([Range(3, 7)] int numberOfValidators)
    {
        var validators = fixture.CreateMany<Mock<IAmendmentValidator>>(numberOfValidators);

        var sut = new ValidationAmendmentsService(validators.Select(x => x.Object));

        await sut.ValidateAmendments(null, It.IsAny<IEnumerable<Memo>>(), It.IsAny<AmendBookingSetting>());

        foreach (var amendmentValidator in validators)
        {
            amendmentValidator.Verify(x => x.Validate(It.IsAny<BookingResponse>(), It.IsAny<IEnumerable<Memo>>(), It.IsAny<AmendBookingSetting>()), Times.Never);
        }
    }

    [Theory, AutoData]
    public async Task ValidateAmendments_ValidateSuccess([Range(3, 7)] int numberOfValidators)
    {
        var validators = fixture.CreateMany<Mock<IAmendmentValidator>>(numberOfValidators);
        var bookingResponse = new BookingResponse();

        var sut = new ValidationAmendmentsService(validators.Select(x => x.Object));

        await sut.ValidateAmendments(bookingResponse, It.IsAny<IEnumerable<Memo>>(), It.IsAny<AmendBookingSetting>());

        foreach (var amendmentValidator in validators)
        {
            amendmentValidator.Verify(x => x.Validate(It.IsAny<BookingResponse>(), It.IsAny<IEnumerable<Memo>>(), It.IsAny<AmendBookingSetting>()), Times.Once);
        }
    }
}