using AutoFixture;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.ShortList;
using easyJet.Holidays.Api.Domain.Data.ShortList;
using easyJet.Holidays.Api.Domain.Interfaces.DiscountedOffer;
using easyJet.Holidays.Api.Domain.Interfaces.FreeNights;
using easyJet.Holidays.Api.Domain.Interfaces.ShortList;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Collections.ObjectModel;
using System.Net;
using static System.String;

namespace easyJet.Holidays.Api.Domain.Tests.Controllers
{
    public class ShortListControllerTests
    {
        private readonly IFixture _fixture;

        private readonly ShortListController _sut;

        private readonly Mock<IShortListServiceRepository> _shortListRepoMock = new();
        private readonly Mock<IPricesService> _pricesServiceMock = new();
        private readonly Mock<IFreeNightsService> _freeNightsServiceMock = new();
        private readonly Mock<ILuggageOfferService> _luggageOfferServiceMock = new();
        private readonly Mock<IPromotionCollectionsService> _promoCollectionServiceMock = new();
        private readonly Mock<IHbgHotelDiscountsService> _offerDiscountServiceMock = new();

        public ShortListControllerTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _sut = new ShortListController(
                _shortListRepoMock.Object,
                _pricesServiceMock.Object,
                _freeNightsServiceMock.Object,
                _luggageOfferServiceMock.Object,
                _promoCollectionServiceMock.Object,
                _offerDiscountServiceMock.Object
            );
        }

        [Fact]
        public async Task Get_GetsFromService_ReturnsRoundedAndEnrichedInOKResponse()
        {
            // Arrange
            var page = 2;
            var take = 25;
            var serviceResponse = new ShortListOffersResponse()
            {
                Offers = [new() { Accom = new Accom { Prom = Empty } }],
            };

            _shortListRepoMock.Setup(
                mock =>
                    mock.Get(It.IsAny<int>(), It.IsAny<int>())
            ).ReturnsAsync(serviceResponse);
            _freeNightsServiceMock.Setup(
                mock =>
                    mock.EnrichWithFreeNightsInfo(It.IsAny<IEnumerable<Offer>>())
            ).Returns(Task.CompletedTask);
            _promoCollectionServiceMock.Setup(
                mock =>
                    mock.EnrichWithPromotionCollectionsAsync(It.IsAny<IList<Offer>>())
            ).Returns(Task.CompletedTask);
            _offerDiscountServiceMock.Setup(
                mock => mock.EnrichOffersWithDiscounts(It.IsAny<List<Offer>>())
            ).Returns(Task.CompletedTask);

            // Act
            var response = await _sut.Get(page, take) as ObjectResult;
            var value = response!.Value;

            // Assert
            response.Should().NotBeNull();
            response.StatusCode.Should().Be((int)HttpStatusCode.OK);
            value.Should().NotBeNull();
            value.Should().Be(serviceResponse);
            _shortListRepoMock.Verify(
                mock =>
                    mock.Get(page, take),
                Times.Once()
            );
            _pricesServiceMock.Verify(x => x.RoundPrice(It.IsAny<List<Offer>>()), Times.Once);
            _freeNightsServiceMock.Verify(x => x.EnrichWithFreeNightsInfo(It.IsAny<IEnumerable<Offer>>()), Times.Once);
            _luggageOfferServiceMock.Verify(x => x.EnrichOffersWithComplimentaryLuggage(It.IsAny<IEnumerable<Offer>>()), Times.Once);
            _promoCollectionServiceMock.Verify(x => x.EnrichWithPromotionCollectionsAsync(It.IsAny<IList<Offer>>()), Times.Once);
            _offerDiscountServiceMock.Verify(x => x.EnrichOffersWithDiscounts(It.IsAny<List<Offer>>()), Times.Once);
        }

        [Fact]
        public async Task Get_GetsFromService_OnlyEnrichesOffersWithPrice()
        {
            // Arrange
            var pricedOffer = new Offer { Price = 100m, Accom = new Accom { Prom = Empty } };
            var zeroPriceOffer = new Offer { Price = 0m, Accom = new Accom { Prom = Empty } };
            var negativePriceOffer = new Offer { Price = -10m, Accom = new Accom { Prom = Empty } };
            var serviceResponse = new ShortListOffersResponse
            {
                Offers = [pricedOffer, zeroPriceOffer, negativePriceOffer],
            };
            ReadOnlyCollection<Offer>? capturedOffers = null;

            _shortListRepoMock.Setup(
                mock =>
                    mock.Get(It.IsAny<int>(), It.IsAny<int>())
            ).ReturnsAsync(serviceResponse);
            _freeNightsServiceMock.Setup(
                mock =>
                    mock.EnrichWithFreeNightsInfo(It.IsAny<IEnumerable<Offer>>())
            ).Returns(Task.CompletedTask);
            _promoCollectionServiceMock.Setup(
                mock =>
                    mock.EnrichWithPromotionCollectionsAsync(It.IsAny<IList<Offer>>())
            ).Returns(Task.CompletedTask);

            _offerDiscountServiceMock.Setup(
                mock => mock.EnrichOffersWithDiscounts(It.IsAny<IList<Offer>>()))
                .Callback<IList<Offer>>(offers => capturedOffers = new ReadOnlyCollection<Offer>(offers.ToList()))
                .Returns(Task.CompletedTask);
            
            // Act
            await _sut.Get();

            // Assert
            capturedOffers.Should().NotBeNull();
            capturedOffers!.Should().ContainSingle().Which.Should().Be(pricedOffer);
            capturedOffers.Should().OnlyContain(offer => offer.Price > 0);
        }

