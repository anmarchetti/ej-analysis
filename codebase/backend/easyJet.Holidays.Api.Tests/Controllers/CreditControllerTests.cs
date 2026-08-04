using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;

namespace easyJet.Holidays.Api.Tests.Controllers
{
    public class CreditControllerTests
    {
        private readonly Mock<IVouchersService> _vouchersServiceMock = new();
        private readonly Mock<IMarketService> _marketServiceMock = new();
        private readonly IOptions<ApiSettings> _apiSettings;
        private readonly CreditController _sut;

        public CreditControllerTests()
        {
            _apiSettings = Options.Create(new ApiSettings { Vouchers = new VoucherSettings { IsActive = true } });

            _sut = new CreditController(
                _vouchersServiceMock.Object,
                _apiSettings,
                _marketServiceMock.Object);
        }

        [Fact]
        public async Task CustomerCredits_VouchersInactive_ReturnsEmptyCreditInfo()
        {
            // Arrange
            _apiSettings.Value.Vouchers.IsActive = false;

            // Act
            var result = await _sut.CustomerCredits() as OkObjectResult;

            // Assert
            result!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            var creditInfo = result.Value as MyCreditInfo[];
            creditInfo.Should().NotBeNull();
            creditInfo!.Length.Should().Be(1);
            creditInfo[0].Balance.Should().Be(0);
            creditInfo[0].Currency.Should().BeNull();
            creditInfo[0].HasCreditHistory.Should().BeFalse();
            creditInfo[0].CreditIsEnabled.Should().BeFalse();
        }

        [Fact]
        public async Task CreditHistory_VouchersInactive_ReturnsEmptyHistory()
        {
            // Arrange
            _apiSettings.Value.Vouchers.IsActive = false;

            // Act
            var result = await _sut.CreditHistory() as OkObjectResult;

            // Assert
            result!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            var history = result.Value as Dictionary<string, IEnumerable<CreditHistoryItem>>;
            history.Should().NotBeNull();
            history.Should().BeEmpty();
        }
    }
}