using AutoFixture;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.LivePrice;
using easyJet.Holidays.Api.Domain.Interfaces.Promotions;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Net;

namespace easyJet.Holidays.Api.Domain.Tests.Controllers
{
    public class LivePriceControllerTests
    {
        private readonly IFixture _fixture;

        private readonly LivePriceController _sut;

        private readonly Mock<ILivePriceService> _livePriceServiceMock;
        private readonly Mock<IPricesService> _pricesServiceMock;
        private readonly Mock<IPromotionValidatorService> _promotionValidatorMock;
        private readonly Mock<IHotelsService> _hotelsServiceMock;

        public LivePriceControllerTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();

            _livePriceServiceMock = _fixture.Create<Mock<ILivePriceService>>();
            _pricesServiceMock = _fixture.Create<Mock<IPricesService>>();
            _hotelsServiceMock = _fixture.Create<Mock<IHotelsService>>();
            _promotionValidatorMock = _fixture.Create<Mock<IPromotionValidatorService>>();
            _promotionValidatorMock = _fixture.Create<Mock<IPromotionValidatorService>>();

            _sut = new LivePriceController(
                _livePriceServiceMock.Object,
                _pricesServiceMock.Object,
                _hotelsServiceMock.Object,
                _promotionValidatorMock.Object
            );
        }

        [Fact]
        public async Task Get_CallsUnderlyingServices_ReturnsLivePriceSummaryInOKResponse()
        {
            // Arrange
            var codes = "[Geo1],[Geo2].[Test Search]";

            // Act
            var response = await _sut.Get(codes, true, true) as ObjectResult;

            // Assert
            response.Should().NotBeNull();
            response!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            _livePriceServiceMock.Verify(mock => mock.GetPrice(It.IsAny<IEnumerable<string>>()), Times.Once);
            _promotionValidatorMock.Verify(mock => mock.ExtendOffersWithPromotions(It.IsAny<List<LivePriceSummaryModel>>(), It.IsAny<IEnumerable<Hotel>>()), Times.Once);
            _pricesServiceMock.Verify(mock => mock.RoundPrice(It.IsAny<List<LivePriceSummaryModel>>()), Times.Once);
        }
    }
}
