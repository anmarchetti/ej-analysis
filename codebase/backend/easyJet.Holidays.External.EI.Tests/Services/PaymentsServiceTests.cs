using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using easyJet.Holidays.External.Domain.Services;
using easyJet.Holidays.External.EI.Models;
using easyJet.Holidays.External.EI.Services;
using easyJet.Holidays.External.EI.Services.Payment;
using easyJet.Holidays.Tests.Domain;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using FluentAssertions;
using Xunit;
using MakePaymentResponse = easyJet.Holidays.Api.Domain.Data.Payment.MakePaymentResponse;
using PaxPrice = easyJet.Holidays.Api.Domain.Data.PackageOffers.PaxPrice;
using RefundPaymentResponse = easyJet.Holidays.Api.Domain.Data.Payment.RefundPaymentResponse;

namespace easyJet.Holidays.External.EI.Tests.Services;

public class PaymentsServiceTests
{
    private IFixture _fixture { get; }
    private readonly Mock<IApiService> _mockApiService;
    private readonly PaymentsService _paymentsService;
    private readonly IOptions<PaymentsSettings> _mockPaymentsSettings;

    #region Mock Request/Responses

    string bookingReference = "ABC123";
    string sessionId = "0001";
    static string paymentId = "1";
    static decimal amount = 100;
    static string currency = "GBP";
    private string customerEmail = "test@test.com";

    BookingAccommodation accom = new BookingAccommodation()
    {
        Hotel = new OfferHotel()
        {
            Address = "Test address",
            City = "Test City",
            Location = new HotelLocation() { Name = "Test Name", },
            Country = new HotelCountry() { Code = "UK" },
            Name = "Hotel Name",
            StarRating = "5",
        },
        StartDate = "20/05/25",
        EndDate = "27/05/25",
        Code = "Accom Test Code",
        Rooms = new List<Unit>()
        {
            new()
            {
                Board = "Test Board",
                BoardName = "Test Board Name",
                PaxPrices = new List<PaxPrice>() { new() { PaxIndex = "1", Price = 0 } }
            }
        }
    };

    readonly PriceInfo _paymentInfo = new() { BalanceDueAmount = 0, TotalPrice = 100, Currency = currency };

    BookingRequest bookingRequestWithCardPayment = new()
    {
        PaymentInfo = new CardPaymentInfo()
        {
            BillingInfo = new BillingInfo()
            {
                FullName = "Test FullName",
                Address = "Test Address",
                Address2 = "Test Address2",
                City = "Test City",
                PostCode = "Test PostCode",
            },
            ExpirationDate = "12/30",
            Amount = amount,
            ChallengeComplete = false,
            TransStatus = "PENDING",
            ThreeDSServerTransID = "1",
            FingerprintError = false,
            ChallengeError = false,
            FingerprintTimeout = true,
            PaRes = "PaRes",
            Md = "Md",
            AuthenticationError = false,
            CardNumber = "4444333322221111",
            CVV = "737",
            NameOnCard = "Test NameOnCard",
            IssueNumber = "1234567890",
            IssuerUrl = new Uri("https://test.com"),
            PaymentType = PaymentType.CreditDebitCard
        },
        DeviceId = "DeviceId Test",
        LeadPassenger = new LeadPassenger() { Email = "test@test.com", Phone = "123456789", },
        Offer = new Offer()
        {
            Transport = new Transport()
            {
                Routes = new List<Route>()
                {
                    new()
                    {
                        DepPt = "DepPt Test", DepDate = DateTime.Now, FltNo = "123", ArrPt = "ArrPt Test",
                    }
                }
            }
        },
        Guests = new List<PersonWithDetails>()
        {
            new()
            {
                Index = "1",
                FirstName = "John",
                LastName = "Doe",
                Title = "mr",
                Age = 18,
            }
        },
        BrowserInfo = new BrowserInfo()
        {
            AcceptHeader = "AcceptHeader",
            ColourDepth = 1,
            JavaEnabled = false,
            JavaScriptEnabled = true,
            Language = "EN",
            ScreenHeight = 1080,
            ScreenWidth = 1920,
            TimeZoneOffset = 10,
            UserAgent = "UserAgent",
        }
    };

    MarketSettings marketSettings = new() { Code = "Test Code MarketSettings", CountryCode = "UK", };

    #endregion

