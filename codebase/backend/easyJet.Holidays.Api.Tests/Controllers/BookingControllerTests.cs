using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Monitoring;
using easyJet.Holidays.Api.Domain.Monitoring.Analytics;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;
using easyJet.Holidays.Api.Controllers.Booking;
using easyJet.Holidays.Api.Domain.Services.Market;

namespace easyJet.Holidays.Api.Domain.Tests.Controllers
{
    public class BookingControllerTests
    {
        private readonly IFixture _fixture;
        private readonly BookingController _sut;

        private Mock<ITradeAgentAuthenticationService> _mockTradeAgentAuthService;
        private Mock<IIdempotentBookingService> _mockIIdempotentBookingService;
        private Mock<IAuthenticationService> _mockAuthenticationService;
        private Mock<ISettingsService> _settingsServiceMock;
        private Mock<IReferenceDataService> _referenceDataServiceMock;
        private Mock<IMetricsService> _metricsServiceMock;
        private Mock<IOtelAnalyticsService> _otelAnalyticsServiceMock;
        private Mock<IMarketService> _marketServiceMock;
        private IOptions<ApiSettings> _apiSettings;
        private IOptions<HeadersSettings> _headersSettings;

        public BookingControllerTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();

            _fixture.Inject(Options.Create(new HeadersSettings()));
            _fixture.Inject(Options.Create(new AtcomSettings()));
            _fixture.Inject(Options.Create(new ApiSettings()));

            _mockTradeAgentAuthService = new Mock<ITradeAgentAuthenticationService>();
            _mockIIdempotentBookingService = new Mock<IIdempotentBookingService>();
            _mockAuthenticationService = new Mock<IAuthenticationService>();
            _settingsServiceMock = new Mock<ISettingsService>();
            _apiSettings = _fixture.Create<IOptions<ApiSettings>>();
            _headersSettings = _fixture.Create<IOptions<HeadersSettings>>();
            _metricsServiceMock = new Mock<IMetricsService>();
            _otelAnalyticsServiceMock = new Mock<IOtelAnalyticsService>();
            _marketServiceMock = new Mock<IMarketService>();
            _marketServiceMock.Setup(m => m.GetCurrentMarket())
                .Returns(new MarketSettings { Code = "UK" });

            _referenceDataServiceMock = new Mock<IReferenceDataService>();
            
            _sut = new BookingController(
                _fixture.Create<IBookingFetchService>(),
                _fixture.Create<IPostBookingService>(),
                _fixture.Create<IBookingCreditService>(),
                _fixture.Create<IBookingChangeService>(),
                _fixture.Create<IBookingTokenService>(),
                _fixture.Create<IBookingCreateService>(),
                _fixture.Create<IHotelsService>(),
                _mockIIdempotentBookingService.Object,
                _headersSettings,
                _apiSettings,
                _fixture.Create<IPricesService>(),
                _mockAuthenticationService.Object,
                _mockTradeAgentAuthService.Object,
                _settingsServiceMock.Object,
                _referenceDataServiceMock.Object,
                _otelAnalyticsServiceMock.Object,
                _metricsServiceMock.Object,
                _marketServiceMock.Object
            );
        }

        [Fact]
        public async Task CommitBooking_PaymentValidationSkipped_DueToTradeAgentCredentials_CantCommitBookingRegardless()
        {
            // Arrange 
            var request = new BookingRequest() { LeadPassenger = new LeadPassenger() { Email = "lead@pass.enger" } };
            // assuming the request is triggered by a trade agent: trade portal flag is set, agent is logged in -> cookie present
            _mockTradeAgentAuthService.Setup(mock => mock.IsLoggedInAsTradeAgent()).Returns(true);
            // commiting the booking fails after skipped validation, because it lacks information required regardless of trade agent status
            _mockIIdempotentBookingService.Setup(
                mock =>
                mock.CreateBooking(request, It.IsAny<string>())
            ).ThrowsAsync(new ApiException(ApiExceptionCodes.BookingCommitError));
            _mockAuthenticationService.Setup(
                mock =>
                mock.CheckIfAccountIsLocked(It.IsAny<string>(), It.IsAny<bool>())
            ).ReturnsAsync(false);
            
            // to mock a context for the "request"
            _sut.ControllerContext.HttpContext = new DefaultHttpContext();

            // Act
            Func<Task<IActionResult>> action = () => _sut.Commit(request);

            // Assert
            var exc = await Assert.ThrowsAsync<ApiException>(action);
            _mockIIdempotentBookingService.Verify(
                mock => mock.CreateBooking(request, It.IsAny<string>()),
                Times.Once(),
                "this is supposed to be called because the validation for customers gets skipped.");
            exc.Should().NotBeNull("because although initial validation can be skipped, requests may still fail and cause exceptions.");
        }

