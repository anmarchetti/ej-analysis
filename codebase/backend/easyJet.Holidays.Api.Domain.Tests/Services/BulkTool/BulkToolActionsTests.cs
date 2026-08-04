using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Services.BulkTool;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.BulkTool
{
    public class BulkToolActionsTests
    {
        private readonly BulkToolActions _bulkToolActions;

        public BulkToolActionsTests()
        {
            var fixture = FixtureUtils.AutoMoqFixture();
            var bookingRepository = fixture.Freeze<Mock<IBookingRepository>>();
            var customersRepository = fixture.Freeze<Mock<IVouchersCustomerRepository>>();
            var bookingPaymentsService = fixture.Freeze<Mock<IBookingRefundService>>();
            var vouchersService = fixture.Freeze<Mock<IVouchersService>>();
            var logger = fixture.Freeze<Mock<ILogger<Domain.Services.BulkTool.BulkToolBookingService>>>();

            var apiSettings = Options.Create(new ApiSettings());

            var bulkToolSettings = Options.Create(new BulkToolSettings()
            {
                SupportedCommandsForExternalAgency = new[] { "cancel", "memo" },
                BookingCodes = new BookingCodesSettings()
                {
                    BookingAlreadyCanceled = "BookingAlreadyCanceledTest",
                    BookingNotFound = "BookingNotFoundTest"
                },
                AddCreditByEmail = new AddCreditByEmailSettings(),
                CancelAndCredit = new CancelAndCreditSettings(),
                Commands = new CommandsSettings(),
                Messages = new MessagesSettings(),
                Statuses = new StatusesSettings(),
            });

            _bulkToolActions = new BulkToolActions(bookingRepository.Object, bookingPaymentsService.Object,
                vouchersService.Object, customersRepository.Object, apiSettings, bulkToolSettings,
                logger.Object);
        }

        [Fact]
        public async Task ValidateBooking_ThrowException_ExternalAgencyAndCommandNotSpecified()
        {
            // Arrange
            var bookingResponse = new BookingResponse() { IsExternalAgency = true, BookingStatus = "StatusTest" };
            bookingResponse.IsExternalAgency = true;

            // Assert
            var apiException = await Assert.ThrowsAsync<ApiException>(() => _bulkToolActions.ValidateBooking(bookingResponse));
            apiException.Message.Should().Be("It is a trade booking");
        }

        [Theory]
        [InlineData("cancel and credit")]
        [InlineData("cancel and refund")]
        [InlineData("refund")]
        [InlineData("add credit")]
        [InlineData("undo credit")]
        public async Task ValidateBooking_ThrowException_ExternalAgencyAndNotSupportedCommandSpecified(string command)
        {
            // Arrange
            var bookingResponse = new BookingResponse() { IsExternalAgency = true, BookingStatus = "StatusTest" };
            bookingResponse.IsExternalAgency = true;

            // Assert
            var apiException = await Assert.ThrowsAsync<ApiException>(() => _bulkToolActions.ValidateBooking(bookingResponse, false, command));
            apiException.Message.Should().Be($"Unsupported command for external agency booking: {command}");
        }

    }
}