    public PaymentsServiceTests()
    {
        _fixture = FixtureUtils.AutoMoqFixture();

        var connectionMock = _fixture.Freeze<Mock<ConnectionInfo>>();
        connectionMock
            .SetupGet(cm => cm.RemoteIpAddress)
            .Returns(new System.Net.IPAddress(2130706433));

        var contextMock = _fixture.Freeze<Mock<HttpContext>>();
        contextMock
            .SetupGet(c => c.Connection)
            .Returns(connectionMock.Object);

        Mock<IHttpContextAccessor> mockHttpContextAccessor = _fixture.Freeze<Mock<IHttpContextAccessor>>();
        mockHttpContextAccessor
            .SetupGet(x => x.HttpContext)
            .Returns(contextMock.Object);

        _mockApiService = new Mock<IApiService>();
        Mock<EndpointsProvider> mockEndpointsProvider = CreateEndpointProvider();
        Mock<ILogger<PaymentsService>> mockLogger = new();
        Mock<IMarketService> mockMarketService = new();
        IOptions<HeadersSettings> headerSettings = Options.Create(new HeadersSettings());
        _mockPaymentsSettings = Options.Create(new PaymentsSettings
        {
            ThreeDSCallbackHost = "threeDSCallbackHost",
            IdentifyNotificationUrl = "identifyNotificationUrl",
            ApiKey = "apiKey",
            RefundChannel = "RefundChannel",
        });
        _paymentsService = new PaymentsService(
            _mockApiService.Object,
            mockEndpointsProvider.Object,
            mockHttpContextAccessor.Object,
            _mockPaymentsSettings,
            mockLogger.Object,
            headerSettings,
            mockMarketService.Object
        );
    }

    [Fact]
    public async Task MakePaymentWithCardAndIdentifyCode_ShouldReturnOk()
    {
        Models.MakePaymentResponse apiResponse = GenerateMakePaymentResponseForCardWithIdentify();

        _mockApiService.Setup(service =>
            service.GetResponseContentAsync<MakePaymentRequest, Models.MakePaymentResponse>(
                It.IsAny<MakePaymentRequest>())).ReturnsAsync(apiResponse);

        MakePaymentResponse response = await _paymentsService.MakePayment(accom, _paymentInfo,
            bookingRequestWithCardPayment, bookingReference, sessionId, marketSettings);

        Assert.NotNull(response);
        Assert.Equal(PaymentResultCode.IDENTIFY, response.ResultCode);
        Assert.Equal(response.AuthCode, apiResponse.Payload.Body.TransactionDetail.AuthCode);
        Assert.Equal(response.TransNo, apiResponse.Payload.Body.TransactionDetail.TransactionId);
        Assert.Equal(response.TransactionTime, apiResponse.Payload.Body.TransactionDetail.TransactionTime);
        Assert.Equal(response.PayDetails, apiResponse.Payload.Body.TransactionDetail.Provider);
        Assert.Equal(response.PaymentId, apiResponse.Payload.Body.PaymentId);
        Assert.Equal(response.PaymentMethodTypeCode, apiResponse.Payload.Body.PaymentMethodTypeCode);
        Assert.True(apiResponse.Payload.Body.Amount.Value.HasValue);
        Assert.Equal(response.Amount, apiResponse.Payload.Body.Amount.Value.Value);
        Assert.Equal(response.Currency, apiResponse.Payload.Body.Amount.CurrencyCode);
        Assert.Equal(response.CardNumber, apiResponse.Payload.Body.TransactionDetail?.Card?.CardNumber);
        Assert.Equal(response.ThreeDSServerTransID,
            apiResponse.Payload.Body.PayerAuthToken?.ThreeDS2Data.Data[0].Value);
        Assert.Equal(response.TransactionReference, apiResponse.Payload.Body.TransactionDetail?.TransactionReference);
        Assert.Equal(response.ThreeDSMethodURL, apiResponse.Payload.Body.PayerAuthToken?.ThreeDS2Data.Data[1].Value);
        Assert.Equal(response.MethodNotificationURL,
            _mockPaymentsSettings.Value.ThreeDSCallbackHost + _mockPaymentsSettings.Value.IdentifyNotificationUrl);
    }

