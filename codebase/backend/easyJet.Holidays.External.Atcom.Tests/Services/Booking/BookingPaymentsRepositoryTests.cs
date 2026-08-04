using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Interfaces.Transliteration;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Mappers.Guests;
using easyJet.Holidays.External.Atcom.Models.Booking;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Atcom.Services.Booking;
using easyJet.Holidays.External.Domain.Api;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using BookingResponse = easyJet.Holidays.Api.Domain.Data.Booking.BookingResponse;
using CustomerDetails = easyJet.Holidays.Api.Domain.Data.Authentication.CustomerDetails;
using Payment = easyJet.Holidays.Api.Domain.Settings.Payment;

namespace easyJet.Holidays.External.Atcom.Tests.Services.Booking;

public class BookingPaymentsRepositoryTests
{
    private readonly Mock<IApiService> _mockApiService;
    private readonly EndpointsProvider _endpointsProvider;
    private readonly AtcomRequestGenerator _atcomRequestGenerator;
    private readonly Mock<IHttpContextAccessor> _mockHttpContextAccessor;
    private readonly Mock<IOptions<AtcomSettings>> _mockAtcomSettings;
    private readonly Mock<IOptions<ApiSettings>> _mockApiSettings;
    private readonly Mock<IAuthenticationService> _mockAuthenticationService;
    private readonly Mock<ILogger<BookingPaymentsRepository>> _mockLogger;
    private readonly RequestBookingMapper _requestBookingMapper;
    private readonly Mock<IBookingPaymentsMapper> _mockBookingPaymentsMapper;
    private readonly BookingPaymentsRepository _bookingPaymentsRepository;

