using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking
{
    public class BookingBlockCheckerServiceTests
    {
        private readonly Mock<ISettingsService> _settingsServiceMock;
        private readonly ApiSettings _apiSettings;
        private readonly BookingBlockCheckerService _sut;

        public BookingBlockCheckerServiceTests()
        {
            _settingsServiceMock = new Mock<ISettingsService>();
            _settingsServiceMock.Setup(x => x.GetCancelCreditSettings())
                .ReturnsAsync(new CreditAndCashRefundSettings { AllowedAmountOfFailures = 1 });
            _apiSettings = new ApiSettings
            {
                BookingsMemos = new BookingsMemosSettings { FailedCancellation = new MemoSettings { Code = "CF" } }
            };
            _sut = new BookingBlockCheckerService(_settingsServiceMock.Object, Options.Create(_apiSettings));
        }

        [Theory]
        [InlineData(null, null, false)]
        [InlineData("OTHER", "Amount of cancellation failures: 5", false)]
        [InlineData("CF", "Amount of cancellation failures: 1", true)]
        [InlineData("CF", "Amount of cancellation failures: 2", true)]
        [InlineData("CF", "Amount of cancellation failures: 7   ", true)]
        [InlineData("CF", "Amount of cancellation failures", false)]
        [InlineData("CF", null, false)]
        public async Task CheckIfBookingIsBlocked_ShouldReturnExpectedValue(string memoCode, string memoText,
            bool expected)
        {
            var booking = new BookingResponse
            {
                Memo = memoCode == null
                    ? new List<Memo>()
                    : new List<Memo> { new Memo { Code = memoCode, Text = memoText } }
            };
            var result = await _sut.CheckIfBookingIsBlocked(booking);
            result.Should().Be(expected);
        }

        [Fact]
        public async Task CheckIfBookingIsBlocked_ShouldUseConfiguredFailedMemoCodeCaseInsensitively()
        {
            var booking = new BookingResponse
            {
                Memo = new List<Memo> { new Memo { Code = "cf", Text = "Amount of cancellation failures: 2" } }
            };
            var result = await _sut.CheckIfBookingIsBlocked(booking);
            result.Should().BeTrue();
        }

        [Fact]
        public async Task CheckIfBookingIsBlocked_ShouldUseAllowedAmountOfFailuresFromSettings()
        {
            _settingsServiceMock.Setup(x => x.GetCancelCreditSettings())
                .ReturnsAsync(new CreditAndCashRefundSettings { AllowedAmountOfFailures = 4 });
            var booking = new BookingResponse
            {
                Memo = new List<Memo> { new Memo { Code = "CF", Text = "Amount of cancellation failures: 3" } }
            };
            var result = await _sut.CheckIfBookingIsBlocked(booking);
            result.Should().BeFalse();
        }
    }
}