    [Fact]
    public async Task MakePaymentWithCardAndChallengeCode_ShouldReturnOk()
    {
        Models.MakePaymentResponse apiResponse = GenerateMakePaymentResponseForCardWithChallenge();

        _mockApiService.Setup(service =>
            service.GetResponseContentAsync<MakePaymentRequest, Models.MakePaymentResponse>(
                It.IsAny<MakePaymentRequest>())).ReturnsAsync(apiResponse);

        MakePaymentResponse response = await _paymentsService.MakePayment(accom, _paymentInfo,
            bookingRequestWithCardPayment, bookingReference, sessionId, marketSettings);

        Assert.NotNull(response);
        Assert.Equal(PaymentResultCode.CHALLENGE, response.ResultCode);
        Assert.Equal(response.AuthCode, apiResponse.Payload.Body.TransactionDetail.AuthCode);
        Assert.Equal(response.TransNo, apiResponse.Payload.Body.TransactionDetail.TransactionId);
        Assert.Equal(response.TransactionTime, apiResponse.Payload.Body.TransactionDetail.TransactionTime);
        Assert.Equal(response.PayDetails, apiResponse.Payload.Body.TransactionDetail.Provider);
        Assert.Equal(response.PaymentId, apiResponse.Payload.Body.PaymentId);
        Assert.Equal(response.PaymentMethodTypeCode, apiResponse.Payload.Body.PaymentMethodTypeCode);
        Assert.True(apiResponse.Payload.Body.Amount.Value.HasValue);
        Assert.Equal(response.Amount, apiResponse.Payload.Body.Amount.Value.Value);
        Assert.Equal(response.Currency, apiResponse.Payload.Body.Amount.CurrencyCode);
        Assert.Equal(response.CardNumber, apiResponse.Payload.Body.TransactionDetail?.Card?.CardNumber);
        Assert.Equal(response.ThreeDSServerTransID,
            apiResponse.Payload.Body.PayerAuthToken?.ThreeDS2Data.Data[0].Value);
        Assert.Equal(response.TransactionReference, apiResponse.Payload.Body.TransactionDetail?.TransactionReference);
        Assert.Equal(response.AcsTransID, apiResponse.Payload.Body.PayerAuthToken?.ThreeDS2Data.Data[1].Value);
        Assert.Equal(response.MessageVersion, apiResponse.Payload.Body.PayerAuthToken?.ThreeDS2Data.Data[2].Value);
        Assert.Equal(response.AcsURL, apiResponse.Payload.Body.PayerAuthToken?.ThreeDS2Data.Data[3].Value);
    }

    [Fact]
    public async Task MakePaymentWithCardAndRedirectCode_ShouldReturnOk()
    {
        Models.MakePaymentResponse apiResponse = GenerateMakePaymentResponseForCardWithRedirect();

        _mockApiService.Setup(service =>
            service.GetResponseContentAsync<MakePaymentRequest, Models.MakePaymentResponse>(
                It.IsAny<MakePaymentRequest>())).ReturnsAsync(apiResponse);

        MakePaymentResponse response = await _paymentsService.MakePayment(accom, _paymentInfo,
            bookingRequestWithCardPayment, bookingReference, sessionId, marketSettings);

        Assert.NotNull(response);
        Assert.Equal(PaymentResultCode.REDIRECT, response.ResultCode);
        Assert.Equal(response.AuthCode, apiResponse.Payload.Body.TransactionDetail.AuthCode);
        Assert.Equal(response.TransNo, apiResponse.Payload.Body.TransactionDetail.TransactionId);
        Assert.Equal(response.TransactionTime, apiResponse.Payload.Body.TransactionDetail.TransactionTime);
        Assert.Equal(response.PayDetails, apiResponse.Payload.Body.TransactionDetail.Provider);
        Assert.Equal(response.PaymentId, apiResponse.Payload.Body.PaymentId);
        Assert.Equal(response.PaymentMethodTypeCode, apiResponse.Payload.Body.PaymentMethodTypeCode);
        Assert.True(apiResponse.Payload.Body.Amount.Value.HasValue);
        Assert.Equal(response.Amount, apiResponse.Payload.Body.Amount.Value.Value);
        Assert.Equal(response.Currency, apiResponse.Payload.Body.Amount.CurrencyCode);
        Assert.Equal(response.CardNumber, apiResponse.Payload.Body.TransactionDetail?.Card?.CardNumber);
        Assert.Equal(response.IssuerUrl, apiResponse.Payload.Body.PayerAuthToken?.IssuerUrl);
        Assert.Equal(response.Md, apiResponse.Payload.Body.PayerAuthToken?.Md);
        Assert.Equal(response.PaReq, apiResponse.Payload.Body.PayerAuthToken?.PaReq);
        Assert.Equal(response.TermUrl,
            _mockPaymentsSettings.Value.ThreeDSCallbackHost + _mockPaymentsSettings.Value.ThreeDSOneNotificationUrl);
    }

