using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.MemoService;
using easyJet.Holidays.Api.Domain.Services.AmendBooking;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendBookingFlights;

public class AmendBookingServiceTests
{
    private IFixture _fixture { get; set; }

    private readonly Mock<IBookingRepository> _bookingRepositoryMock = new();
    private readonly Mock<IBookingPaymentService> _paymentServiceMock = new();
    private readonly Mock<IAuthenticationService> _authServiceMock = new();
    private readonly Mock<IAmendBookingRefundService> _refundServiceMock = new();
    private readonly ILogger<AmendBookingService> _logger;
    private IOptions<ApiSettings> _apiSettings = Options.Create(new ApiSettings());
    private readonly Mock<IAmendPassengerService> _amendBookingPassengerService = new();
    private readonly Mock<IBookingSessionService> _bookingSessionService = new();
    private readonly Mock<IHttpContextAccessor> _httpContextAccessor = new();
    private readonly IOptions<HeadersSettings> _headersSettings = Options.Create(new HeadersSettings());
    private readonly Mock<ITradeAgentAuthenticationService> _tradeAgentAuthServiceMock = new();
    private readonly Mock<IMemoService> _memoServiceMock = new Mock<IMemoService>();
    private readonly Mock<IAmendPromocodeHandlerService> _amendPromocodeHandlerServiceMock = new();
    private readonly Mock<ISettingsService> _settingsServiceMock = new();
    private readonly Mock<ILuggageService> _luggageServiceMock = new();
    private readonly Mock<IFlightExtraService> _flightExtraServiceMock = new();

    private AmendBookingService _amendBookingService;

    public AmendBookingServiceTests()
    {
        _settingsServiceMock.Setup(x => x.GetSeatMapSettings()).ReturnsAsync(new SeatMapSettings { EnableSeatMapDateChange = true });

        _fixture = FixtureUtils.AutoMoqFixture();
        _logger = _fixture.Freeze<ILogger<AmendBookingService>>();
        _httpContextAccessor.Setup(c => c.HttpContext).Returns(_fixture.Create<HttpContext>());
        _flightExtraServiceMock.Setup(f => f.NeedToAddExtraFlightInformationIntoAtcomRequest(It.IsAny<string>()))
            .ReturnsAsync(false);

        _amendBookingService = new AmendBookingService(
            _bookingRepositoryMock.Object,
            _logger,
            _paymentServiceMock.Object,
            _authServiceMock.Object,
            _refundServiceMock.Object,
            _amendBookingPassengerService.Object,
            _bookingSessionService.Object,
            _httpContextAccessor.Object,
            _headersSettings,
            _tradeAgentAuthServiceMock.Object,
            _memoServiceMock.Object,
            _amendPromocodeHandlerServiceMock.Object,
            _settingsServiceMock.Object,
            new Mock<IAmendmentChargesService>().Object,
            _luggageServiceMock.Object,
            _flightExtraServiceMock.Object);
    }

