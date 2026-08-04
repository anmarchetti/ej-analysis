using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers.Interfaces;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Promotions;
using easyJet.Holidays.Api.Domain.Services.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendBookingDate;

public class AmendDatesPromocodeHandlerServiceTests
{
    private readonly Mock<IPromotionValidatorService> _promotionValidatorServiceMock = new();
    private readonly Mock<IBookingRepository> _bookingRepositoryMock = new();
    private readonly AmendPromocodeHandlerService _sut;
    private readonly Mock<IValidateBookingRequestMapper> _validateBookingRequestMapperMock = new();
    private readonly Mock<IValidateBookingResponseMapper> _validateBookingResponseMapperMock = new();
    private readonly Mock<IVouchersService> _vouchersServiceMock = new();
    private readonly Mock<IHotelOfferService> _hotelOfferServiceMock = new();
    private readonly IOptions<AtcomSettings> _atcomSettings;

    public AmendDatesPromocodeHandlerServiceTests()
    {
        _atcomSettings = Options.Create(new AtcomSettings
        {
            PromotionsCodeName = "promo code",
            PromoCodeErrorCodesToIgnore = new Dictionary<string, string>
                {
                    {"code-1", "desc" }
                }
        });
        _sut = new AmendPromocodeHandlerService(
            _bookingRepositoryMock.Object,
            _promotionValidatorServiceMock.Object,
            _validateBookingResponseMapperMock.Object,
            _hotelOfferServiceMock.Object
            );
    }

    [Theory]
    [MemberData(nameof(GetData))]
    public async Task HandlePromocodeError_SitecoreErrors_ReturnOriginalResponse(Offer offer, BookingResponse bookingWithOffer, BookingResponse originalBooking, ValidateAmendBookingResponse validateAmendBookingResponse, ValidateAmendBookingResponse expected)
    {
        //Arrange
        _promotionValidatorServiceMock.Setup(x => x.GetAtcomPromoCode(It.IsAny<Offer>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new Domain.Data.Promotion.CmsPromocode { Promocode = string.Empty, ValidationResults = new ApiError[] { new ApiError { Code = "atcomError1" } } })
            .Verifiable();

        _bookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false)).Verifiable();
        _validateBookingResponseMapperMock.Setup(x => x.MapToOffer(validateAmendBookingResponse)).ReturnsAsync(new Offer());

