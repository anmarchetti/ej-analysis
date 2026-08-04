using AutoFixture;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.CallCentre;
using easyJet.Holidays.Api.Domain.Services.CallCentre;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Net;

namespace easyJet.Holidays.Api.Domain.Tests.Controllers
{
    public class CallCentreControllerTests
    {
        private readonly IFixture _fixture;

        private readonly CallCentreController _sut;

        private readonly Mock<ICallCentreService> _callCentreServiceMock;
        private readonly Mock<IVouchersService> _vouchersServiceMock;


        public CallCentreControllerTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();

            _callCentreServiceMock = _fixture.Create<Mock<ICallCentreService>>();
            _vouchersServiceMock = _fixture.Create<Mock<IVouchersService>>();

            _sut = new CallCentreController(
                _callCentreServiceMock.Object,
                _vouchersServiceMock.Object
            );
        }

        [Fact]
        public async Task GetCredit_GetsCreditForMail_ReturnsCreditInOKResponse()
        {
            // Arrange 
            var mail = "test@te.st";

            // Act
            var response = await _sut.GetCredit(mail, "GBP") as ObjectResult;
            var value = response?.Value;

            // Assert
            response.Should().NotBeNull();
            response!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            value.Should().NotBeNull();
            _callCentreServiceMock.Verify(mock => mock.GetCredit(mail, "GBP", null, false), Times.Once);
        }

        [Fact]
        public async Task SpendCreditsPut_RelaysSpendCreditsRequest_ReturnsCreditInfoInOKResponse()
        {
            // Arrange
            var request = _fixture.Create<SpendCreditRequest>();

            // Act
            var response = await _sut.SpendCreditsPut(request) as ObjectResult;
            var value = response?.Value;

            // Assert
            response.Should().NotBeNull();
            response!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            value.Should().NotBeNull();
            _callCentreServiceMock.Verify(mock => mock.SpendCredit(It.IsAny<SpendCreditRequest>()), Times.Once);
        }

        [Fact]
        public async Task SpendCredits_RelaysSpendCreditsRequest_ReturnsCreditInfoInOKResponse()
        {
            // Arrange
            var request = _fixture.Create<SpendCreditRequest>();

            // Act
            var response = await _sut.SpendCredits(request) as ObjectResult;
            var value = response?.Value;

            // Assert
            response.Should().NotBeNull();
            response!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            value.Should().NotBeNull();
            _callCentreServiceMock.Verify(mock => mock.SpendCredit(It.IsAny<SpendCreditRequest>()), Times.Once);
        }

        [Fact]
        public async Task AddCredits_InvalidReasonInRequest_ReturnsBadRequestResponse()
        {
            // Arrange
            var request = _fixture.Create<AddCreditsRequest>();
            _vouchersServiceMock.Setup(mock => mock.IsReasonCodeValid(It.IsAny<string>())).Returns(false);

            // Act
            var response = await _sut.AddCredits(request) as ObjectResult;

            // 
            response.Should().NotBeNull();
            response!.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
            _callCentreServiceMock.Verify(mock => mock.AddCredit(It.IsAny<AddCreditsRequest>()), Times.Never);
        }

        [Fact]
        public async Task AddCredits_ValidReasonInRequest_ReturnsCreditInfoInOKResponse()
        {
            // Arrange
            var request = _fixture.Create<AddCreditsRequest>();
            _vouchersServiceMock.Setup(mock => mock.IsReasonCodeValid(It.IsAny<string>())).Returns(true);

            // Act
            var response = await _sut.AddCredits(request) as ObjectResult;
            var value = response?.Value;

            // Assert
            response.Should().NotBeNull();
            response!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            value.Should().NotBeNull();
            _vouchersServiceMock.Verify(mock => mock.IsReasonCodeValid(It.IsAny<string>()), Times.Once);
            _callCentreServiceMock.Verify(mock => mock.AddCredit(It.IsAny<AddCreditsRequest>()), Times.Once);
        }

        [Fact]
        public async Task CreditBooking_RelaysRequest_ReturnsCreditInfoInOKResponse()
        {
            // Arrange
            var request = _fixture.Create<CreditBookingRequest>();

            // Act
            var response = await _sut.CreditBooking(request) as ObjectResult;
            var value = response?.Value;

            // Assert
            response.Should().NotBeNull();
            response!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            value.Should().NotBeNull();
            _callCentreServiceMock.Verify(mock => mock.CreditBooking(It.IsAny<CreditBookingRequest>()), Times.Once);
        }
    }
}