        [Fact]
        public async Task CommitBookingWithSeaths_WhenSeatMapFlowIsEnabled_ShouldCompleteSuccessfully()
        {
            // Arrange
            var email = "test@test.com";
            var request = new BookingRequest()
            {
                LeadPassenger = new LeadPassenger { Email = email },
                PaymentInfo = new CardPaymentInfo { CardNumber = "test" },
                SeatSelection = new List<SeatMap>
                {
                    new SeatMap
                    {
                        Seats = new List<Seat> { new Seat()}
                    }
                },
                Offer = new Offer
                {
                    Accom = new Accom
                    {
                        Code = "test"
                    }
                }
            };
            var response = new BookingResponse { BookingStatus = "BOOKING" };
            var seatMapSettings = new SeatMapSettings() { EnableSeatMapFlow = true };
            _mockAuthenticationService.Setup(x => x.CheckIfAccountIsLocked(email, true)).ReturnsAsync(false);
            _settingsServiceMock.Setup(x => x.GetSeatMapSettings()).ReturnsAsync(seatMapSettings);
            _mockIIdempotentBookingService.Setup(x => x.CreateBooking(request, It.IsAny<string>())).ReturnsAsync(response);
            // to mock a context for the "request"
            _sut.ControllerContext.HttpContext = new DefaultHttpContext();

            // Act
            var res = await _sut.Commit(request);

            // Assert
            _settingsServiceMock.Verify(x => x.GetSeatMapSettings(), Times.Once);
            _mockIIdempotentBookingService.Verify(x => x.CreateBooking(request, It.IsAny<string>()), Times.Once);
            res.Should().BeOfType<OkObjectResult>();
#pragma warning disable CS8602 // Dereference of a possibly null reference.
            (res as OkObjectResult).Value.Should().Be(response);
#pragma warning restore CS8602 // Dereference of a possibly null reference.
        }

        [Fact]
        public async Task CommitBookingWithSeaths_WhenVouchersAreDisabled_ShouldFail()
        {
            // Arrange
            _apiSettings.Value.Vouchers = new VoucherSettings { IsActive = false };

            var email = "test@test.com";
            var request = new BookingRequest
            {
                LeadPassenger = new LeadPassenger { Email = email },
                PaymentInfo = new CardPaymentInfo { CardNumber = "test", CreditAmount = 362 },
                SeatSelection = new List<SeatMap>
                {
                    new SeatMap
                    {
                        Seats = new List<Seat> { new Seat()}
                    }
                }
            };

            _sut.ControllerContext.HttpContext = new DefaultHttpContext();

            // Act
            var res = await _sut.Commit(request);

            // Assert
            res.Should().BeOfType<BadRequestObjectResult>();
#pragma warning disable CS8602 // Dereference of a possibly null reference.
            (res as BadRequestObjectResult).Value.Should().Be("Credit is disabled");
#pragma warning restore CS8602 // Dereference of a possibly null reference.
        }

