using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers.Interfaces;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Promotions;
using easyJet.Holidays.Api.Domain.Services.AmendBooking;
using easyJet.Holidays.Api.Domain.Services.Offers;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking;

public class AmendPromocodeHandlerServiceTests
{
    private readonly Mock<IBookingRepository> _bookingRepositoryMock = new();
    private readonly Mock<IPromotionValidatorService> _promotionValidatorServiceMock = new();
    private readonly Mock<IValidateBookingResponseMapper> _validateBookingResponseMapperMock = new();
    private readonly Mock<IHotelOfferService> _hotelOfferServiceMock = new();

    private IAmendPromocodeHandlerService _amendPromocodeHandlerService;

    public AmendPromocodeHandlerServiceTests()
    {
        _amendPromocodeHandlerService = new AmendPromocodeHandlerService(
            _bookingRepositoryMock.Object,
            _promotionValidatorServiceMock.Object,
            _validateBookingResponseMapperMock.Object,
            _hotelOfferServiceMock.Object);
    }

    [Fact]
    public async Task GetAtcomPromocode_ShouldEnrichOfferWithHotelData()
    {
        // arrange
        _validateBookingResponseMapperMock.Setup(x => x.MapToOffer(It.IsAny<ValidateAmendBookingResponse>())).ReturnsAsync(new Offer());

        // act
        await _amendPromocodeHandlerService.GetAtcomPromocode(new BookingResponse(), new ValidateAmendBookingResponse());

        // assert
        _hotelOfferServiceMock.Verify(x => x.EnrichHotelData(It.IsAny<Offer>()));
    }
}