    [Fact]
    public async Task AmendBooking_NotLoggedAsLeadPassenger_ThrowException()
    {
        var request = new AmendBookingRequest();

        _authServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(false);
        _bookingRepositoryMock
            .Setup(x => x.GetBookingUnsafe(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(new BookingResponse());

        Func<Task> act = async () => { await _amendBookingService.AmendBooking(request); };

        await act.Should().ThrowExactlyAsync<ApiException>().Where(x => x.Code.Code == ApiExceptionCodes.LoggedNotAsBookingLeadPassenger.Code);
    }

    [Fact]
    public async Task AmendBooking_DifferentPromocodeThanInRequest_ThrowException()
    {
        var request = new AmendBookingRequest { DiscountCode = "requestPromo", PaymentInfo = new CardPaymentInfo(), BookingReference = "bookingRef" };

        _authServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _amendPromocodeHandlerServiceMock.Setup(x => x.GetAtcomPromocode(It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>())).ReturnsAsync(new Domain.Data.Promotion.CmsPromocode { Promocode = "DiffrentPromo" });
        _bookingRepositoryMock
            .Setup(x => x.GetBookingUnsafe(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(new BookingResponse());

        Func<Task> act = async () => { await _amendBookingService.AmendBooking(request); };

        await act.Should().ThrowExactlyAsync<ApiException>().Where(x => x.Code.Code == ApiExceptionCodes.PromotionIsNotValid.Code);
    }

    [Fact]
    public async Task AmendBooking_NonTradeAgentWithTradePortalBooking_ThrowException()
    {
        var request = new AmendBookingRequest();

        _authServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _tradeAgentAuthServiceMock.Setup(x => x.IsLoggedInAsTradeAgent()).Returns(false);
        _bookingRepositoryMock
            .Setup(x => x.GetBookingUnsafe(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(new BookingResponse
            {
                IsExternalAgency = true
            });

        Func<Task> act = async () => { await _amendBookingService.AmendBooking(request); };

        await act.Should().ThrowAsync<ApiException>()
            .WithMessage("Only trade agents can amend Trade Portal booking");
    }

    [Fact]
    public async Task AmendBooking_RequestWithoutPaymentInfo_ThrowException()
    {
        var request = new AmendBookingRequest();

        _authServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _bookingRepositoryMock
            .Setup(x => x.GetBookingUnsafe(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(new BookingResponse());

        Func<Task> act = async () => { await _amendBookingService.AmendBooking(request); };

        await act.Should().ThrowExactlyAsync<ArgumentException>().Where(x => x.ParamName.Equals(nameof(request)) && x.Message.Contains(nameof(request.PaymentInfo)));
    }

    [Fact]
    public async Task AmendBooking_RequestWithoutPaymentInfo_DoesNotThrowExceptionForTradeAgent()
    {
        var request = new AmendBookingRequest
        {
            BookingReference = "AMEND",
            Transport = new Transport()
        };

        var validateBookingResponse = new ValidateAmendBookingResponse
        {
            PaymentInfo = new PriceInfo()
        };

        var apiSettings = Options.Create(new ApiSettings
        {
            AmendBookingMemo = new AmendBookingMemoSettings
            {
                TransferChange = new MemoSettings(),
                FlightTimeChange = new MemoSettings()
            }
        });

        _authServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(false);
        _tradeAgentAuthServiceMock.Setup(x => x.IsLoggedInAsTradeAgent()).Returns(true);

        _bookingRepositoryMock
            .Setup(x => x.GetBookingUnsafe(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(new BookingResponse { IsExternalAgency = true, PaymentInfo = new PriceInfo { AllowPayBalanceDueDate = new DateTimeOffset(3020, 1, 1, 1, 1, 1, new TimeSpan()) } });
        _bookingRepositoryMock
            .Setup(x => x.ValidateAmendBookingInfo(It.IsAny<AmendBookingRequest>(), It.IsAny<BookingResponse>(), It.IsAny<bool>(), It.IsAny<bool>()))
            .ReturnsAsync(validateBookingResponse);

        _paymentServiceMock
            .Setup(x => x.ProcessPayment(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<Func<Task<BookingResponse>>>()))
            .ReturnsAsync(new BookingResponse());

        Func<Task> act = async () => { await _amendBookingService.AmendBooking(request); };

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task AmendBooking_RequestWithoutBookingReference_ThrowException()
    {
        var request = new AmendBookingRequest
        {
            PaymentInfo = new CardPaymentInfo()
        };

        _authServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _bookingRepositoryMock
            .Setup(x => x.GetBookingUnsafe(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(new BookingResponse());

        Func<Task> act = async () => { await _amendBookingService.AmendBooking(request); };

        await act.Should().ThrowExactlyAsync<ArgumentException>().Where(x => x.ParamName.Equals(nameof(request)) && x.Message.Contains(nameof(request.BookingReference)));
    }

    [Fact]
    public async Task AmendBooking_ChangeTransfer_WhenSportEquipmentLuggage_ThrowsApiException()
    {
        // Arrange
        _bookingRepositoryMock
            .Setup(repository => repository.GetBookingUnsafe(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(new BookingResponse());
        _luggageServiceMock
            .Setup(service =>
                service.ContainsSportEquipment(It.IsAny<IEnumerable<ExtraLuggageItem>>()))
            .ReturnsAsync(true);

        _authServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);

        var request = new AmendBookingRequest
        {
            PaymentInfo = new CardPaymentInfo(),
            BookingReference = "AMEND",
            Transfers = new List<TransferItem>(),
            DiscountCode = "original-code"
        };

        // Act, Assert
        await _amendBookingService.Invoking(x => x.AmendBooking(request))
            .Should()
            .ThrowAsync<ApiException>()
            .Where(x => x.Code.Code == ApiExceptionCodes.NoAmendFlightAndTransferForSportEquipment.Code);
    }


    [Fact]
    public async Task AmendBooking_SuccessPayment()
    {
        var request = new AmendBookingRequest
        {
            PaymentInfo = new CardPaymentInfo(),
            BookingReference = "AMEND",
            Transport = new Transport(),
            DiscountCode = "original-code"
        };

        var validateBookingResponse = new ValidateAmendBookingResponse
        {
            PaymentInfo = new PriceInfo()
        };

        var apiSettings = Options.Create(new ApiSettings
        {
            AmendBookingMemo = new AmendBookingMemoSettings
            {
                TransferChange = new MemoSettings(),
                FlightTimeChange = new MemoSettings()
            }
        });

        _authServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _bookingRepositoryMock
            .Setup(x => x.ValidateAmendBookingInfo(It.IsAny<AmendBookingRequest>(), It.IsAny<BookingResponse>(), It.IsAny<bool>(), It.IsAny<bool>()))
            .ReturnsAsync(validateBookingResponse);

        _amendPromocodeHandlerServiceMock.Setup(x => x.GetAtcomPromocode(It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>())).ReturnsAsync(new Domain.Data.Promotion.CmsPromocode { Promocode = "original-code" });

        _paymentServiceMock
            .Setup(x => x.ProcessPayment(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<Func<Task<BookingResponse>>>()))
            .ReturnsAsync(new BookingResponse());

        _bookingRepositoryMock.Setup(x => x.GetBookingUnsafe(It.IsAny<string>(), null)).ReturnsAsync(new BookingResponse { PaymentInfo = new PriceInfo { AllowPayBalanceDueDate = new DateTimeOffset(3020, 1, 1, 1, 1, 1, new TimeSpan()) } });

        await _amendBookingService.AmendBooking(request);

        _paymentServiceMock
            .Verify(x => x.ProcessPayment(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<Func<Task<BookingResponse>>>()), Times.Once);
        _refundServiceMock
            .Verify(x => x.ProcessRefund(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<ConvertType>()), Times.Never);

        request.DiscountCode.Should().Be("original-code");
    }

    [Fact]
    public async Task AmendBooking_DateChangeWithSeatsBlockedBySitecoreSettings()
    {
        var request = new AmendBookingRequest()
        {
            PaymentInfo = new CardPaymentInfo
            {
                CreditAmount = 362
            },
            LastName = "test@easyjet.com",
            BrowserInfo = new BrowserInfo(),
            BookingReference = "AMEND_BOOKING",
            Offer = new Offer()
            {
                SeatSelection = new List<SeatMap> { new SeatMap { FlightNumber = "123", SectorId = "1", Seats = new List<Seat> { new Seat { } } } },
                Date = DateTime.Now
            }
        };

        _authServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _bookingRepositoryMock.Setup(x => x.GetBookingUnsafe(It.IsAny<string>(), null)).ReturnsAsync(new BookingResponse { PaymentInfo = new PriceInfo { AllowPayBalanceDueDate = new DateTimeOffset(3020, 1, 1, 1, 1, 1, new TimeSpan()) } }); ;
        _settingsServiceMock.Setup(x => x.GetSeatMapSettings()).ReturnsAsync(new SeatMapSettings { });

        Task result() => _amendBookingService.AmendBooking(request);

        //Assert
        await Assert.ThrowsAsync<ApiException>(result);
    }

    [Fact]
    public async Task AmendBooking_SuccessPaymentAfterBalanceDueDate()
    {
        var request = new AmendBookingRequest
        {
            PaymentInfo = new CardPaymentInfo { Amount = 100 },
            BookingReference = "AMEND",
            Transport = new Transport()
        };

        var validateBookingResponse = new ValidateAmendBookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                AmendmentCharges = 100,
                BalanceDueAmount = 100
            }
        };

        var apiSettings = Options.Create(new ApiSettings
        {
            AmendBookingMemo = new AmendBookingMemoSettings
            {
                TransferChange = new MemoSettings(),
                FlightTimeChange = new MemoSettings()
            }
        });

        _authServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _bookingRepositoryMock
            .Setup(x => x.ValidateAmendBookingInfo(It.IsAny<AmendBookingRequest>(), It.IsAny<BookingResponse>(), It.IsAny<bool>(), It.IsAny<bool>()))
            .ReturnsAsync(validateBookingResponse);

        _paymentServiceMock
            .Setup(x => x.ProcessPayment(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<Func<Task<BookingResponse>>>()))
            .ReturnsAsync(new BookingResponse());

        _bookingRepositoryMock.Setup(x => x.GetBookingUnsafe(It.IsAny<string>(), null)).ReturnsAsync(new BookingResponse { PaymentInfo = new PriceInfo { BalanceDueAmount = 100, AllowPayBalanceDueDate = new DateTimeOffset(2020, 1, 1, 1, 1, 1, new TimeSpan()) } });

        await _amendBookingService.AmendBooking(request);

        _paymentServiceMock
            .Verify(x => x.ProcessPayment(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<Func<Task<BookingResponse>>>()), Times.Once);
        _refundServiceMock
            .Verify(x => x.ProcessRefund(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<ConvertType>()), Times.Never);
    }

    [Fact]
    public async Task AmendBooking_SuccessRefund()
    {
        var request = new AmendBookingRequest
        {
            PaymentInfo = new CardPaymentInfo
            {
                Amount = -1
            },
            BookingReference = "AMEND",
            Transport = new Transport(),
            ConvertType = ConvertType.REFUND
        };

        var validateBookingResponse = new ValidateAmendBookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                AmendmentCharges = -1
            }
        };

        var apiSettings = Options.Create(new ApiSettings
        {
            AmendBookingMemo = new AmendBookingMemoSettings
            {
                TransferChange = new MemoSettings(),
                FlightTimeChange = new MemoSettings()
            }
        });

        _authServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _bookingRepositoryMock
            .Setup(x => x.ValidateAmendBookingInfo(It.IsAny<AmendBookingRequest>(), It.IsAny<BookingResponse>(), It.IsAny<bool>(), It.IsAny<bool>()))
            .ReturnsAsync(validateBookingResponse);

        _paymentServiceMock
            .Setup(x => x.ProcessPayment(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<Func<Task<BookingResponse>>>()))
            .ReturnsAsync(new BookingResponse());

        _refundServiceMock
            .Setup(x => x.ProcessRefund(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<ConvertType>()))
            .ReturnsAsync(new BookingResponse());

        await _amendBookingService.AmendBooking(request);

        _paymentServiceMock
            .Verify(x => x.ProcessPayment(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<Func<Task<BookingResponse>>>()), Times.Never);

        _refundServiceMock
            .Verify(x => x.ProcessRefund(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<ConvertType>()), Times.Once);
    }

    [Fact]
    public async Task AmendBooking_AddMemoCodes_AMD1()
    {
        var request = new AmendBookingRequest
        {
            PaymentInfo = new CardPaymentInfo
            {
                Amount = -1
            },
            BookingReference = "AMEND",
            Transport = new Transport(),
            ConvertType = ConvertType.REFUND
        };

        var validateBookingResponse = new ValidateAmendBookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                AmendmentCharges = -1
            }
        };

        var apiSettings = Options.Create(new ApiSettings
        {
            AmendBookingMemo = new AmendBookingMemoSettings
            {
                TransferChange = new MemoSettings { Code = "AMD2" },
                FlightTimeChange = new MemoSettings { Code = "AMD1" },
                NameChange = new MemoSettings { Code = "AMD3" }
            }
        });

        _authServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _bookingRepositoryMock
            .Setup(x => x.ValidateAmendBookingInfo(It.IsAny<AmendBookingRequest>(), It.IsAny<BookingResponse>(), It.IsAny<bool>(), It.IsAny<bool>()))
            .ReturnsAsync(validateBookingResponse);

        _paymentServiceMock
            .Setup(x => x.ProcessPayment(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<Func<Task<BookingResponse>>>()))
            .ReturnsAsync(new BookingResponse());

        _refundServiceMock
            .Setup(x => x.ProcessRefund(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<ConvertType>()))
            .ReturnsAsync(new BookingResponse());

        var expectedMemoCode = "AMD1";
        var actualMemoCode = string.Empty;

        _memoServiceMock
            .Setup(x => x.GetAmendmentMemo(It.IsAny<AmendBookingRequest>(), It.IsAny<BookingResponse>()))
            .Returns(new BookingMemo { Code = expectedMemoCode });

        _bookingRepositoryMock
            .Setup(x => x.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>()))
            .Callback<string, BookingMemo>((reference, memo) => actualMemoCode = memo.Code).Returns(Task.CompletedTask);

        await _amendBookingService.AmendBooking(request);

        _bookingRepositoryMock
            .Verify(x => x.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>()), Times.Once);

        actualMemoCode.Should().Be(expectedMemoCode);
    }

    [Fact]
    public async Task AmendBooking_AddMemoCodes_AMD2()
    {
        var request = new AmendBookingRequest
        {
            PaymentInfo = new CardPaymentInfo
            {
                Amount = -1
            },
            BookingReference = "AMEND",
            ConvertType = ConvertType.REFUND,
            Transfers = new List<TransferItem>()
        };

        var validateBookingResponse = new ValidateAmendBookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                AmendmentCharges = -1
            }
        };

        var apiSettings = Options.Create(new ApiSettings
        {
            AmendBookingMemo = new AmendBookingMemoSettings
            {
                TransferChange = new MemoSettings { Code = "AMD2" },
                FlightTimeChange = new MemoSettings { Code = "AMD1" },
                NameChange = new MemoSettings { Code = "AMD3" }
            }
        });

        _authServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _bookingRepositoryMock
            .Setup(x => x.ValidateAmendBookingInfo(It.IsAny<AmendBookingRequest>(), It.IsAny<BookingResponse>(), It.IsAny<bool>(), It.IsAny<bool>()))
            .ReturnsAsync(validateBookingResponse);

        _paymentServiceMock
            .Setup(x => x.ProcessPayment(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<Func<Task<BookingResponse>>>()))
            .ReturnsAsync(new BookingResponse());

        _refundServiceMock
            .Setup(x => x.ProcessRefund(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<ConvertType>()))
            .ReturnsAsync(new BookingResponse());

        var expectedMemoCode = "AMD2";
        var actualMemoCode = string.Empty;

        _memoServiceMock
            .Setup(x => x.GetAmendmentMemo(It.IsAny<AmendBookingRequest>(), It.IsAny<BookingResponse>()))
            .Returns(new BookingMemo { Code = expectedMemoCode });

        _bookingRepositoryMock
            .Setup(x => x.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>()))
            .Callback<string, BookingMemo>((reference, memo) => actualMemoCode = memo.Code).Returns(Task.CompletedTask);

        await _amendBookingService.AmendBooking(request);

        _bookingRepositoryMock
            .Verify(x => x.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>()), Times.Once);

        actualMemoCode.Should().Be(expectedMemoCode);
    }

    [Fact]
    public async Task AmendBooking_AddMemoCodes_AMD3()
    {
        var request = new AmendBookingRequest
        {
            PaymentInfo = new CardPaymentInfo
            {
                Amount = -1
            },
            BookingReference = "AMEND",
            ConvertType = ConvertType.REFUND,
            Pax = new List<AmendPersonWithDetails>()
        };

        var validateBookingResponse = new ValidateAmendBookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                AmendmentCharges = -1
            }
        };

        var apiSettings = Options.Create(new ApiSettings
        {
            AmendBookingMemo = new AmendBookingMemoSettings
            {
                TransferChange = new MemoSettings { Code = "AMD2" },
                FlightTimeChange = new MemoSettings { Code = "AMD1" },
                NameChange = new MemoSettings { Code = "AMD3", Description = "Name change format: {0}" }
            }
        });

        _authServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _bookingRepositoryMock
            .Setup(x => x.ValidateAmendBookingInfo(It.IsAny<AmendBookingRequest>(), It.IsAny<BookingResponse>(), It.IsAny<bool>(), It.IsAny<bool>()))
            .ReturnsAsync(validateBookingResponse);

        _paymentServiceMock
            .Setup(x => x.ProcessPayment(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<Func<Task<BookingResponse>>>()))
            .ReturnsAsync(new BookingResponse());

        _refundServiceMock
            .Setup(x => x.ProcessRefund(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<ConvertType>()))
            .ReturnsAsync(new BookingResponse());

        var expectedMemoCode = "AMD3";
        var actualMemoCode = string.Empty;

        _memoServiceMock
            .Setup(x => x.GetAmendmentMemo(It.IsAny<AmendBookingRequest>(), It.IsAny<BookingResponse>()))
            .Returns(new BookingMemo { Code = expectedMemoCode });

        _bookingRepositoryMock
            .Setup(x => x.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>()))
            .Callback<string, BookingMemo>((reference, memo) => actualMemoCode = memo.Code).Returns(Task.CompletedTask);

