using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers.Interfaces;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Promotion;
using easyJet.Holidays.Api.Domain.Data.Transfers;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Repository;
using easyJet.Holidays.Api.Domain.Services.AmendBooking;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendBookingFlights;

public class AmendBookingTransfersServiceTests
{
    private IFixture _fixture { get; set; }
    private readonly Mock<IBookingRepository> _bookingRepositoryMock = new();
    private readonly Mock<IAuthenticationService> _authenticationServiceMock = new();
    private readonly Mock<ITransferService> _transferServiceMock = new();
    private readonly Mock<ITradeAgentAuthenticationService> _tradeAgentAuthServiceMock = new();

    private readonly Mock<ILogger<AmendBookingTransfersService>> _loggerMock = new();

    private readonly IAmendBookingTransfersService _sut;
    private readonly Mock<IBookingResponseOfferMapper> _bookingResponseOfferMapper = new();
    private readonly Mock<IValidateBookingRequestMapper> _validateBookingRequestMapper = new();
    private readonly Mock<IValidateBookingResponseMapper> _validateBookingResponseMapperMock = new();
    private readonly Mock<IHotelOfferService> _hotelOfferServiceMock = new();
    private readonly Mock<IAmendPromocodeHandlerService> _amendDatesPromocodeHandlerServiceMock = new();
    private readonly Mock<IAmendBookingRepository> _amendBookingRepositoryMock = new();

    public AmendBookingTransfersServiceTests()
    {
        _fixture = FixtureUtils.AutoMoqFixture();
        _loggerMock = _fixture.Freeze<Mock<ILogger<AmendBookingTransfersService>>>();
        _sut = new AmendBookingTransfersService(
            _authenticationServiceMock.Object,
            _bookingRepositoryMock.Object,
            _transferServiceMock.Object,
            _bookingResponseOfferMapper.Object,
            _loggerMock.Object,
            _tradeAgentAuthServiceMock.Object,
            _validateBookingResponseMapperMock.Object,
            _amendDatesPromocodeHandlerServiceMock.Object,
            _amendBookingRepositoryMock.Object
        );
    }