        [Fact]
        public async Task CommitingBookingWithSeats_WhenSeatMapFlowIsDisabled_ShouldThrowException()
        {
            // Arrange
            var email = "test@test.com";
            var request = new BookingRequest()
            {
                LeadPassenger = new LeadPassenger { Email = email },
                PaymentInfo = new CardPaymentInfo { CardNumber = "test" },
                SeatSelection = new List<SeatMap>
                {
                    new SeatMap
                    {
                        Seats = new List<Seat> { new Seat()}
                    }
                }
            };
            var seatMapSettings = new SeatMapSettings() { EnableSeatMapFlow = false };
            _mockAuthenticationService.Setup(x => x.CheckIfAccountIsLocked(email, true)).ReturnsAsync(false);
            _settingsServiceMock.Setup(x => x.GetSeatMapSettings()).ReturnsAsync(seatMapSettings);

            // Act
            Func<Task<IActionResult>> action = () => _sut.Commit(request);

            // Assert
            var apiException = await Assert.ThrowsAsync<ApiException>(action);
            _settingsServiceMock.Verify(x => x.GetSeatMapSettings(), Times.Once);
            apiException.Code.Should().Be(ApiExceptionCodes.BookingSeatSelectionDisabled);
            apiException.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task CommitBooking_IdempotencyKey_ReadFromHeader()
        {
            // Arrange
            var email = "test@test.com";
            var request = new BookingRequest()
            {
                LeadPassenger = new LeadPassenger { Email = email },
                PaymentInfo = new CardPaymentInfo { CardNumber = "test" },
                Offer = new Offer
                {
                    Accom = new Accom
                    {
                        Code = "test"
                    }
                }
            };
            var seatMapSettings = new SeatMapSettings() { EnableSeatMapFlow = false };
            _mockAuthenticationService.Setup(x => x.CheckIfAccountIsLocked(email, true)).ReturnsAsync(false);
            _settingsServiceMock.Setup(x => x.GetSeatMapSettings()).ReturnsAsync(seatMapSettings);
            _headersSettings.Value.IdempotencyKey = "IdempotencyKey";

            var controllerRequest = new Mock<HttpRequest>();
            controllerRequest.SetupGet(x => x.Headers).Returns(new HeaderDictionary { { "IdempotencyKey", "Test" } });

            var context = new Mock<HttpContext>();
            context.SetupGet(x => x.Request).Returns(controllerRequest.Object);

            _sut.ControllerContext = new ControllerContext { HttpContext = context.Object };

            // Act
            await _sut.Commit(request);

            // Assert
            _mockIIdempotentBookingService.Verify(x => x.CreateBooking(It.IsAny<BookingRequest>(), "Test"));
        }

        [Fact]
        public async Task CommitBooking_WhenApplePayIsUsed_ShouldSucceed()
        {
            // Arrange
            var email = "test@test.com";
            var request = new BookingRequest()
            {
                LeadPassenger = new LeadPassenger { Email = email },
                PaymentInfo = new ApplePayPaymentInfo
                {
                    Amount = 100,
                    Currency = "GBP",
                    Token = new ApplePayToken(),
                    BillingInfo = new BillingInfo()
                },
                SeatSelection = new List<SeatMap>
                {
                    new SeatMap
                    {
                        Seats = new List<Seat> { new Seat()}
                    }
                },
                Offer = new Offer
                {
                    Accom = new Accom
                    {
                        Code = "test"
                    }
                }
            };
            var bookingServiceResponse = new BookingResponse { BookingStatus = "BOOKING" };
            var seatMapSettings = new SeatMapSettings() { EnableSeatMapFlow = true };
            _mockAuthenticationService.Setup(x => 
                x.CheckIfAccountIsLocked(email, true))
                .ReturnsAsync(false);
            _settingsServiceMock.Setup(x => 
                x.GetSeatMapSettings())
                .ReturnsAsync(seatMapSettings);
            _mockIIdempotentBookingService.Setup(x => 
                x.CreateBooking(request, It.IsAny<string>()))
                .ReturnsAsync(bookingServiceResponse);
            _sut.ControllerContext.HttpContext = new DefaultHttpContext();
            
            // Act
            var response = await _sut.Commit(request);

            // Assert
            response.Should().BeOfType<OkObjectResult>();
        }
        
        [Fact]
        public async Task PayRemainingBalance_WhenVouchersAreDisabled_ShouldFail()
        {
            var request = new PayRemainingBalanceRequest
            {
                PaymentInfo = new CardPaymentInfo
                {
                    CreditAmount = 100
                }
            };

            _apiSettings.Value.Vouchers = new VoucherSettings { IsActive = false };

            var res = await _sut.PayRemainingBalance(request);

            res.Should().BeOfType<BadRequestObjectResult>();
#pragma warning disable CS8602 // Dereference of a possibly null reference.
            (res as BadRequestObjectResult).Value.Should().Be("Credit is disabled");
#pragma warning restore CS8602 // Dereference of a possibly null reference.
        }

        [Fact]
        public async Task PayRemainingBalance_WhenMissingPaymentInfo_ShouldFail()
        {
            var request = new PayRemainingBalanceRequest
            {
                PaymentInfo = null
            };


            var action = () => _sut.PayRemainingBalance(request);

            var exc = await Assert.ThrowsAsync<ApiException>(action);

            exc.Should().NotBeNull();
            exc.Code.Should().Be(ApiExceptionCodes.BookingPaymentInfoError);
        }

        [Fact]
        public async Task PayRemainingBalance_WhenPaymentInfoNotValid_ShouldFail()
        {
            var request = new PayRemainingBalanceRequest
            {
                PaymentInfo = new CardPaymentInfo
                {
                    Amount = 0,
                    CreditAmount = 0,
                    BillingInfo = null,
                    CardNumber = null,
                    Md = null,
                    NameOnCard = null,
                    PaRes = null,
                    ThreeDSServerTransID = null,
                    Currency = null,
                    CVV = null,
                    ExpirationDate = null,
                    IssueNumber = null,
                    IssuerUrl = null,
                }
            };


            var action = () => _sut.PayRemainingBalance(request);

            var exc = await Assert.ThrowsAsync<ApiException>(action);

            exc.Should().NotBeNull();
            exc.Code.Should().Be(ApiExceptionCodes.BookingPaymentInfoError);
        }

        [Fact]
        public async Task PayRemainingBalance_IdempotencyKey_ReadFromHeader()
        {
            var request = new PayRemainingBalanceRequest
            {
                PaymentInfo = new CardPaymentInfo
                {
                    Amount = 100,
                }
            };

            _headersSettings.Value.IdempotencyKey = "IdempotencyKey";

            _mockIIdempotentBookingService
                .Setup(x => x.PayRemainingBalance(It.IsAny<PayRemainingBalanceRequest>(), It.IsAny<string>()))
                .Throws(new PaymentAuthorisationRequiredException(new MakePaymentResponse { Amount = 100 }));

            var controllerRequest = new Mock<HttpRequest>();
            controllerRequest.SetupGet(x => x.Headers).Returns(new HeaderDictionary { { "IdempotencyKey", "Test" } });

            var context = new Mock<HttpContext>();
            context.SetupGet(x => x.Request).Returns(controllerRequest.Object);

            _sut.ControllerContext = new ControllerContext { HttpContext = context.Object };

            await _sut.PayRemainingBalance(request);

            _mockIIdempotentBookingService.Verify(x => x.PayRemainingBalance(It.IsAny<PayRemainingBalanceRequest>(), "Test"));
        }

        [Fact]
        public async Task PayRemainingBalance_PaymentAuthorizationRequiredException_ReturnsMakePaymentResponse()
        {
            var request = new PayRemainingBalanceRequest
            {
                PaymentInfo = new CardPaymentInfo
                {
                    Amount = 100,
                }
            };

            _headersSettings.Value.IdempotencyKey = "IdempotencyKey";

            _mockIIdempotentBookingService
                .Setup(x => x.PayRemainingBalance(It.IsAny<PayRemainingBalanceRequest>(), It.IsAny<string>()))
                .Throws(new PaymentAuthorisationRequiredException(new MakePaymentResponse { Amount = 100 }));

            var controllerRequest = new Mock<HttpRequest>();
            controllerRequest.SetupGet(x => x.Headers).Returns(new HeaderDictionary { { "IdempotencyKey", "Test" } });

            var context = new Mock<HttpContext>();
            context.SetupGet(x => x.Request).Returns(controllerRequest.Object);

            _sut.ControllerContext = new ControllerContext { HttpContext = context.Object };

            var response = await _sut.PayRemainingBalance(request) as ObjectResult;

            response.Should().NotBeNull();
            response!.StatusCode.Should().Be((int)HttpStatusCode.OK);

            var makePaymentResponse = response.Value as MakePaymentResponse;
            makePaymentResponse.Should().NotBeNull();
            makePaymentResponse!.Amount.Should().Be(100);
        }
        
        [Fact]
        public async Task BookingPayRemainingBalance_WhenRequestIsNull_ShouldReturnBadRequestResponse()
        {
            // Arrange
            PayRemainingBalanceRequest? nullRequest = null;

            // Act
            var response = await _sut.PayRemainingBalance(nullRequest);
        
            // Assert
            response.Should().BeOfType<BadRequestObjectResult>();
            var badRequestResult = response as BadRequestObjectResult;
            badRequestResult?.Value.Should().Be("Request body cannot be null");
        }
        
        [Fact]
        public async Task PayRemainingBalance_WhenApplePayOnPayBalanceIsUsed_ShouldSucceed()
        {
            // Arrange
            var email = "test@test.com";
            var request = new PayRemainingBalanceRequest()
            {
                PaymentInfo = new ApplePayPaymentInfo
                {
                    Amount = 100,
                    Currency = "GBP",
                    Token = new ApplePayToken(),
                    BillingInfo = new BillingInfo()
                }
            };
            var seatMapSettings = new SeatMapSettings() { EnableSeatMapFlow = true };
            _mockAuthenticationService.Setup(x => 
                x.CheckIfAccountIsLocked(email, true))
                .ReturnsAsync(false);
            _settingsServiceMock.Setup(x => 
                x.GetSeatMapSettings())
                .ReturnsAsync(seatMapSettings);
            _sut.ControllerContext.HttpContext = new DefaultHttpContext();
            
            // Act
            var response = await _sut.PayRemainingBalance(request);

            // Assert
            response.Should().BeOfType<OkObjectResult>();
        }
        
        [Fact]
        public async Task DisplayPost_ValidRequest_ReturnsOkWithBooking()
        {
            // Arrange
            _apiSettings.Value.Vouchers = new VoucherSettings();

            var request = new GetBookingRequest
            {
                BookingReference = "REF123",
                LastName = "Smith",
                Date = new DateTime(2025, 5, 19)
            };

            var bookingResponse = new BookingResponse { BookingStatus = "BOOKING" };
            var mockBookingService = _fixture.Create<IBookingFetchService>();
            Mock.Get(mockBookingService)
                .Setup(x => x.Get(It.IsAny<GetBookingRequest>()))
                .ReturnsAsync(bookingResponse);

            var sut = new BookingController(
                mockBookingService,
                _fixture.Create<IPostBookingService>(),
                _fixture.Create<IBookingCreditService>(),
                _fixture.Create<IBookingChangeService>(),
                _fixture.Create<IBookingTokenService>(),
                _fixture.Create<IBookingCreateService>(),
                _fixture.Create<IHotelsService>(),
                _mockIIdempotentBookingService.Object,
                _headersSettings,
                _apiSettings,
                _fixture.Create<IPricesService>(),
                _mockAuthenticationService.Object,
                _mockTradeAgentAuthService.Object,
                _settingsServiceMock.Object,
                _referenceDataServiceMock.Object,
                _otelAnalyticsServiceMock.Object,
                _metricsServiceMock.Object,
                _marketServiceMock.Object
            );

            // Act
            var result = await sut.DisplayPost(request);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var okResult = result as OkObjectResult;
            okResult!.Value.Should().BeOfType<BookingResponse>();
        }

        [Fact]
        public async Task ConfirmationPost_ValidRequest_ReturnsPdfFile()
        {
            // Arrange
            var request = new GetBookingRequest
            {
                BookingReference = "REF123",
                LastName = "Smith",
                Date = new DateTime(2025, 5, 19)
            };

            var mockPostBookingService = _fixture.Create<IPostBookingService>();
            Mock.Get(mockPostBookingService)
                .Setup(x => x.Confirmation(It.IsAny<GetBookingRequest>()))
                .ReturnsAsync(new System.IO.MemoryStream(new byte[] { 1, 2, 3 }));

            var sut = new BookingController(
                _fixture.Create<IBookingFetchService>(),
                mockPostBookingService,
                _fixture.Create<IBookingCreditService>(),
                _fixture.Create<IBookingChangeService>(),
                _fixture.Create<IBookingTokenService>(),
                _fixture.Create<IBookingCreateService>(),
                _fixture.Create<IHotelsService>(),
                _mockIIdempotentBookingService.Object,
                _headersSettings,
                _apiSettings,
                _fixture.Create<IPricesService>(),
                _mockAuthenticationService.Object,
                _mockTradeAgentAuthService.Object,
                _settingsServiceMock.Object,
                _referenceDataServiceMock.Object,
                _otelAnalyticsServiceMock.Object,
                _metricsServiceMock.Object,
                _marketServiceMock.Object
            );

            // Act
            var result = await sut.ConfirmationPost(request);

            // Assert
            result.Should().BeOfType<FileStreamResult>();
            var fileResult = result as FileStreamResult;
            fileResult!.ContentType.Should().Be("application/pdf");
        }

        [Fact]
        public void Constructor_WithNullMarketService_ShouldThrowArgumentNullException()
        {
            // Arrange & Act
            Action action = () => new BookingController(
                _fixture.Create<IBookingFetchService>(),
                _fixture.Create<IPostBookingService>(),
                _fixture.Create<IBookingCreditService>(),
                _fixture.Create<IBookingChangeService>(),
                _fixture.Create<IBookingTokenService>(),
                _fixture.Create<IBookingCreateService>(),
                _fixture.Create<IHotelsService>(),
                _mockIIdempotentBookingService.Object,
                _headersSettings,
                _apiSettings,
                _fixture.Create<IPricesService>(),
                _mockAuthenticationService.Object,
                _mockTradeAgentAuthService.Object,
                _settingsServiceMock.Object,
                _referenceDataServiceMock.Object,
                _otelAnalyticsServiceMock.Object,
                _metricsServiceMock.Object,
                null); // Pass null for marketService
            
            // Assert
            action.Should().Throw<ArgumentNullException>()
                .WithParameterName("marketService");
        }
    }
}