    [Fact]
    public async Task MakePaymentWithApplePayWithIdentifyCode_ShouldReturnOk()
    {
        Models.MakePaymentResponse apiResponse = GenerateMakePaymentResponseForApplePay("AM");
        ApplePayPaymentMethod applePayPaymentMethod = new ApplePayPaymentMethod() { Network = "Mastercard", Type = "Credit" };
        BookingRequest bookingRequestWithApplePayPayment = MakeBookingRequestWithApplePayPayment(applePayPaymentMethod);

        _mockApiService.Setup(service =>
            service.GetResponseContentAsync<MakePaymentRequest, Models.MakePaymentResponse>(
                It.IsAny<MakePaymentRequest>())).ReturnsAsync(apiResponse);

        MakePaymentResponse response = await _paymentsService.MakePayment(accom, _paymentInfo,
            bookingRequestWithApplePayPayment, bookingReference, sessionId, marketSettings);

        response.Should().NotBeNull();
        response.AcsTransID.Should().BeNull();
        response.AcsURL.Should().BeNull();
        response.Amount.Should().Be(100);
        response.AuthCode.Should().Be("005128");
        response.BookingReference.Should().BeNull();
        response.CardNumber.Should().BeNull();
        response.Currency.Should().Be("GBP");
        response.IssuerUrl.Should().BeNull();
        response.Md.Should().BeNull();
        response.MessageVersion.Should().BeNull();
        response.MethodNotificationURL.Should().BeNull();
        response.PaReq.Should().BeNull();
        response.PayDetails.Should().Be("ADYEN");
        response.PaymentId.Should().Be("1");
        response.PaymentMethodTypeCode.Should().Be("AM");
        response.RequestId.Should().BeNull();
        response.ResultCode.Should().Be("Success");
        response.SessionId.Should().BeNull();
        response.TermUrl.Should().BeNull();
        response.ThreeDSMethodURL.Should().BeNull();
        response.ThreeDSServerTransID.Should().BeNull();
        response.TransNo.Should().Be("GQDRLFSHGWVV9ST5");
        response.TransactionReference.Should().BeNull();
        response.TransactionTime.Should().Be("2025-05-22T13:07:59.0045708+01:00");
    }

    [Theory]
    [InlineData("Visa", "Credit", "AV")]
    [InlineData("Visa", "Debit", "AL")]
    [InlineData("Mastercard", "Credit", "AM")]
    [InlineData("Mastercard", "Debit", "AD")]
    [InlineData("Amex", "Whatever", "AA")]
    public async Task MakePaymentWithApplePay_ShouldSetCorrectCardType(string network, string type, string expectedApplePayCardType)
    {
        ApplePayPaymentMethod applePayPaymentMethod = new ApplePayPaymentMethod() { Network = network, Type = type };
        BookingRequest bookingRequestWithApplePayPayment = MakeBookingRequestWithApplePayPayment(applePayPaymentMethod);

        Models.MakePaymentResponse apiResponse = GenerateMakePaymentResponseForApplePay(expectedApplePayCardType);

        _mockApiService.Setup(service =>
            service.GetResponseContentAsync<MakePaymentRequest, Models.MakePaymentResponse>(
                It.Is<MakePaymentRequest>(x => RequestMatchesCardType(x, expectedApplePayCardType)))).ReturnsAsync(apiResponse);

        MakePaymentResponse response = await _paymentsService.MakePayment(accom, _paymentInfo,
            bookingRequestWithApplePayPayment, bookingReference, sessionId, marketSettings);

        response.Should().NotBeNull();
        response.PaymentMethodTypeCode.Should().Be(expectedApplePayCardType);
    }

    private static bool RequestMatchesCardType(MakePaymentRequest makePaymentRequest, string applePayCardType)
    {
        return makePaymentRequest.Payload.Body.PaymentDetail.ApplePay.CardType == applePayCardType;
    }

    [Fact]
    public async Task RefundPayment_ShouldReturnOk()
    {
        Models.RefundPaymentResponse apiResponse = GenerateRefundPaymentResponse();

        _mockApiService.Setup(service =>
            service.GetResponseContentAsync<RefundPaymentRequest, Models.RefundPaymentResponse>(
                It.IsAny<RefundPaymentRequest>())).ReturnsAsync(apiResponse);

        RefundPaymentResponse response =
            await _paymentsService.RefundPayment(bookingReference, paymentId, amount, currency, customerEmail);

        Assert.NotNull(response);
        Assert.Equal(response.Result, apiResponse.Payload.Body.TransactionDetail.Result);
        Assert.Equal(response.Status, apiResponse.Payload.Body.TransactionDetail.Status);
        Assert.Equal(response.PaymentId, apiResponse.Payload.Body.PaymentId);
    }