    [Theory]
    [MemberData(nameof(GetAmendTransfersPriceTestData))]
    public async Task GetAmendTransfersPrice_ValidInput_ReturnAmendBookingTransfersResponse(
        AmendBookingTransfersRequest testInputData, AmendBookingTransfersResponse expectedResult,
        decimal amendmentCharges, PromoCodeBreakDown promoCodeBreakDown)
    {
        // Arrange
        _bookingRepositoryMock.Setup(repository => repository.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new BookingResponse
            {
                AmendmentInfo = new AmendmentsInfo
                {
                    Transfer = new AmendItem
                    {
                        AmendAllow = true
                    }
                }
            });
        _amendBookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
            .ReturnsAsync(new ValidateAmendBookingResponse())
            .Verifiable();

        _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _amendBookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
            .ReturnsAsync(new ValidateAmendBookingResponse { PaymentInfo = new PriceInfo { AmendmentCharges = amendmentCharges } });

        //Act
        var result = await _sut.GetAmendTransfersPrice(testInputData);

        //Assert
        _amendBookingRepositoryMock.Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()), Times.Once);
    }

    [Fact]
    public async Task GetAmendTransfersPrice_BookingResponseNotAllowAmend_ThrowsApiException()
    {
        // Arrange
        _bookingRepositoryMock.Setup(repository => repository
                .GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new BookingResponse
            {
                AmendmentInfo = new AmendmentsInfo
                {
                    Transfer = new AmendItem
                    {
                        AmendAllow = false
                    }
                }
            });

        _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);

        //Act
        Func<Task> act = () =>
            _sut.GetAmendTransfersPrice(new AmendBookingTransfersRequest { });

        //Assert
        await act.Should().ThrowAsync<ApiException>().WithMessage("Transfers modification prohibited");
    }

    [Fact]
    public async Task GetAmendTransfersPrice_NotLoggedAsLeadPassanger_ThrowsApiException()
    {
        // Arrange
        _bookingRepositoryMock.Setup(repository => repository
                .GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new BookingResponse
            {
                AmendmentInfo = new AmendmentsInfo
                {
                    Transfer = new AmendItem
                    {
                        AmendAllow = true
                    }
                }
            });

        _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(false);

        //Act
        Func<Task> act = () =>
            _sut.GetAmendTransfersPrice(new AmendBookingTransfersRequest { });

        //Assert
        await act.Should().ThrowAsync<ApiException>()
            .WithMessage("Customer is not logged in or is not the lead passenger for the booking");
    }

    [Fact]
    public async Task GetAmendTransfersPrice_ThrowsExceptionForNonTradeAgentWithTradePortalBooking()
    {
        // Arrange
        _bookingRepositoryMock.Setup(repository => repository
                .GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new BookingResponse
            {
                AmendmentInfo = new AmendmentsInfo
                {
                    Transfer = new AmendItem
                    {
                        AmendAllow = true
                    }
                },
                IsExternalAgency = true
            });

        _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _tradeAgentAuthServiceMock.Setup(x => x.IsLoggedInAsTradeAgent()).Returns(false);

        //Act
        Func<Task> act = () =>
            _sut.GetAmendTransfersPrice(new AmendBookingTransfersRequest { });

        //Assert
        await act.Should().ThrowAsync<ApiException>()
            .WithMessage("Only trade agents can amend Trade Portal booking");
    }

    [Fact]
    public async Task GetAmendTransfersPrice_AtcomReturnsError_ReturnsNull()
    {
        // Arrange
        _bookingRepositoryMock.Setup(repository => repository
                .GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new BookingResponse
            {
                AmendmentInfo = new AmendmentsInfo
                {
                    Transfer = new AmendItem
                    {
                        AmendAllow = true
                    }
                }
            });

        _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _tradeAgentAuthServiceMock.Setup(x => x.IsLoggedInAsTradeAgent()).Returns(false);

        _amendBookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>())).Returns(Task.FromResult<ValidateAmendBookingResponse>(null));
        _validateBookingResponseMapperMock.Setup(x => x.MapToAmendTransferItem(It.IsAny<BookingResponse>(), It.IsAny<TransferItem>(), It.IsAny<ValidateAmendBookingResponse>())).Verifiable();
        //Act
        var result =
            await _sut.GetAmendTransfersPrice(new AmendBookingTransfersRequest { Transfers = new List<TransferItem> { new TransferItem { Code = "Private" } } });

        //Assert
        result.Transfers.Should().BeEmpty();
        _validateBookingResponseMapperMock.Verify(x => x.MapToAmendTransferItem(It.IsAny<BookingResponse>(), It.IsAny<TransferItem>(), It.IsAny<ValidateAmendBookingResponse>()), Times.Never);
    }

    [Theory]
    [MemberData(nameof(GetAlternativeTransfersWithPricePromoRemovedTestData))]
    public async Task GetAlternativeTransfersWithPrice_ValidInput_Promo_Removed_ReturnAmendBookingTransfersResponse(AlternativeTransfersSearchRequest testInputData,
        AmendBookingTransfersResponse expectedResult, BookingResponse bookingResponse, ValidateAmendBookingResponse validateAmendBookingResponse,
        TransferItem transfers, ValidatePromotion validatePromotion, Offer offer, PromoCodeBreakDown promoCodeBreakDown)
    {
        // Arrange
        _bookingRepositoryMock.Setup(repository => repository
                .GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(bookingResponse);
        _bookingRepositoryMock.Setup(x => x.GetBookingMemo(It.IsAny<string>())).ReturnsAsync(new List<Memo>
        {
            new () {Code = "Test_Memo"}
        });
        _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _validateBookingRequestMapper.Setup(x => x.BuildValidateBookingRequest(It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>())).Returns(new ValidateBookingRequest { Offer = new Offer() });

        _amendBookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(
                It.IsAny<BookingResponse>(),
                It.IsAny<bool>()))
            .ReturnsAsync(validateAmendBookingResponse).Verifiable();

        _amendDatesPromocodeHandlerServiceMock.Setup(x => x.HandlePromocode(
                It.IsAny<BookingResponse>(),
                It.IsAny<BookingResponse>(),
                It.IsAny<ValidateAmendBookingResponse>()))
                .ReturnsAsync(validateAmendBookingResponse).Verifiable();

        _validateBookingResponseMapperMock
            .Setup(x => x.MapToAmendTransferItem(It.IsAny<BookingResponse>(), It.IsAny<TransferItem>(), It.IsAny<ValidateAmendBookingResponse>()))
            .Returns(new AmendTransferItem { PromoCodeBreakDown = promoCodeBreakDown, Transfer = transfers, AmendmentCharges = 10M });
        _bookingResponseOfferMapper.Setup(x => x.Map(It.IsAny<BookingResponse>())).Returns(offer);
        _transferServiceMock.Setup(x => x.GetAll(
            It.IsAny<Offer>(),
            It.IsAny<string>()))
        .ReturnsAsync(new List<TransferItem> { transfers });

        //Act
        var result = await _sut.GetAlternativeTransfersWithPrice(testInputData);

        //Assert
        result.Should().NotBeNull();
        result.Should().BeEquivalentTo(expectedResult);
    }

    [Fact]
    public async Task GetAlternativeTransfers_ChangeDate_ReturnAvailableTransfer()
    {
        var bookingRef = "TestRef";

        var booking = new BookingResponse
        {
            Prom = "Prom",
            Package = _fixture.Create<BookingPackage>(),
            AmendmentInfo = _fixture.Create<AmendmentsInfo>(),
            BookingReference = bookingRef
        };

        var request = new AmendDatesOffer
        {
            BookingRef = bookingRef,
            Offer = new Offer
            {
                Accom = _fixture.Create<Accom>(),
                Transfers = new List<TransferItem>
                {
                    new TransferItem
                    {
                        Code = "SS",
                        Type = TransferItemType.Shared
                    }
                }
            }
        };

        var validateBookingResponse = new ValidateAmendBookingResponse();
        var amendDatesOffer = new AmendDatesOffer
        {
            BookingRef = bookingRef,
            Offer = new Offer
            {
                Accom = _fixture.Create<Accom>(),
                Transfers = new List<TransferItem>
                {
                    new TransferItem
                    {
                        Code = "SS",
                        Type = TransferItemType.Shared
                    }
                }
            }
        };

        var transfers = new List<TransferItem>
        {
            new TransferItem
            {
                Code = "SS",
                Type = TransferItemType.Shared
            },
            new TransferItem
            {
                Code = "NS",
                Type = TransferItemType.NoTransfer
            },
            new TransferItem
            {
                Code = "PP",
                Type = TransferItemType.Private
            }
        };

        _bookingRepositoryMock
            .Setup(x => x.GetBaseBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(booking);

        _transferServiceMock
            .Setup(x => x.GetAll(It.IsAny<Offer>(), It.IsAny<string>()))
            .ReturnsAsync(transfers);

        _amendBookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
            .ReturnsAsync(validateBookingResponse);

        _validateBookingResponseMapperMock
            .Setup(x => x.MapToAmendDatesOffer(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<AmendDatesOffer>()))
            .ReturnsAsync(amendDatesOffer);

        _hotelOfferServiceMock
            .Setup(x => x.EnrichOfferWithCmsHotelData(It.IsAny<Offer>()))
            .ReturnsAsync((Offer offers) => offers);

        var result = await _sut.GetAlternativeTransfers(request);

        _bookingRepositoryMock.Verify(x => x.GetBaseBooking(bookingRef, null), Times.Once);

        _amendBookingRepositoryMock
            .Verify(x =>
                x.GetValidateAmendBookingResponse(
                    It.Is<BookingResponse>(y => y.BookingReference == bookingRef && y.Transfers[0].Code == "NS")
                    , It.IsAny<bool>()), Times.Once);

        _amendBookingRepositoryMock
            .Verify(x =>
                x.GetValidateAmendBookingResponse(
                    It.Is<BookingResponse>(y => y.BookingReference == bookingRef && y.Transfers[0].Code == "PP")
                    , It.IsAny<bool>()), Times.Once);

        _validateBookingResponseMapperMock
            .Verify(x => x.MapToAmendDatesOffer(
                    It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<AmendDatesOffer>()),
                Times.Exactly(2));
    }

    [Fact]
    public async Task GetAlternativeTransfers_AtcomReturnsError_ReturnsNull()
    {
        // Arrange
        _bookingRepositoryMock.Setup(repository => repository
                .GetBaseBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(new BookingResponse
            {
                AmendmentInfo = new AmendmentsInfo
                {
                    Transfer = new AmendItem
                    {
                        AmendAllow = true
                    }
                },
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation()
                }
            });
        var transfers = new List<TransferItem>
        {
            new TransferItem
            {
                Code = "SS",
                Type = TransferItemType.Shared
            },
            new TransferItem
            {
                Code = "NS",
                Type = TransferItemType.NoTransfer
            },
            new TransferItem
            {
                Code = "PP",
                Type = TransferItemType.Private
            }
        };
        var request = new AmendDatesOffer
        {
            BookingRef = "any",
            Offer = new Offer
            {
                Accom = _fixture.Create<Accom>(),
                Transfers = new List<TransferItem>
                {
                    new TransferItem
                    {
                        Code = "SS",
                        Type = TransferItemType.Shared
                    }
                }
            }
        };
        _transferServiceMock
            .Setup(x => x.GetAll(It.IsAny<Offer>(), It.IsAny<string>()))
            .ReturnsAsync(transfers);

        _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _tradeAgentAuthServiceMock.Setup(x => x.IsLoggedInAsTradeAgent()).Returns(false);

        _amendBookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>())).Returns(Task.FromResult<ValidateAmendBookingResponse>(null));
        _validateBookingResponseMapperMock.Setup(x => x.MapToAmendTransferItem(It.IsAny<BookingResponse>(), It.IsAny<TransferItem>(), It.IsAny<ValidateAmendBookingResponse>())).Verifiable();
        //Act
        var result = await _sut.GetAlternativeTransfers(request);

        //Assert
        result.Should().BeEmpty();
        _validateBookingResponseMapperMock.Verify(x => x.MapToAmendTransferItem(It.IsAny<BookingResponse>(), It.IsAny<TransferItem>(), It.IsAny<ValidateAmendBookingResponse>()), Times.Never);
    }

    [Fact]
    public async Task GetAlternativeTransfers_ChangeDate_BookingHasPromocode_ReturnAvailableTransfer()
    {
        var bookingRef = "TestRef";

        var booking = new BookingResponse
        {
            Prom = "Prom",
            Package = _fixture.Create<BookingPackage>(),
            AmendmentInfo = _fixture.Create<AmendmentsInfo>(),
            BookingReference = bookingRef,
            DiscountCode = "oldcode"
        };

        var request = new AmendDatesOffer
        {
            BookingRef = bookingRef,
            Offer = new Offer
            {
                Accom = _fixture.Create<Accom>(),
                Transfers = new List<TransferItem>
                {
                    new TransferItem
                    {
                        Code = "SS",
                        Type = TransferItemType.Shared
                    }
                }
            }
        };

        var validateBookingResponse = new ValidateAmendBookingResponse();
        var validateBookingResponsePromocode = new ValidateAmendBookingResponse
        {
            DiscountCode = "oldcode"
        };

        var amendDatesOffer = new AmendDatesOffer
        {
            BookingRef = bookingRef,
            Offer = new Offer
            {
                Accom = _fixture.Create<Accom>(),
                Transfers = new List<TransferItem>
                {
                    new TransferItem
                    {
                        Code = "SS",
                        Type = TransferItemType.Shared
                    }
                }
            }
        };

        var transfers = new List<TransferItem>
        {
            new TransferItem
            {
                Code = "SS",
                Type = TransferItemType.Shared
            },
            new TransferItem
            {
                Code = "NS",
                Type = TransferItemType.NoTransfer
            },
            new TransferItem
            {
                Code = "PP",
                Type = TransferItemType.Private
            }
        };

        _bookingRepositoryMock
            .Setup(x => x.GetBaseBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(booking);

        _transferServiceMock
            .Setup(x => x.GetAll(It.IsAny<Offer>(), It.IsAny<string>()))
            .ReturnsAsync(transfers);

        _amendBookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
            .ReturnsAsync(validateBookingResponse);

        _validateBookingResponseMapperMock
            .Setup(x => x.MapToAmendDatesOffer(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<AmendDatesOffer>()))
            .ReturnsAsync(amendDatesOffer);

        _hotelOfferServiceMock
            .Setup(x => x.EnrichOfferWithCmsHotelData(It.IsAny<Offer>()))
            .ReturnsAsync((Offer offers) => offers);

        _amendDatesPromocodeHandlerServiceMock
            .Setup(x => x.HandlePromocode(It.IsAny<BookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>()))
            .ReturnsAsync(validateBookingResponsePromocode).Verifiable();

        var result = await _sut.GetAlternativeTransfers(request);

        _bookingRepositoryMock.Verify(x => x.GetBaseBooking(bookingRef, null), Times.Once);

        _amendBookingRepositoryMock
            .Verify(x =>
                x.GetValidateAmendBookingResponse(
                    It.Is<BookingResponse>(y => y.BookingReference == bookingRef && y.Transfers[0].Code == "NS")
                    , It.IsAny<bool>()), Times.Once);

        _amendBookingRepositoryMock
            .Verify(x =>
                x.GetValidateAmendBookingResponse(
                    It.Is<BookingResponse>(y => y.BookingReference == bookingRef && y.Transfers[0].Code == "PP")
                    , It.IsAny<bool>()), Times.Once);

        _validateBookingResponseMapperMock
            .Verify(x => x.MapToAmendDatesOffer(
                    It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<AmendDatesOffer>()),
                Times.Exactly(2));

        _amendDatesPromocodeHandlerServiceMock
            .Verify(x => x.HandlePromocode(It.IsAny<BookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>()),
            Times.Exactly(2));
    }

    public static IEnumerable<object[]> GetAlternativeTransfersWithPriceTestData()
    {
        TransferItem exampleTransferItem = new TransferItem()
        {
            Type = TransferItemType.Private
        };

        TransferItem exampleTransferItem2 = new TransferItem()
        {
            Type = TransferItemType.Shared
        };

        var offer = new Offer()
        {
            Accom = new Accom()
            {
                Code = "testCode",
                Id = "testCode",
                Unit = null,
                IsExternal = false,
                Date = new DateTime(2022, 01, 01),
                Stay = 7,
                Prom = null,
                PackageId = ""
            },
            Transport = new Transport
            {
                Routes = new List<Route>
                {
                    new Route
                    {
                        Id = "reouteId"
                    }
                }
            },
            Transfers = new List<TransferItem>
            {
                new TransferItem
                {
                    Code = "TestSS"
                }
            }
        };

        yield return new object[]
        {
            new AlternativeTransfersSearchRequest
            {
                BookingReference = "TestRef"
            },
            new AmendBookingTransfersResponse
            {
                Transfers = new List<AmendTransferItem>
                {
                    new AmendTransferItem() {AmendmentCharges = 10, Transfer = exampleTransferItem, PromoCodeBreakDown = new PromoCodeBreakDown { }},
                    new AmendTransferItem {AmendmentCharges = 10, Transfer = exampleTransferItem2, PromoCodeBreakDown = new PromoCodeBreakDown { }}
                }
            },
            new BookingResponse
            {
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        StartDate = "2022-01-01",
                        EndDate = "2022-01-02",
                        Code = "testCode"
                    },
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                        {
                            new Route
                            {
                                Id = "reouteId"
                            }
                        }
                    }
                },
                Transfers = new List<TransferItem>
                {
                    new TransferItem
                    {
                        Code = "TestSS"
                    }
                },
                AmendmentInfo = new AmendmentsInfo
                {
                    Transfer = new AmendItem
                    {
                        AmendAllow = true
                    }
                }
            },
            new ValidateAmendBookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    AmendmentCharges = 10
                }
            },
            new List<TransferItem>
            {
                new TransferItem() {Type = TransferItemType.Private}, new TransferItem()
                {
                    Type = TransferItemType.Shared
                },
                new TransferItem() {Type = TransferItemType.Unknown}
            },
            offer,
            new PromoCodeBreakDown { }
        };
        yield return new object[]
        {
            new AlternativeTransfersSearchRequest
            {
                BookingReference = "TestRef"
            },
            new AmendBookingTransfersResponse
            {
                Transfers = new List<AmendTransferItem>
                {
                    new AmendTransferItem() {AmendmentCharges = 10, Transfer = exampleTransferItem, PromoCodeBreakDown = new PromoCodeBreakDown { }},
                    new AmendTransferItem() {AmendmentCharges = 10, Transfer = exampleTransferItem2, PromoCodeBreakDown = new PromoCodeBreakDown { }}
                }
            },
            new BookingResponse
            {
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        StartDate = "2022-01-01",
                        EndDate = "2022-01-02",
                        Code = "testCode"
                    },
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                        {
                            new Route
                            {
                                Id = "reouteId"
                            }
                        }
                    }
                },
                Transfers = new List<TransferItem>
                {
                    new TransferItem
                    {
                        Code = "TestSS"
                    }
                },
                AmendmentInfo = new AmendmentsInfo
                {
                    Transfer = new AmendItem
                    {
                        AmendAllow = true
                    }
                }
            },
            new ValidateAmendBookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    AmendmentCharges = 10
                }
            },
            new List<TransferItem>
            {
                new TransferItem() {Type = TransferItemType.Private},
                new TransferItem() {Type = TransferItemType.Shared}
            },
            offer,
            new PromoCodeBreakDown { }
        };
    }

    public static IEnumerable<object[]> GetAlternativeTransfersWithPricePromoAppliedOriginallyTestData()
    {
        var offer = new Offer()
        {
            Accom = new Accom()
            {
                Code = "testCode",
                Id = "testCode",
                Unit = null,
                IsExternal = false,
                Date = new DateTime(2022, 01, 01),
                Stay = 7,
                Prom = null,
                PackageId = ""
            },
            Transport = new Transport
            {
                Routes = new List<Route>
                {
                    new Route
                    {
                        Id = "reouteId"
                    }
                }
            },
            Transfers = new List<TransferItem>
            {
                new TransferItem
                {
                    Code = "TestSS"
                }
            }
        };
        TransferItem exampleTransferItem = new TransferItem()
        {
            Type = TransferItemType.Private
        };

        TransferItem exampleTransferItem2 = new TransferItem()
        {
            Type = TransferItemType.Shared
        };

        yield return new object[]
        {
            new AlternativeTransfersSearchRequest
            {
                BookingReference = "TestRef"
            },
            new AmendBookingTransfersResponse
            {
                Transfers = new List<AmendTransferItem>
                {
                    new AmendTransferItem()
                    {
                        AmendmentCharges = 10, Transfer = exampleTransferItem,
                        PromoCodeBreakDown = new PromoCodeBreakDown
                            {Errors = new List<ApiError>(), Due = -20, PromoCodeStatus = PromoCodeStatus.APPLIED_ORIGINALLY, PromoCode = "discount_code"}
                    },
                    new AmendTransferItem
                    {
                        AmendmentCharges = 10, Transfer = exampleTransferItem2,
                        PromoCodeBreakDown = new PromoCodeBreakDown
                            {Errors = new List<ApiError>(), Due = -20, PromoCodeStatus = PromoCodeStatus.APPLIED_ORIGINALLY, PromoCode = "discount_code"}
                    }
                }
            },
            new BookingResponse
            {
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        StartDate = "2022-01-01",
                        EndDate = "2022-01-02",
                        Code = "testCode",
                        Hotel = new OfferHotel { }
                    },
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                        {
                            new Route
                            {
                                Id = "reouteId"
                            }
                        }
                    }
                },
                PriceBreakdown = new PriceCategory[]
                {
                    new PriceCategory
                    {
                        Amount = -20,
                        Code = "promo code",
                        Name = "promo code",
                        Quantity = 1,
                    }
                },
                DiscountCode = "discount_code",
                Transfers = new List<TransferItem>
                {
                    new TransferItem
                    {
                        Code = "TestSS"
                    }
                },
                AmendmentInfo = new AmendmentsInfo
                {
                    Transfer = new AmendItem
                    {
                        AmendAllow = true
                    }
                }
            },
            new ValidateAmendBookingResponse
            {
                ApiErrors = new ApiError[0],
                PaymentInfo = new PriceInfo
                {
                    AmendmentCharges = 10
                },
                PriceBreakdown = new PriceCategory[]
                {
                    new PriceCategory
                    {
                        Amount = -20,
                        Code = "promo code",
                        Name = "promo code",
                        Quantity = 1,
                    }
                },
            },
            new List<TransferItem>
            {
                new TransferItem() {Type = TransferItemType.Private}, new TransferItem()
                {
                    Type = TransferItemType.Shared
                },
                new TransferItem() {Type = TransferItemType.Unknown}
            },
            offer,
            new PromoCodeBreakDown {Errors = new List<ApiError>(), Due = -20, PromoCodeStatus = PromoCodeStatus.APPLIED_ORIGINALLY, PromoCode = "discount_code"}
        };
    }

    [Fact]
    public async Task GetAlternativeTransfers_ChangeDate_AtcomErrorWithValidation_ReturnNull()
    {
        var bookingRef = "TestRef";

        var booking = new BookingResponse
        {
            Prom = "Prom",
            Package = _fixture.Create<BookingPackage>(),
            AmendmentInfo = _fixture.Create<AmendmentsInfo>(),
            BookingReference = bookingRef
        };

        var request = new AmendDatesOffer
        {
            BookingRef = bookingRef,
            Offer = new Offer
            {
                Accom = _fixture.Create<Accom>(),
                Transfers = new List<TransferItem>
                {
                    new TransferItem
                    {
                        Code = "SS",
                        Type = TransferItemType.Shared
                    }
                }
            }
        };

        var validateBookingResponse = new ValidateAmendBookingResponse();
        var amendDatesOffer = new AmendDatesOffer
        {
            BookingRef = bookingRef,
            Offer = new Offer
            {
                Accom = _fixture.Create<Accom>(),
                Transfers = new List<TransferItem>
                {
                    new TransferItem
                    {
                        Code = "SS",
                        Type = TransferItemType.Shared
                    }
                }
            }
        };

        var transfers = new List<TransferItem>
        {
            new TransferItem
            {
                Code = "SS",
                Type = TransferItemType.Shared
            },
            new TransferItem
            {
                Code = "NS",
                Type = TransferItemType.NoTransfer
            },
            new TransferItem
            {
                Code = "PP",
                Type = TransferItemType.Private
            }
        };

        _bookingRepositoryMock
            .Setup(x => x.GetBaseBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(booking);

        _transferServiceMock
            .Setup(x => x.GetAll(It.IsAny<Offer>(), It.IsAny<string>()))
            .ReturnsAsync(transfers);

        _amendBookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.Is<BookingResponse>(x => x.Transfers[0].Code == "NS"), It.IsAny<bool>()))
            .ReturnsAsync(validateBookingResponse);

        _amendBookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.Is<BookingResponse>(x => x.Transfers[0].Code == "PP"), It.IsAny<bool>()))
            .ReturnsAsync((ValidateAmendBookingResponse)null);

        _validateBookingResponseMapperMock
            .Setup(x => x.MapToAmendDatesOffer(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<AmendDatesOffer>()))
            .ReturnsAsync(amendDatesOffer);

        _hotelOfferServiceMock
            .Setup(x => x.EnrichOfferWithCmsHotelData(It.IsAny<Offer>()))
            .ReturnsAsync((Offer offers) => offers);

        var result = await _sut.GetAlternativeTransfers(request);

        _bookingRepositoryMock.Verify(x => x.GetBaseBooking(bookingRef, null), Times.Once);

        _validateBookingResponseMapperMock
            .Verify(x => x.MapToAmendDatesOffer(
                    It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<AmendDatesOffer>()),
                Times.Once);
    }

    public static IEnumerable<object[]> GetAlternativeTransfersWithAtcomErrorsTestData()
    {
        var offer = new Offer()
        {
            Accom = new Accom()
            {
                Code = "testCode",
                Id = "testCode",
                Unit = null,
                IsExternal = false,
                Date = new DateTime(2022, 01, 01),
                Stay = 7,
                Prom = null,
                PackageId = ""
            },
            Transport = new Transport
            {
                Routes = new List<Route>
                {
                    new Route
                    {
                        Id = "reouteId"
                    }
                }
            },
            Transfers = new List<TransferItem>
            {
                new TransferItem
                {
                    Code = "TestSS"
                }
            }
        };
        TransferItem exampleTransferItem = new TransferItem()
        {
            Type = TransferItemType.Private
        };

        TransferItem exampleTransferItem2 = new TransferItem()
        {
            Type = TransferItemType.Shared
        };

        yield return new object[]
        {
            new AlternativeTransfersSearchRequest
            {
                BookingReference = "TestRef"
            },
            new AmendBookingTransfersResponse
            {
                Transfers = new List<AmendTransferItem>
                {
                    new AmendTransferItem()
                    {
                        AmendmentCharges = 10, Transfer = exampleTransferItem,
                        PromoCodeBreakDown = new PromoCodeBreakDown {Errors = new List<ApiError>(), Due = 20, PromoCodeStatus = PromoCodeStatus.ERROR}
                    },
                    new AmendTransferItem
                    {
                        AmendmentCharges = 10, Transfer = exampleTransferItem2,
                        PromoCodeBreakDown = new PromoCodeBreakDown {Errors = new List<ApiError>(), Due = 20, PromoCodeStatus = PromoCodeStatus.ERROR}
                    }
                }
            },
            new BookingResponse
            {
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        StartDate = "2022-01-01",
                        EndDate = "2022-01-02",
                        Code = "testCode",
                        Hotel = new OfferHotel { }
                    },
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                        {
                            new Route
                            {
                                Id = "reouteId"
                            }
                        }
                    }
                },
                PriceBreakdown = new PriceCategory[]
                {
                    new PriceCategory
                    {
                        Amount = -20,
                        Code = "promo code",
                        Name = "promo code",
                        Quantity = 1,
                    }
                },
                DiscountCode = "discount_code",
                Transfers = new List<TransferItem>
                {
                    new TransferItem
                    {
                        Code = "TestSS"
                    }
                },
                AmendmentInfo = new AmendmentsInfo
                {
                    Transfer = new AmendItem
                    {
                        AmendAllow = true
                    }
                }
            },
            new ValidateAmendBookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    AmendmentCharges = 10
                },
                ApiErrors = new ApiError[] {new ApiError {Code = "code-1"}},
                PriceBreakdown = new PriceCategory[]
                {
                    new PriceCategory
                    {
                        Amount = -20,
                        Code = "promo code",
                        Name = "promo code",
                        Quantity = 1,
                    }
                },
            },
            new ValidateAmendBookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    AmendmentCharges = 10
                },
                ApiErrors = new ApiError[0],
                PriceBreakdown = new PriceCategory[]
                {
                    new PriceCategory
                    {
                        Amount = -20,
                        Code = "promo code",
                        Name = "promo code",
                        Quantity = 1,
                    }
                },
            },
            new List<TransferItem>
            {
                new TransferItem() {Type = TransferItemType.Private}, new TransferItem()
                {
                    Type = TransferItemType.Shared
                },
                new TransferItem() {Type = TransferItemType.Unknown}
            },
            offer,
            new PromoCodeBreakDown {Errors = new List<ApiError>(), Due = 20, PromoCodeStatus = PromoCodeStatus.ERROR}
        };
    }

    public static IEnumerable<object[]> GetAlternativeTransfersWithPricePromoChangeTestData()
    {
        var offer = new Offer()
        {
            Accom = new Accom()
            {
                Code = "testCode",
                Id = "testCode",
                Unit = null,
                IsExternal = false,
                Date = new DateTime(2022, 01, 01),
                Stay = 7,
                Prom = null,
                PackageId = ""
            },
            Transport = new Transport
            {
                Routes = new List<Route>
                {
                    new Route
                    {
                        Id = "reouteId"
                    }
                }
            },
            Transfers = new List<TransferItem>
            {
                new TransferItem
                {
                    Code = "TestSS"
                }
            }
        };
        TransferItem exampleTransferItem = new TransferItem()
        {
            Type = TransferItemType.Private
        };
        yield return new object[]
        {
            new AlternativeTransfersSearchRequest
            {
                BookingReference = "TestRef"
            },
            new AmendBookingTransfersResponse
            {
                Transfers = new List<AmendTransferItem>
                {
                    new AmendTransferItem()
                    {
                        AmendmentCharges = 10, Transfer = exampleTransferItem,
                        PromoCodeBreakDown = new PromoCodeBreakDown
                            {Errors = new List<ApiError> { }, Due = -25, PromoCodeStatus = PromoCodeStatus.TIER_UPGRADE, PromoCode = "better code"}
                    }
                }
            },
            new BookingResponse
            {
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        StartDate = "2022-01-01",
                        EndDate = "2022-01-02",
                        Code = "testCode",
                        Hotel = new OfferHotel { }
                    },
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                        {
                            new Route
                            {
                                Id = "reouteId"
                            }
                        }
                    }
                },
                PriceBreakdown = new PriceCategory[]
                {
                    new PriceCategory
                    {
                        Amount = -20,
                        Code = "promo code",
                        Name = "promo code",
                        Quantity = 1,
                    }
                },
                DiscountCode = "discount_code",
                Transfers = new List<TransferItem>
                {
                    new TransferItem
                    {
                        Code = "TestSS"
                    }
                },
                AmendmentInfo = new AmendmentsInfo
                {
                    Transfer = new AmendItem
                    {
                        AmendAllow = true
                    }
                }
            },
            new ValidateAmendBookingResponse
            {
                ApiErrors = new ApiError[0],
                PaymentInfo = new PriceInfo
                {
                    AmendmentCharges = 10
                },
            },
            new ValidateAmendBookingResponse
            {
                ApiErrors = new ApiError[0],
                PaymentInfo = new PriceInfo
                {
                    AmendmentCharges = 10
                },
                PriceBreakdown = new PriceCategory[]
                {
                    new PriceCategory
                    {
                        Amount = -25,
                        Code = "promo code",
                        Name = "promo code",
                        Quantity = 1,
                    }
                },
            },
            new List<TransferItem>
            {
                new TransferItem() {Type = TransferItemType.Private},
                new TransferItem() {Type = TransferItemType.Unknown}
            },
            new ValidatePromotion {ValidationResults = new ApiError[] {new ApiError {Code = "1", Message = "invalid"}}},
            offer,
            new PromoCodeBreakDown {Errors = new List<ApiError> { }, Due = -25, PromoCodeStatus = PromoCodeStatus.TIER_UPGRADE, PromoCode = "better code"}
        };
        yield return new object[]
        {
            new AlternativeTransfersSearchRequest
            {
                BookingReference = "TestRef"
            },
            new AmendBookingTransfersResponse
            {
                Transfers = new List<AmendTransferItem>
                {
                    new AmendTransferItem()
                    {
                        AmendmentCharges = 15, Transfer = exampleTransferItem,
                        PromoCodeBreakDown = new PromoCodeBreakDown
                            {Errors = new List<ApiError> { }, Due = -15, PromoCodeStatus = PromoCodeStatus.TIER_DOWNGRADE, PromoCode = "better code"}
                    }
                }
            },
            new BookingResponse
            {
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        StartDate = "2022-01-01",
                        EndDate = "2022-01-02",
                        Code = "testCode",
                        Hotel = new OfferHotel { }
                    },
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                        {
                            new Route
                            {
                                Id = "reouteId"
                            }
                        }
                    }
                },
                PriceBreakdown = new PriceCategory[]
                {
                    new PriceCategory
                    {
                        Amount = -20,
                        Code = "promo code",
                        Name = "promo code",
                        Quantity = 1,
                    }
                },
                DiscountCode = "discount_code",
                Transfers = new List<TransferItem>
                {
                    new TransferItem
                    {
                        Code = "TestSS"
                    }
                },
                AmendmentInfo = new AmendmentsInfo
                {
                    Transfer = new AmendItem
                    {
                        AmendAllow = true
                    }
                }
            },
            new ValidateAmendBookingResponse
            {
                ApiErrors = new ApiError[0],
                PaymentInfo = new PriceInfo
                {
                    AmendmentCharges = 15
                },
            },
            new ValidateAmendBookingResponse
            {
                ApiErrors = new ApiError[0],
                PaymentInfo = new PriceInfo
                {
                    AmendmentCharges = 15
                },
                PriceBreakdown = new PriceCategory[]
                {
                    new PriceCategory
                    {
                        Amount = -15,
                        Code = "promo code",
                        Name = "promo code",
                        Quantity = 1,
                    }
                },
            },
            new List<TransferItem>
            {
                new TransferItem() {Type = TransferItemType.Private},
                new TransferItem() {Type = TransferItemType.Unknown}
            },
            new ValidatePromotion {ValidationResults = new ApiError[] {new ApiError {Code = "1", Message = "invalid"}}},
            offer,
            new PromoCodeBreakDown {Errors = new List<ApiError> { }, Due = -15, PromoCodeStatus = PromoCodeStatus.TIER_DOWNGRADE, PromoCode = "better code"}
        };
    }

    public static IEnumerable<object[]> GetAlternativeTransfersWithPricePromoRemovedTestData()
    {
        var offer = new Offer()
        {
            Accom = new Accom()
            {
                Code = "testCode",
                Id = "testCode",
                Unit = null,
                IsExternal = false,
                Date = new DateTime(2022, 01, 01),
                Stay = 7,
                Prom = null,
                PackageId = ""
            },
            Transport = new Transport
            {
                Routes = new List<Route>
                {
                    new Route
                    {
                        Id = "reouteId"
                    }
                }
            },
            Transfers = new List<TransferItem>
            {
                new TransferItem
                {
                    Code = "TestSS"
                }
            }
        };
        TransferItem exampleTransferItem = new TransferItem()
        {
            Type = TransferItemType.Private
        };
        yield return new object[]
        {
            new AlternativeTransfersSearchRequest
            {
                BookingReference = "TestRef"
            },
            new AmendBookingTransfersResponse
            {
                Transfers = new List<AmendTransferItem>
                {
                    new AmendTransferItem()
                    {
                        AmendmentCharges = 10, Transfer = exampleTransferItem,
                        PromoCodeBreakDown = new PromoCodeBreakDown
                        {
                            Errors = new List<ApiError> {new ApiError {Code = "1", Message = "invalid"}}, Due = 20, PromoCodeStatus = PromoCodeStatus.PROMOCODE_REMOVED,
                            PromoCode = null
                        }
                    }
                }
            },
            new BookingResponse
            {
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        StartDate = "2022-01-01",
                        EndDate = "2022-01-02",
                        Code = "testCode",
                        Hotel = new OfferHotel { }
                    },
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                        {
                            new Route
                            {
                                Id = "reouteId"
                            }
                        }
                    }
                },
                PriceBreakdown = new PriceCategory[]
                {
                    new PriceCategory
                    {
                        Amount = -20,
                        Code = "promo code",
                        Name = "promo code",
                        Quantity = 1,
                    }
                },
                DiscountCode = "discount_code",
                Transfers = new List<TransferItem>
                {
                    new TransferItem
                    {
                        Code = "TestSS"
                    }
                },
                AmendmentInfo = new AmendmentsInfo
                {
                    Transfer = new AmendItem
                    {
                        AmendAllow = true
                    }
                }
            },
            new ValidateAmendBookingResponse
            {
                ApiErrors = new ApiError[0],
                PaymentInfo = new PriceInfo
                {
                    AmendmentCharges = 10
                },
            },

                new TransferItem() {Type = TransferItemType.Private},

            new ValidatePromotion {ValidationResults = new ApiError[] {new ApiError {Code = "1", Message = "invalid"}}},
            offer,
            new PromoCodeBreakDown
            {
                Errors = new List<ApiError> {new ApiError {Code = "1", Message = "invalid"}}, Due = 20, PromoCodeStatus = PromoCodeStatus.PROMOCODE_REMOVED,
                PromoCode = null
            }
        };
        //Test case for Shared transfer type that should be removed for lux booking
        yield return new object[]
        {
            new AlternativeTransfersSearchRequest
            {
                BookingReference = "TestRef"
            },
            new AmendBookingTransfersResponse
            {
                Transfers = new List<AmendTransferItem>
                {
                }
            },
            new BookingResponse
            {
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        StartDate = "2022-01-01",
                        EndDate = "2022-01-02",
                        Code = "testCode",
                        Hotel = new OfferHotel { }
                    },
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                        {
                            new Route
                            {
                                Id = "reouteId"
                            }
                        }
                    }
                },
                PriceBreakdown = new PriceCategory[]
                {
                    new PriceCategory
                    {
                        Amount = -20,
                        Code = "promo code",
                        Name = "promo code",
                        Quantity = 1,
                    }
                },
                PromotionCollections = ["lux"],
                DiscountCode = "discount_code",
                Transfers = new List<TransferItem>
                {
                    new TransferItem
                    {
                        Code = "TestSS"
                    }
                },
                AmendmentInfo = new AmendmentsInfo
                {
                    Transfer = new AmendItem
                    {
                        AmendAllow = true
                    }
                }
            },
            new ValidateAmendBookingResponse
            {
                ApiErrors = new ApiError[0],
                PaymentInfo = new PriceInfo
                {
                    AmendmentCharges = 10
                },
            },

                new TransferItem() {Type = TransferItemType.Shared},

            new ValidatePromotion {ValidationResults = new ApiError[] {new ApiError {Code = "1", Message = "invalid"}}},
            offer,
            new PromoCodeBreakDown
            {
                Errors = new List<ApiError> {new ApiError {Code = "1", Message = "invalid"}}, Due = 20, PromoCodeStatus = PromoCodeStatus.PROMOCODE_REMOVED,
                PromoCode = null
            }
        };
    }

    public static IEnumerable<object[]> GetAmendTransfersPriceTestData()
    {
        TransferItem exampleTransferItem = new TransferItem()
        {
            Code = "TestSS"
        };

        decimal? amendmentCharges = new decimal(10.0);

        yield return new object[]
        {
            new AmendBookingTransfersRequest
            {
                Transfers = new List<TransferItem> {exampleTransferItem}
            },
            new AmendBookingTransfersResponse
            {
                Transfers = new List<AmendTransferItem>
                {
                    new AmendTransferItem()
                    {
                        Transfer = exampleTransferItem, AmendmentCharges = amendmentCharges,
                        PromoCodeBreakDown = new PromoCodeBreakDown
                        {
                        }
                    }
                }
            },
            amendmentCharges,
            new PromoCodeBreakDown { }
        };
    }
}