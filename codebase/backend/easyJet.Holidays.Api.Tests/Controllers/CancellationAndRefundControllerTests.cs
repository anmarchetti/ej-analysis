using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;

namespace easyJet.Holidays.Api.Tests.Controllers
{
    public class CancellationAndRefundControllerTests
    {
        private readonly Mock<IBulkToolBookingService> _bulkToolServiceMock;
        private readonly Mock<IOptions<BulkToolSettings>> _optionsMock;

        private readonly CancellationAndRefundController _sut;

        public CancellationAndRefundControllerTests()
        {
            _bulkToolServiceMock = new Mock<IBulkToolBookingService>();
            _optionsMock = new Mock<IOptions<BulkToolSettings>>();

            _optionsMock.Setup(mock => mock.Value).Returns(new BulkToolSettings()
            {
                IsEnabled = false,
                ReferralUrl = new Uri("https://someInstance.of.ah.com/")
            });

            _sut = new CancellationAndRefundController(
                _bulkToolServiceMock.Object,
                _optionsMock.Object
            );
        }

        [Fact]
        public async Task CancelAndRefund_WhenBulkToolIsDisabled_ReturnsDecommissionNoticeResponse()
        {
            // Arrange

            // Act 
            var result = await _sut.CancelAndRefund(new BulkToolRequest()) as OkObjectResult;

            // Assert
            result.Should().NotBeNull();
            result!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            _bulkToolServiceMock.Verify(mock => mock.RunBulkProcess(It.IsAny<BulkToolRequest>(), It.IsAny<string>()), Times.Never);
        }
    }
}