        [Fact]
        public async Task Summary_GetsFromService_ReturnsRoundedInOKResponse()
        {
            // Arrange
            var serviceResponse = new ShortListOffersResponse()
            {
                Offers = [new() { Accom = new Accom { Prom = Empty } }],
            };

            _shortListRepoMock.Setup(
                mock =>
                    mock.Summary(It.IsAny<ShortListType?>(), It.IsAny<bool>())
            ).ReturnsAsync(serviceResponse);

            // Act
            var response = await _sut.Summary(It.IsAny<ShortListType?>(), It.IsAny<bool>()) as ObjectResult;
            var value = response!.Value;

            // Assert
            response.Should().NotBeNull();
            response.StatusCode.Should().Be((int)HttpStatusCode.OK);
            value.Should().NotBeNull();
            value.Should().Be(serviceResponse);
            _shortListRepoMock.Verify(
                mock =>
                    mock.Summary(It.IsAny<ShortListType?>(), It.IsAny<bool>()),
                Times.Once()
            );
            _pricesServiceMock.Verify(x => x.RoundPrice(It.IsAny<List<Offer>>()), Times.Once);
        }

        [Fact]
        public async Task Create_CreatesWithService_ReturnsCreatedOrUpdatedInOKResponse()
        {
            // Arrange
            var accommodationID = "testAccomID";
            var theme = "testTheme";
            var request = new ShortListOfferRequest()
            {
                AccommodationId = accommodationID,
                ITheme = theme,
            };
            var serviceResponse = new ShortListStatus() { };
            _shortListRepoMock.Setup(
                mock =>
                    mock.CreateOrUpdate(request)
            ).ReturnsAsync(serviceResponse);

            // Act
            var response = await _sut.Create(request) as ObjectResult;
            var value = response?.Value;

            // Assert
            response.Should().NotBeNull();
            response!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            value.Should().NotBeNull();
            value.Should().Be(serviceResponse);
            _shortListRepoMock.Verify(
                mock =>
                    mock.CreateOrUpdate(It.Is<ShortListOfferRequest>(request =>
                        request.ShortListType == ShortListType.Offer &&
                        request.AccommodationId == accommodationID &&
                        request.ITheme == theme)),
                Times.Once
            );
        }

        [Fact]
        public async Task CreateHotel_CreatesWithService_ReturnsCreatedOrUpdatedInOKResponse()
        {
            // Arrange
            var giataId = "giataId";
            var theme = "testTheme";
            var request = new ShortListHotelRequest()
            {
                GiataCode = giataId,
                ITheme = theme,
            };
            _shortListRepoMock.Setup(
                mock =>
                    mock.CreateOrUpdate(It.IsAny<ShortListOfferRequest>())
            ).ReturnsAsync(new ShortListStatus());

            // Act
            var response = await _sut.CreateHotel(request) as ObjectResult;
            var value = response?.Value;

            // Assert
            response.Should().NotBeNull();
            response!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            value.Should().NotBeNull();
            _shortListRepoMock.Verify(
                mock =>
                    mock.CreateOrUpdate(It.Is<ShortListOfferRequest>(
                        paramRequest =>
                            paramRequest.ShortListType == ShortListType.Hotel &&
                            paramRequest.GiataCode.Equals(giataId) &&
                            paramRequest.ITheme == theme
                    )), Times.Once
            );
        }

        [Fact]
        public async Task Delete_DeletesWithService_ReturnsDeletedInOKResponse()
        {
            // Arrange
            var request = new List<string>();
            _shortListRepoMock.Setup(
                mock =>
                    mock.Delete(It.IsAny<List<string>>())
            ).ReturnsAsync(new ShortListStatus());

            // Act
            var response = await _sut.Delete(request) as ObjectResult;
            var value = response?.Value;

            // Assert
            response.Should().NotBeNull();
            response!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            value.Should().NotBeNull();
            _shortListRepoMock.Verify(mock => mock.Delete(request));
        }

        [Fact]
        public async Task Status_GetsStatusFromService_ReturnsStatusInOKResponse()
        {
            // Arrange
            var serviceResponseStatus = new ShortListStatus();
            _shortListRepoMock.Setup(
                mock =>
                    mock.Status()
            ).ReturnsAsync(serviceResponseStatus);

            // Act
            var response = await _sut.Status() as ObjectResult;
            var value = response?.Value;

            // Assert
            response.Should().NotBeNull();
            response!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            value.Should().NotBeNull();
            value.Should().Be(serviceResponseStatus);
            _shortListRepoMock.Verify(x => x.Status(), Times.Once);
        }

        [Fact]
        public async Task HotelStatus_GetsStatusFromService_ReturnsStatusInOKResponse()
        {
            // Arrange
            var accomCode = "testCode123";
            var serviceResponseStatus = new ShortListStatus();
            _shortListRepoMock.Setup(
                mock =>
                    mock.HotelStatus(It.IsAny<string>())
            ).ReturnsAsync(serviceResponseStatus);

            // Act
            var response = await _sut.HotelStatus(accomCode) as ObjectResult;
            var value = response?.Value;

            // Assert
            response.Should().NotBeNull();
            response!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            value.Should().NotBeNull();
            value.Should().Be(serviceResponseStatus);
            _shortListRepoMock.Verify(mock => mock.HotelStatus(accomCode));
        }
    }
}