    private static Mock<EndpointsProvider> CreateEndpointProvider()
    {
        var mockPaymentsSettings = new Mock<IOptions<PaymentsSettings>>();
        mockPaymentsSettings.Setup(options => options.Value).Returns(new PaymentsSettings()
        {
            MakePayment = new UrlSettings() { Host = "https://test.com", Path = "api/payments", },
            CancelPayment = new UrlSettings() { Host = "https://test.com", Path = "api/payments/cancel", },
            RefundPayment = new UrlSettings() { Host = "https://test.com", Path = "api/payments/refund", }
        });

        var envBehaviorSettings = new Mock<IOptions<EnvironmentBehaviourSettings>>();
        envBehaviorSettings.Setup(options => options.Value).Returns(new EnvironmentBehaviourSettings());

        var cookieService = new Mock<ICookiesService>();
        var logger = new Mock<ILogger<BaseEndpointsProvider>>();

        return new Mock<EndpointsProvider>(mockPaymentsSettings.Object, envBehaviorSettings.Object,
            cookieService.Object, logger.Object);
    }

    private static Models.MakePaymentResponse GenerateMakePaymentResponseForCardWithIdentify()
    {
        Models.MakePaymentResponse apiResponse = new()
        {
            Payload = new JsonApiPayload<MakePaymentResponseBody>()
            {
                Body = new MakePaymentResponseBody()
                {
                    ResultCode = PaymentResultCode.IDENTIFY,
                    TransactionDetail = new MakePaymentResponseTransactionDetail()
                    {
                        AuthCode = "123",
                        TransactionId = "123",
                        TransactionTime = "31/12/2050",
                        Provider = "test provider",
                        Card = new Card() { CardNumber = "4444333322221111", },
                        TransactionReference = "Test TransactionReference",
                    },
                    PaymentId = paymentId,
                    PaymentMethodTypeCode = "Test Payment Method Type Code",
                    Amount = new MakePaymentResponseAmount() { Value = amount, CurrencyCode = currency, },
                    PayerAuthToken = new PayerAuthToken()
                    {
                        ThreeDS2Data = new PayerAuthTokenThreeDS2Data()
                        {
                            Data =
                            [
                                new PayerAuthTokenThreeDS2DataData
                                {
                                    Key = "threeDSServerTransID", Value = "threeDSServerTransID value",
                                },
                                new PayerAuthTokenThreeDS2DataData
                                {
                                    Key = "threeDSMethodURL", Value = "threeDSMethodURL value",
                                },
                            ]
                        }
                    },
                }
            }
        };

        return apiResponse;
    }

    private static Models.MakePaymentResponse GenerateMakePaymentResponseForCardWithChallenge()
    {
        Models.MakePaymentResponse apiResponse = new()
        {
            Payload = new JsonApiPayload<MakePaymentResponseBody>()
            {
                Body = new MakePaymentResponseBody()
                {
                    ResultCode = PaymentResultCode.CHALLENGE,
                    TransactionDetail = new MakePaymentResponseTransactionDetail()
                    {
                        AuthCode = "123",
                        TransactionId = "123",
                        TransactionTime = "31/12/2050",
                        Provider = "test provider",
                        Card = new Card() { CardNumber = "4444333322221111", },
                        TransactionReference = "Test TransactionReference",
                    },
                    PaymentId = paymentId,
                    PaymentMethodTypeCode = "Test Payment Method Type Code",
                    Amount = new MakePaymentResponseAmount() { Value = amount, CurrencyCode = currency, },
                    PayerAuthToken = new PayerAuthToken()
                    {
                        ThreeDS2Data = new PayerAuthTokenThreeDS2Data()
                        {
                            Data =
                            [
                                new PayerAuthTokenThreeDS2DataData
                                {
                                    Key = "threeDSServerTransID", Value = "threeDSServerTransID value",
                                },
                                new PayerAuthTokenThreeDS2DataData { Key = "acsTransID", Value = "acsTransID value", },
                                new PayerAuthTokenThreeDS2DataData
                                {
                                    Key = "messageVersion", Value = "messageVersion value",
                                },
                                new PayerAuthTokenThreeDS2DataData { Key = "acsURL", Value = "acsURL value", },
                            ]
                        }
                    },
                }
            }
        };

        return apiResponse;
    }