    public BookingPaymentsRepositoryTests()
    {
        _mockApiService = new Mock<IApiService>();
        _mockHttpContextAccessor = new Mock<IHttpContextAccessor>();
        _mockAtcomSettings = new Mock<IOptions<AtcomSettings>>();
        _mockApiSettings = new Mock<IOptions<ApiSettings>>();
        _mockAuthenticationService = new Mock<IAuthenticationService>();
        _mockLogger = new Mock<ILogger<BookingPaymentsRepository>>();
        _mockBookingPaymentsMapper = new Mock<IBookingPaymentsMapper>();

        // Setup default AtcomSettings
        var atcomSettings = new AtcomSettings
        {
            Payment = new Payment { AuthSys = "TEST_AUTH_SYS" },
            OfflinePaymentProcess = false,
            Booking = new AtcomApiSettings { Host = "http://test-booking-host", BaseUrl = "/test-booking-base" },
            Search = new()
            {
                Uk = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchuk",
                },
                Ch = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchch",
                },
                De = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchde",
                },
                Fr = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchfr",
                }
            },
            PaymentCodes = new Dictionary<string, PaymentCodesSettings>
            {
                {
                    "refund",
                    new PaymentCodesSettings
                    {
                        Reason = "refund",
                        IsDefault = true,
                        Issued = new PaymentTypeSettings { Code = "CI", Group = "CA" },
                        Redeemed = new PaymentTypeSettings { Code = "CR", Group = "CA" }
                    }
                }
            },
            ErrorsToIgnoreInModifyCustPaymentResponse = null,
            CltInfo = new AtcomCltInfoSettings
            {
                TermCode = "TEST",
                Channel = "TEST_CHANNEL",
                AgentGroups = new()
                    {
                        {
                            "default",
                            new ()
                            {
                                AgentsNames = new() {
                                    {"CH", "WACHFS" },
                                    {"UK", "WAGBP" }
                                },
                                UserNames = new() {
                                    { "CH", "WACHFS" },
                                    {"UK", "WAGBP" }
                                },
                            }
                        }
                    }
            }
        };
        _mockAtcomSettings.Setup(x => x.Value).Returns(atcomSettings);

        // Setup default ApiSettings
        var apiSettings = new ApiSettings
        {
            Vouchers = new VoucherSettings
            {
                GiftCards = new VoucherReasonSettings
                {
                    Types = new List<string> { "giftcard", "gift_card" }
                },
                PromoVouchers = new VoucherReasonSettings
                {
                    Types = new List<string>()
                },
                Types = new VoucherTypeSettings
                {
                    GiftCard = "giftcard",
                    Goodwill = "goodwill",
                    OneTimeUse = "onetimeuse"
                }
            }
        };
        _mockApiSettings.Setup(x => x.Value).Returns(apiSettings);

        // Setup default HttpContext
        var httpContext = new Mock<HttpContext>();
        var request = new Mock<HttpRequest>();
        var cookies = new Mock<IRequestCookieCollection>();
        httpContext.Setup(x => x.Request).Returns(request.Object);
        request.Setup(x => x.Cookies).Returns(cookies.Object);
        _mockHttpContextAccessor.Setup(x => x.HttpContext).Returns(httpContext.Object);

        // Create EndpointsProvider as real instance (not mockable)
        var mockEnvBehaviorSettings = new Mock<IOptions<EnvironmentBehaviourSettings>>();
        mockEnvBehaviorSettings.Setup(x => x.Value).Returns(new EnvironmentBehaviourSettings { AllowMockCookies = false });
        var mockCookiesService = new Mock<ICookiesService>();
        var mockEndpointsLogger = new Mock<ILogger<EndpointsProvider>>();
        _endpointsProvider = new EndpointsProvider(
            _mockAtcomSettings.Object,
            mockEnvBehaviorSettings.Object,
            mockCookiesService.Object,
            mockEndpointsLogger.Object);

        // Create AtcomRequestGenerator as real instance (not mockable)
        var mockTradeAgentAuthService = new Mock<ITradeAgentAuthenticationService>();
        _atcomRequestGenerator = new AtcomRequestGenerator(
            _mockAtcomSettings.Object,
            mockTradeAgentAuthService.Object,
            null,
            null);

        // Create RequestBookingMapper as real instance (not mockable)
        var priceMapper = new PriceMapper(_mockAtcomSettings.Object, _mockApiSettings.Object, mockTradeAgentAuthService.Object);
        var seatsMapper = new SeatsMapper();
        var mockLanguageSettings = new Mock<IOptions<LanguageSettings>>();
        mockLanguageSettings.Setup(x => x.Value).Returns(new LanguageSettings
        {
            MarketLanguages = new Dictionary<string, IEnumerable<string>>
            {
                { "UK", new[] { "en" } }
            }
        });
        var mockReferenceDataService = new Mock<IReferenceDataService>();
        var mockLuggageService = new Mock<ILuggageService>();
        var mockFlightExtraService = new Mock<IFlightExtraService>();
        var mockExtraLuggageLogger = new Mock<ILogger<ExtraLuggageMapper>>();
        var extraLuggageMapper = new ExtraLuggageMapper(mockReferenceDataService.Object, mockLuggageService.Object, mockFlightExtraService.Object, mockExtraLuggageLogger.Object);
        var mockTransliterationService = new Mock<ITransliterationService>();
        var guestsMapper = new GuestsMapper(mockTransliterationService.Object);
        _requestBookingMapper = new RequestBookingMapper(
            _mockAtcomSettings.Object,
            priceMapper,
            seatsMapper,
            _atcomRequestGenerator,
            mockLanguageSettings.Object,
            extraLuggageMapper,
            guestsMapper);

        _bookingPaymentsRepository = new BookingPaymentsRepository(
            _mockApiService.Object,
            _endpointsProvider,
            _atcomRequestGenerator,
            _mockHttpContextAccessor.Object,
            _mockAtcomSettings.Object,
            _mockApiSettings.Object,
            _mockAuthenticationService.Object,
            _mockLogger.Object,
            _requestBookingMapper,
            _mockBookingPaymentsMapper.Object);
    }

    [Fact]
    public async Task AddCreditPaymentInfo_WithPaymentInfo_ShouldReturnBookingResponse()
    {
        // Arrange
        var paymentInfo = new CardPaymentInfo { Amount = 100m };
        var leadPassenger = new LeadPassenger { Email = "test@test.com" };
        var paymentResponse = new MakePaymentResponse();
        var bookingReference = "TEST123";
        var bookingMarket = "UK";
        var bookingLanguage = "en";
        var sessionId = "session123";
        var requestId = "request123";
        var customerId = "customerId123";
        var bookingRequest = new Models.Booking.BookingRequest
        {
            Payload = new easyJet.Holidays.External.Domain.Models.Api.Payload.XmlApiPayload<Models.Internal.BookingRequest>
            {
                Body = new Models.Internal.BookingRequest()
            }
        };
        var bookingWithPaymentRequest = new BookingWithPaymentRequest(bookingRequest);
        var bookingWithPaymentResponse = new BookingWithPaymentResponse
        {
            Payload = new easyJet.Holidays.External.Domain.Models.Api.Payload.XmlApiPayload<ModifyCustPaymentResponse>
            {
                Body = new ModifyCustPaymentResponse()
            }
        };

        _mockAuthenticationService
            .Setup(x => x.MappedCustomerId(It.IsAny<CustomerDetails>()))
            .ReturnsAsync(customerId);

        _mockBookingPaymentsMapper
            .Setup(x => x.MapModifyCustPaymentRequest(
                paymentInfo,
                leadPassenger,
                paymentResponse,
                It.IsAny<Models.Booking.BookingRequest>(),
                bookingReference,
                "TEST_AUTH_SYS",
                false))
            .Returns(bookingWithPaymentRequest);

        _mockApiService
            .Setup(x => x.GetResponseContentAsyncCustomErrorHandling<BookingWithPaymentRequest, BookingWithPaymentResponse>(
                It.IsAny<BookingWithPaymentRequest>()))
            .ReturnsAsync(bookingWithPaymentResponse);


        // Act
        var result = await _bookingPaymentsRepository.AddCreditPaymentInfo(
            paymentInfo,
            leadPassenger,
            paymentResponse,
            bookingReference,
            bookingMarket,
            bookingLanguage,
            sessionId,
            requestId);

        // Assert
        result.Should().NotBeNull();
        _mockAuthenticationService.Verify(x => x.MappedCustomerId(It.IsAny<CustomerDetails>()), Times.Once);
        _mockBookingPaymentsMapper.Verify(x => x.MapModifyCustPaymentRequest(
            paymentInfo,
            leadPassenger,
            paymentResponse,
            It.IsAny<Models.Booking.BookingRequest>(),
            bookingReference,
            "TEST_AUTH_SYS",
            false), Times.Once);
        _mockApiService.Verify(x => x.GetResponseContentAsyncCustomErrorHandling<BookingWithPaymentRequest, BookingWithPaymentResponse>(
            It.IsAny<BookingWithPaymentRequest>()), Times.Once);
    }

    [Fact]
    public async Task AddCreditPaymentInfo_WithPaymentHistoryItem_ShouldReturnBookingResponse()
    {
        // Arrange
        var bookingReference = "TEST123";
        var bookingMarket = "UK";
        var bookingLanguage = "en";
        var paymentItem = new PaymentHistoryItem
        {
            Amount = 50m,
            CurIso = "GBP",
            Card = new PaymentCard { Number = "123456789", Code = "VISA", ExpDate = "12/25" }
        };
        var refundAgainstId = "refund123";
        var paymentId = "payment123";
        var leadPassenger = new LeadPassenger { Email = "test@test.com" };
        var sessionId = "session123";
        var requestId = "request123";
        var customerId = "customerId123";
        var bookingRequest = new Models.Booking.BookingRequest
        {
            Payload = new easyJet.Holidays.External.Domain.Models.Api.Payload.XmlApiPayload<Models.Internal.BookingRequest>
            {
                Body = new Models.Internal.BookingRequest()
            }
        };
        var bookingWithPaymentRequest = new BookingWithPaymentRequest(bookingRequest);
        var bookingWithPaymentResponse = new BookingWithPaymentResponse
        {
            Payload = new easyJet.Holidays.External.Domain.Models.Api.Payload.XmlApiPayload<ModifyCustPaymentResponse>
            {
                Body = new ModifyCustPaymentResponse()
            }
        };
        var expectedBookingResponse = new BookingResponse { BookingReference = bookingReference };


        _mockAuthenticationService
            .Setup(x => x.MappedCustomerId(It.IsAny<CustomerDetails>()))
            .ReturnsAsync(customerId);

        _mockBookingPaymentsMapper
            .Setup(x => x.MapModifyCustPaymentRequest(
                bookingReference,
                paymentItem,
                refundAgainstId,
                paymentId,
                It.IsAny<Models.Booking.BookingRequest>()))
            .Returns(bookingWithPaymentRequest);

        _mockApiService
            .Setup(x => x.GetResponseContentAsyncCustomErrorHandling<BookingWithPaymentRequest, BookingWithPaymentResponse>(
                It.IsAny<BookingWithPaymentRequest>()))
            .ReturnsAsync(bookingWithPaymentResponse);


        // Act
        var result = await _bookingPaymentsRepository.AddCreditPaymentInfo(
            bookingReference,
            bookingMarket,
            bookingLanguage,
            paymentItem,
            refundAgainstId,
            paymentId,
            leadPassenger,
            sessionId,
            requestId);

        // Assert
        result.Should().NotBeNull();
        _mockAuthenticationService.Verify(x => x.MappedCustomerId(It.IsAny<CustomerDetails>()), Times.Once);
        _mockBookingPaymentsMapper.Verify(x => x.MapModifyCustPaymentRequest(
            bookingReference,
            paymentItem,
            refundAgainstId,
            paymentId,
            It.IsAny<Models.Booking.BookingRequest>()), Times.Once);
        _mockApiService.Verify(x => x.GetResponseContentAsyncCustomErrorHandling<BookingWithPaymentRequest, BookingWithPaymentResponse>(
            It.IsAny<BookingWithPaymentRequest>()), Times.Once);
    }

    [Fact]
    public async Task AddCreditPaymentInfo_WithReasonCodeAndAmount_ShouldReturnBookingResponse()
    {
        // Arrange
        var reasonCode = "refund";
        var amount = -100m; // Negative for refund (issued)
        var leadPassenger = new LeadPassenger { Email = "test@test.com" };
        var bookingReference = "TEST123";
        var bookingMarket = "UK";
        var bookingLanguage = "en";
        var voucherId = "voucher123";
        var sessionId = "session123";
        var requestId = "request123";
        var customerId = "customerId123";
        var bookingRequest = new Models.Booking.BookingRequest
        {
            Payload = new easyJet.Holidays.External.Domain.Models.Api.Payload.XmlApiPayload<Models.Internal.BookingRequest>
            {
                Body = new Models.Internal.BookingRequest()
            }
        };
        var bookingWithPaymentRequest = new BookingWithPaymentRequest(bookingRequest);
        var bookingWithPaymentResponse = new BookingWithPaymentResponse
        {
            Payload = new easyJet.Holidays.External.Domain.Models.Api.Payload.XmlApiPayload<ModifyCustPaymentResponse>
            {
                Body = new ModifyCustPaymentResponse()
            }
        };
        var expectedBookingResponse = new BookingResponse { BookingReference = bookingReference };


        _mockAuthenticationService
            .Setup(x => x.MappedCustomerId(It.IsAny<CustomerDetails>()))
            .ReturnsAsync(customerId);

        _mockBookingPaymentsMapper
            .Setup(x => x.MapCreditModifyCustPaymentRequest(
                amount,
                bookingReference,
                It.IsAny<PaymentTypeSettings>(),
                It.IsAny<Models.Booking.BookingRequest>(),
                voucherId))
            .Returns(bookingWithPaymentRequest);

        _mockApiService
            .Setup(x => x.GetResponseContentAsyncCustomErrorHandling<BookingWithPaymentRequest, BookingWithPaymentResponse>(
                It.IsAny<BookingWithPaymentRequest>()))
            .ReturnsAsync(bookingWithPaymentResponse);


        // Act
        var result = await _bookingPaymentsRepository.AddCreditPaymentInfo(
            reasonCode,
            amount,
            leadPassenger,
            bookingReference,
            bookingMarket,
            bookingLanguage,
            voucherId,
            sessionId,
            requestId);

        // Assert
        result.Should().NotBeNull();
        _mockAuthenticationService.Verify(x => x.MappedCustomerId(It.IsAny<CustomerDetails>()), Times.Once);
        // Verify that MapCreditModifyCustPaymentRequest was called with Issued payment type (since amount is negative)
        _mockBookingPaymentsMapper.Verify(x => x.MapCreditModifyCustPaymentRequest(
            amount,
            bookingReference,
            It.Is<PaymentTypeSettings>(pt => pt.Code == "CI" && pt.Group == "CA"), // Issued for negative amount
            It.IsAny<Models.Booking.BookingRequest>(),
            voucherId), Times.Once);
        _mockApiService.Verify(x => x.GetResponseContentAsyncCustomErrorHandling<BookingWithPaymentRequest, BookingWithPaymentResponse>(
            It.IsAny<BookingWithPaymentRequest>()), Times.Once);
    }
}