        await _amendBookingService.AmendBooking(request);

        _bookingRepositoryMock
            .Verify(x => x.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>()), Times.Once);

        actualMemoCode.Should().Be(expectedMemoCode);
    }

    [Fact]
    public async Task AmendBooking_AddMemoCodes_AMD8_ChangeDate()
    {
        var request = new AmendBookingRequest
        {
            PaymentInfo = new CardPaymentInfo
            {
                Amount = -1
            },
            BookingReference = "AMEND",
            ConvertType = ConvertType.REFUND,
            Offer = new Offer()
        };

        var validateBookingResponse = new ValidateAmendBookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                AmendmentCharges = -1
            }
        };

        var apiSettings = Options.Create(new ApiSettings
        {
            AmendBookingMemo = new AmendBookingMemoSettings
            {
                TransferChange = new MemoSettings { Code = "AMD2" },
                FlightTimeChange = new MemoSettings { Code = "AMD1" },
                HolidayDateChange = new MemoSettings { Code = "AMD8" },
                NameChange = new MemoSettings { Code = "AMD3", Description = "Name change format: {0}" }
            }
        });

        _authServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _bookingRepositoryMock
            .Setup(x => x.ValidateAmendBookingInfo(It.IsAny<AmendBookingRequest>(), It.IsAny<BookingResponse>(), It.IsAny<bool>(), It.IsAny<bool>()))
            .ReturnsAsync(validateBookingResponse);

        _paymentServiceMock
            .Setup(x => x.ProcessPayment(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<Func<Task<BookingResponse>>>()))
            .ReturnsAsync(new BookingResponse());

        _refundServiceMock
            .Setup(x => x.ProcessRefund(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<ConvertType>()))
            .ReturnsAsync(new BookingResponse());

        var expectedMemoCode = "AMD8";
        var actualMemoCode = string.Empty;

        _memoServiceMock
            .Setup(x => x.GetAmendmentMemo(It.IsAny<AmendBookingRequest>(), It.IsAny<BookingResponse>()))
            .Returns(new BookingMemo {Code = expectedMemoCode});

        _bookingRepositoryMock
            .Setup(x => x.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>()))
            .Callback<string, BookingMemo>((reference, memo) => actualMemoCode = memo.Code).Returns(Task.CompletedTask);

        await _amendBookingService.AmendBooking(request);

        _bookingRepositoryMock
            .Verify(x => x.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>()), Times.Once);

        actualMemoCode.Should().Be(expectedMemoCode);
    }

    [Fact]
    public async Task AmendBooking_AddMemoCodes_AMD11_ChangeDate()
    {
        var request = new AmendBookingRequest
        {
            PaymentInfo = new CardPaymentInfo
            {
                Amount = -1
            },
            BookingReference = "AMEND",
            ConvertType = ConvertType.REFUND,
            AmendHotelOffer = new AmendHotelOffer()
        };

        var validateBookingResponse = new ValidateAmendBookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                AmendmentCharges = -1
            }
        };

        var apiSettings = Options.Create(new ApiSettings
        {
            AmendBookingMemo = new AmendBookingMemoSettings
            {
                TransferChange = new MemoSettings { Code = "AMD2" },
                FlightTimeChange = new MemoSettings { Code = "AMD1" },
                HolidayDateChange = new MemoSettings { Code = "AMD8" },
                AccommodationChange = new MemoSettings { Code = "AMD11" },
                NameChange = new MemoSettings { Code = "AMD3", Description = "Name change format: {0}" }
            }
        });

        _authServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _bookingRepositoryMock
            .Setup(x => x.ValidateAmendBookingInfo(It.IsAny<AmendBookingRequest>(), It.IsAny<BookingResponse>(), It.IsAny<bool>(), It.IsAny<bool>()))
            .ReturnsAsync(validateBookingResponse);

        _paymentServiceMock
            .Setup(x => x.ProcessPayment(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<Func<Task<BookingResponse>>>()))
            .ReturnsAsync(new BookingResponse());

        _refundServiceMock
            .Setup(x => x.ProcessRefund(It.IsAny<BookingRequest>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<ConvertType>()))
            .ReturnsAsync(new BookingResponse());

        var expectedMemoCode = "AMD11";
        var actualMemoCode = string.Empty;

        _memoServiceMock
            .Setup(x => x.GetAmendmentMemo(It.IsAny<AmendBookingRequest>(), It.IsAny<BookingResponse>()))
            .Returns(new BookingMemo { Code = expectedMemoCode });

        _bookingRepositoryMock
            .Setup(x => x.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>()))
            .Callback<string, BookingMemo>((reference, memo) => actualMemoCode = memo.Code).Returns(Task.CompletedTask);

        await _amendBookingService.AmendBooking(request);

        _bookingRepositoryMock
            .Verify(x => x.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>()), Times.Once);

        actualMemoCode.Should().Be(expectedMemoCode);
    }
}