    private static Models.MakePaymentResponse GenerateMakePaymentResponseForCardWithRedirect()
    {
        Models.MakePaymentResponse apiResponse = new()
        {
            Payload = new JsonApiPayload<MakePaymentResponseBody>()
            {
                Body = new MakePaymentResponseBody()
                {
                    ResultCode = PaymentResultCode.REDIRECT,
                    TransactionDetail = new MakePaymentResponseTransactionDetail()
                    {
                        AuthCode = "123",
                        TransactionId = "123",
                        TransactionTime = "31/12/2050",
                        Provider = "test provider",
                        Card = new Card() { CardNumber = "4444333322221111", },
                        TransactionReference = "Test TransactionReference",
                    },
                    PaymentId = paymentId,
                    PaymentMethodTypeCode = "Test Payment Method Type Code",
                    Amount = new MakePaymentResponseAmount() { Value = amount, CurrencyCode = currency, },
                }
            }
        };

        return apiResponse;
    }

    private static Models.MakePaymentResponse GenerateMakePaymentResponseForApplePay(string paymentMethodTypeCode)
    {
        Models.MakePaymentResponse apiResponse = new()
        {
            Payload = new JsonApiPayload<MakePaymentResponseBody>()
            {
                Body = new MakePaymentResponseBody()
                {
                    Message = "Success",
                    Amount = new MakePaymentResponseAmount() { CurrencyCode = currency, Value = amount },
                    PaymentId = paymentId,
                    PaymentMethod = "ApplePay",
                    PaymentMethodTypeCode = paymentMethodTypeCode,
                    ResultCode = PaymentResultCode.SUCCESS,
                    TransactionDetail = new MakePaymentResponseTransactionDetail()
                    {
                        AuthCode = "005128",
                        ApplePay = new Models.ApplePay() { CardType = "AM" },
                        TransactionTime = "2025-05-22T13:07:59.0045708+01:00",
                        TransactionId = "GQDRLFSHGWVV9ST5",
                        Provider = "ADYEN",
                        ProviderId = 100
                    },
                    TransactionStatus = "SentForSettlement"
                }
            }
        };

        return apiResponse;
    }

    private static Models.RefundPaymentResponse GenerateRefundPaymentResponse()
    {
        Models.RefundPaymentResponse apiResponse = new()
        {
            Payload = new JsonApiPayload<RefundPaymentResponseBody>()
            {
                Body = new RefundPaymentResponseBody()
                {
                    TransactionDetail = new TransactionDetail() { Result = "OK", Status = "200" },
                    PaymentId = paymentId,
                }
            }
        };

        return apiResponse;
    }

    private static BookingRequest MakeBookingRequestWithApplePayPayment(ApplePayPaymentMethod applePayPaymentMethod)
    {
        BookingRequest bookingRequestWithApplePayPayment = new()
        {
            PaymentInfo = new ApplePayPaymentInfo()
            {
                BillingInfo = new BillingInfo()
                {
                    FullName = "Test FullName",
                    Address = "Test Address",
                    Address2 = "Test Address2",
                    City = "Test City",
                    PostCode = "Test PostCode",
                },
                Amount = amount,
                PaymentType = PaymentType.ApplePay,
                Token = new ApplePayToken()
                {
                    PaymentData = new ApplePayPaymentData(),
                    PaymentMethod = applePayPaymentMethod,
                    TransactionIdentifier = "tx"
                }
            },
            DeviceId = "DeviceId Test",
            LeadPassenger = new LeadPassenger() { Email = "test@test.com", Phone = "123456789", },
            Offer = new Offer()
            {
                Transport = new Transport()
                {
                    Routes = new List<Route>()
                    {
                        new()
                        {
                            DepPt = "DepPt Test", DepDate = DateTime.Now, FltNo = "123", ArrPt = "ArrPt Test",
                        }
                    }
                }
            },
            Guests = new List<PersonWithDetails>()
            {
                new()
                {
                    Index = "1",
                    FirstName = "John",
                    LastName = "Doe",
                    Title = "mr",
                    Age = 18,
                }
            },
            BrowserInfo = new BrowserInfo()
            {
                AcceptHeader = "AcceptHeader",
                ColourDepth = 1,
                JavaEnabled = false,
                JavaScriptEnabled = true,
                Language = "EN",
                ScreenHeight = 1080,
                ScreenWidth = 1920,
                TimeZoneOffset = 10,
                UserAgent = "UserAgent",
            }
        };
        return bookingRequestWithApplePayPayment;
    }

}