        // Act            
        var response = await _sut.HandlePromocode(bookingWithOffer, originalBooking, validateAmendBookingResponse);
        //Assert
        response.BookingReference.Should().BeEquivalentTo(expected.BookingReference);
        _bookingRepositoryMock.Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false), Times.Never);
        _promotionValidatorServiceMock.Verify(x => x.GetAtcomPromoCode(It.IsAny<Offer>(), It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Theory]
    [MemberData(nameof(GetDataError))]
    public async Task HandlePromocodeError_AtcomError_ReturnOriginalBookingResponse(Offer offer, BookingResponse bookingWithOffer, BookingResponse originalBooking, ValidateAmendBookingResponse validateAmendBookingResponse, ValidateAmendBookingResponse newValidateAmendBookingResponse, ValidateAmendBookingResponse expected)
    {
        var newPromo = "new-promocode";
        //Arrange
        _promotionValidatorServiceMock.Setup(x => x.GetAtcomPromoCode(It.IsAny<Offer>(), It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(new Domain.Data.Promotion.CmsPromocode { Promocode = newPromo }).Verifiable();
        _bookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false)).ReturnsAsync(validateAmendBookingResponse).Verifiable();
        _validateBookingResponseMapperMock.Setup(x => x.MapToOffer(validateAmendBookingResponse)).ReturnsAsync(new Offer());

        // Act            
        var response = await _sut.HandlePromocode(bookingWithOffer, originalBooking, validateAmendBookingResponse);

        //Assert
        response.BookingReference.Should().BeEquivalentTo(expected.BookingReference);
        bookingWithOffer.AmendmentInfo.PromoCode.Should().BeEquivalentTo(newPromo);
        _bookingRepositoryMock.Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false), Times.Once);
        _promotionValidatorServiceMock.Verify(x => x.GetAtcomPromoCode(It.IsAny<Offer>(), It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Theory]
    [MemberData(nameof(GetDataSuccess))]
    public async Task HandlePromocodeError_NoError_ReturnNewResponse(Offer offer, BookingResponse bookingWithOffer, BookingResponse originalBooking, ValidateAmendBookingResponse validateAmendBookingResponse, ValidateAmendBookingResponse newValidateAmendBookingResponse, ValidateAmendBookingResponse expected)
    {
        var newPromo = "new-promocode";
        //Arrange
        _promotionValidatorServiceMock.Setup(x => x.GetAtcomPromoCode(It.IsAny<Offer>(), It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(new Domain.Data.Promotion.CmsPromocode { Promocode = newPromo }).Verifiable();
        _bookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false)).ReturnsAsync(validateAmendBookingResponse).Verifiable();
        _validateBookingResponseMapperMock.Setup(x => x.MapToOffer(validateAmendBookingResponse)).ReturnsAsync(new Offer());

        // Act            
        var response = await _sut.HandlePromocode(bookingWithOffer, originalBooking, validateAmendBookingResponse);

        //Assert
        response.BookingReference.Should().BeEquivalentTo(expected.BookingReference);
        bookingWithOffer.AmendmentInfo.PromoCode.Should().BeEquivalentTo(newPromo);
        _bookingRepositoryMock.Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false), Times.Once);
        _promotionValidatorServiceMock.Verify(x => x.GetAtcomPromoCode(It.IsAny<Offer>(), It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    public static IEnumerable<object[]> GetData()
    {
        yield return new object[]
        {
                new Offer
                {

                },
                new BookingResponse
                {

                },
                new BookingResponse
                {
                    Package = new BookingPackage
                    {
                        Accom = new BookingAccommodation
                        {
                            StartDate = "2024-01-01",
                            EndDate = "2024-01-04"

                        }
                    }
                },
                new ValidateAmendBookingResponse
                {
                    ApiErrors = Array.Empty<ApiError>(),
                    BookingDate = DateTimeOffset.UtcNow,
                    BookingReference = "1",
                    PaymentInfo = new PriceInfo
                    {
                        BookingPriceEx = 900,
                    }
                },

                new ValidateAmendBookingResponse
                {
                    ApiErrors = new ApiError[0],
                    PaymentInfo = new PriceInfo
                    {
                        BookingPriceEx = 900,
                    },
                    BookingReference = "1"
                }
        };
    }
    public static IEnumerable<object[]> GetDataError()
    {
        yield return new object[]
        {
                new Offer
                {

                },
                new BookingResponse
                {
                    AmendmentInfo = new AmendmentsInfo{}
                },
                new BookingResponse
                {
                    Package = new BookingPackage
                    {
                        Accom = new BookingAccommodation
                        {
                            StartDate = "2024-01-01",
                            EndDate = "2024-01-04"

                        }
                    }
                },
                new ValidateAmendBookingResponse
                {
                    ApiErrors = new ApiError[] { new ApiError { Code = "code-1", Message = "desc" } },
                    BookingDate = DateTimeOffset.UtcNow,
                    BookingReference = "1",
                    PaymentInfo = new PriceInfo
                    {
                        BookingPriceEx = 1000,
                    }
                },
                new ValidateAmendBookingResponse
                {
                    ApiErrors = new ApiError[] { new ApiError { Code = "code-1", Message = "desc" } },
                    BookingReference = "1",
                    PaymentInfo = new PriceInfo
                    {
                        BookingPriceEx = 900,
                    }
                },
                new ValidateAmendBookingResponse
                {
                    ApiErrors = Array.Empty<ApiError>(),
                    BookingReference = "1",
                    PaymentInfo = new PriceInfo
                    {
                        BookingPriceEx = 900,
                    }
                }
        };
    }

    public static IEnumerable<object[]> GetDataSuccess()
    {
        yield return new object[]
        {
                new Offer
                {

                },
                new BookingResponse
                {
                    AmendmentInfo = new AmendmentsInfo{}
                },
                new BookingResponse
                {
                    Package = new BookingPackage
                    {
                        Accom = new BookingAccommodation
                        {
                            StartDate = "2024-01-01",
                            EndDate = "2024-01-04"

                        }
                    }
                },
                new ValidateAmendBookingResponse
                {
                    ApiErrors = Array.Empty<ApiError>(),
                    BookingDate = DateTimeOffset.UtcNow,
                    BookingReference = "1",
                    PaymentInfo = new PriceInfo
                    {
                        BookingPriceEx = 1000,
                    }
                },
                new ValidateAmendBookingResponse
                {
                    ApiErrors = Array.Empty<ApiError>(),
                    BookingReference = "1",
                    PaymentInfo = new PriceInfo
                    {
                        BookingPriceEx = 900,
                    }
                },
                new ValidateAmendBookingResponse
                {
                    ApiErrors = Array.Empty<ApiError>(),
                    BookingReference = "1",
                    PaymentInfo = new PriceInfo
                    {
                        BookingPriceEx = 900,
                    }
                }
        };
    }
}