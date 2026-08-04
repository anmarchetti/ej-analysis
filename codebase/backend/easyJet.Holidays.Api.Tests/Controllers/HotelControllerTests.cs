using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.AirportParking;
using easyJet.Holidays.Api.Domain.Interfaces.BoardUpgrades;
using easyJet.Holidays.Api.Domain.Interfaces.DiscountedOffer;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.Api.Domain.Interfaces.FreeNights;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Interfaces.Seats;
using easyJet.Holidays.Api.Domain.Interfaces.ShortList;
using easyJet.Holidays.Api.Domain.Monitoring;
using easyJet.Holidays.Api.Domain.Monitoring.Analytics;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Atcom.Services.TouristTax;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace easyJet.Holidays.Api.Tests.Controllers
{
    public class HotelControllerTests
    {
        private readonly HotelController _sut;

        private readonly Mock<IAccommodationOfferService> _accommodationOfferService = new();
        private readonly Mock<IHotelsService> _hotelsService = new();
        private readonly Mock<ITripAdvisorAdaptor> _tripAdvisorAdaptor = new();
        private readonly Mock<ITransfersFilterService> _transfersFilterService = new();
        private readonly Mock<IPricesService> _pricesService = new();
        private readonly Mock<IErrataInfoService> _errataInfoService = new();
        private readonly Mock<IFreeNightsService> _freeNightsService = new();
        private readonly Mock<IBoardUpgradeService> _boardUpgradeService = new();
        private readonly Mock<IShortListServiceRepository> _shortListServiceRepository = new();
        private readonly Mock<ILanguageService> _languageService = new();
        private readonly Mock<ISeatingService> _seatingService = new();
        private readonly Mock<ILuggageOfferService> _luggageOfferService = new();
        private readonly Mock<IMarketService> _marketService = new();
        private readonly Mock<IMetricsService> _metricsService = new();
        private readonly Mock<IAirportParkingService> _airportParkingService = new();
        private readonly Mock<IOtelAnalyticsService> _otelAnalyticsService = new();
        private readonly Mock<IPromotionCollectionsService> _promotionCollectionsService  = new();
        private readonly Mock<IHbgHotelDiscountsService> _offerDiscountService = new();

        public HotelControllerTests()
        {
            _sut = new HotelController(_accommodationOfferService.Object, _hotelsService.Object, _tripAdvisorAdaptor.Object, _transfersFilterService.Object, _pricesService.Object,
                _errataInfoService.Object, _freeNightsService.Object, _boardUpgradeService.Object, _shortListServiceRepository.Object, _languageService.Object, _seatingService.Object, _luggageOfferService.Object,
                _marketService.Object, _metricsService.Object, _otelAnalyticsService.Object, _airportParkingService.Object, _promotionCollectionsService.Object, _offerDiscountService.Object);
        }

        [Fact]
        public async Task Offers_WhenExecuted_AirportParkingServiceIsCalled()
        {
            // Arrange

            var accommodationOfferRequest = new AccommodationOfferRequest();
            _marketService.Setup(x => x.GetCurrentMarket()).Returns(new MarketSettings());
            var accommodationOffersResponse = new AccommodationOffersResponse { Offers = [new Offer(), new Offer()] };
            _accommodationOfferService.Setup(x => x.BuildOffer(accommodationOfferRequest)).ReturnsAsync(accommodationOffersResponse);
            _offerDiscountService.Setup(x => x.EnrichOffersWithDiscounts(It.IsAny<List<Offer>>())).Returns(Task.CompletedTask);

            // Act

            var response = await _sut.Offers(accommodationOfferRequest);

            // Assert
            response.Should().BeOfType<OkObjectResult>();
            _airportParkingService.Verify(x => x.EnrichOffersWithParking(It.IsAny<IList<Offer>>(), It.IsAny<string>()), Times.Once);
            _offerDiscountService.Verify(x => x.EnrichOffersWithDiscounts(It.IsAny<List<Offer>>()), Times.Once);
        }
    }
}