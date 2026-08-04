using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Interfaces.Promotions;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;

namespace easyJet.Holidays.Api.Tests.Controllers;

/// <summary>
/// Unit tests for voucher API endpoints.
/// </summary>
public class VoucherControllerTests
{
    private readonly Mock<IVouchersService> _vouchersServiceMock = new();
    private readonly VoucherController _sut;

    public VoucherControllerTests()
    {
        _sut = new VoucherController(
            Mock.Of<IPromotionValidatorService>(),
            _vouchersServiceMock.Object,
            Options.Create(new ApiSettings { Vouchers = new VoucherSettings { IsActive = true } }),
            Mock.Of<IReferenceDataService>());
    }

    [Fact]
    public async Task GetSingleUsePromoCode_ReturnsCodeFromVouchersService()
    {
        _vouchersServiceMock
            .Setup(service => service.GetSingleUsePromoCode("campaign-1"))
            .ReturnsAsync("PROMO-1");

        var result = await _sut.GetSingleUsePromoCode("campaign-1") as OkObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be((int)HttpStatusCode.OK);
        result.Value.Should().Be("PROMO-1");
        _vouchersServiceMock.Verify(service => service.GetSingleUsePromoCode("campaign-1"), Times.Once);
    }
}
