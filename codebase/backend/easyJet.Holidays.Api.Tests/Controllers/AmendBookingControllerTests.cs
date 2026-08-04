using AutoFixture;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Monitoring;
using easyJet.Holidays.Api.Domain.Monitoring.Analytics;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;

namespace easyJet.Holidays.Api.Domain.Tests.Controllers;

public class AmendBookingControllerTests
{
    private readonly AmendBookingController _sut;
    private readonly Mock<IAmendLuggageService> _mockAmendLuggageService;
    private readonly Mock<ITradeAgentAuthenticationService> _mockTradeAgentCookieService;
    private readonly IOptions<HeadersSettings> _headersSettings;
    private readonly Mock<IMetricsService> _mockMetricsService;
    private readonly Mock<IOtelAnalyticsService> _mockOtelAnalyticsService;
    private readonly Mock<IMarketService> _mockMarketService;


    public AmendBookingControllerTests()
    {
        var fixture = FixtureUtils.AutoMoqFixture();

        fixture.Inject(Options.Create(new HeadersSettings()));
        fixture.Inject(Options.Create(new AtcomSettings()));
        fixture.Inject(Options.Create(new ApiSettings()));

        var mockIdempotentBookingService = new Mock<IIdempotentBookingService>();
        var mockAmendBookingFlightsService = new Mock<IAmendBookingFlightsService>();
        var mockAmendBookingTransferService = new Mock<IAmendBookingTransfersService>();
        var mockAmendBookingRefundService = new Mock<IAmendBookingRefundService>();
        var mockAmendBookingPassengerService = new Mock<IAmendPassengerService>();
        var mockBookingChangeService = new Mock<IBookingChangeService>();
        var mockAmendSeatsService = new Mock<IAmendSeatsService>();
        _mockTradeAgentCookieService = new Mock<ITradeAgentAuthenticationService>();
        var mockAmendDatesService = new Mock<IAmendDatesService>();
        _mockAmendLuggageService = new Mock<IAmendLuggageService>();
        var mockAmendBookingRoomAndBoardService = new Mock<IAmendBookingRoomAndBoardService>();
        var mockAmendHotelService = new Mock<IAmendHotelService>();
        _mockMetricsService = new Mock<IMetricsService>();
        _mockOtelAnalyticsService = new Mock<IOtelAnalyticsService>();
        _mockMarketService = new Mock<IMarketService>();
        _headersSettings = fixture.Create<IOptions<HeadersSettings>>();

        _sut = new AmendBookingController(
            fixture.Create<IOptions<ApiSettings>>(),
            _headersSettings,
            mockIdempotentBookingService.Object,
            mockAmendBookingFlightsService.Object,
            mockAmendBookingTransferService.Object,
            mockAmendBookingRefundService.Object,
            mockAmendBookingPassengerService.Object,
            mockBookingChangeService.Object,
            mockAmendSeatsService.Object,
            _mockTradeAgentCookieService.Object,
            mockAmendDatesService.Object,
            _mockAmendLuggageService.Object,
            mockAmendBookingRoomAndBoardService.Object,
            mockAmendHotelService.Object,
            _mockMetricsService.Object,
            _mockOtelAnalyticsService.Object,
            _mockMarketService.Object
        );
    }

    [Fact]
    public async Task AmendLuggage_WhenServiceReturnsResponse_ShouldReturnSuccessResponse()
    {
        // Arrange
        _mockAmendLuggageService
            .Setup(x => x.ChangeExtraLuggage(It.IsAny<AmendLuggageRequest>()))
            .ReturnsAsync(new AmendLuggageResponse()
            {
                AmendmentCharges = 1,
                ExtraLuggageInfo = new ExtraLuggageInfo()
            });

        // Act
        var response = await _sut.AmendLuggage(new AmendLuggageRequest());

        // Assert
        response.Should().BeOfType<OkObjectResult>();

        var actual = (OkObjectResult)response;

        actual.StatusCode.Should().Be(200);
        actual.Value.Should().BeEquivalentTo(new AmendLuggageResponse
        {
            AmendmentCharges = 1,
            ExtraLuggageInfo = new ExtraLuggageInfo()
        });
    }

    [Fact]
    public async Task AmendBookingCommit_WhenRequestIsNull_ShouldReturnBadRequestResponse()
    {
        // Arrange
        AmendBookingRequest? nullRequest = null;

        // Act
        var response = await _sut.AmendBooking(nullRequest);
        
        // Assert
        response.Should().BeOfType<BadRequestObjectResult>();
        var badRequestResult = response as BadRequestObjectResult;
        badRequestResult?.Value.Should().Be("Request body cannot be null");
    }
    
    [Fact]
    public async Task AmendBooking_WhenApplePayIsUsed_ShouldSucceed()
    {
        // Arrange
        PaymentInfo paymentInfo = new ApplePayPaymentInfo();
        paymentInfo.CreditAmount = 0;
        
        var request = new AmendBookingRequest()
        {
            PaymentInfo = paymentInfo
        };
          
        _mockTradeAgentCookieService.Setup(mock => 
            mock.IsLoggedInAsTradeAgent()
            ).Returns(false);
        
        _headersSettings.Value.IdempotencyKey = "IdempotencyKey";

        var controllerRequest = new Mock<HttpRequest>();
        controllerRequest
            .SetupGet(x => x.Headers)
            .Returns(new HeaderDictionary { { "IdempotencyKey", "Test" } });

        var context = new Mock<HttpContext>();
        context.SetupGet(x => x.Request).Returns(controllerRequest.Object);

        _sut.ControllerContext = new ControllerContext { HttpContext = context.Object };

        // Act
        var response = await _sut.AmendBooking(request);

        // Assert
        response.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task AmendBooking_OnSuccess_RecordsMetricAndAnalyticsEvent()
    {
        // Arrange
        PaymentInfo paymentInfo = new ApplePayPaymentInfo();
        paymentInfo.CreditAmount = 0;

        var request = new AmendBookingRequest
        {
            PaymentInfo = paymentInfo,
            Transport = new easyJet.Holidays.Api.Domain.Data.PackageOffers.Transport()
        };

        _mockTradeAgentCookieService.Setup(mock => mock.IsLoggedInAsTradeAgent()).Returns(false);
        _headersSettings.Value.IdempotencyKey = "IdempotencyKey";

        var controllerRequest = new Mock<HttpRequest>();
        controllerRequest
            .SetupGet(x => x.Headers)
            .Returns(new HeaderDictionary { { "IdempotencyKey", "Test" } });

        var context = new Mock<HttpContext>();
        context.SetupGet(x => x.Request).Returns(controllerRequest.Object);

        _sut.ControllerContext = new ControllerContext { HttpContext = context.Object };

        // Act
        await _sut.AmendBooking(request);

        // Assert
        _mockMetricsService.Verify(
            m => m.IncrementCounter(MetricConstants.WebAmendBookingTotal, 1, It.IsAny<KeyValuePair<string, object>[]>()),
            Times.Once);
        _mockOtelAnalyticsService.Verify(
            m => m.TrackAmendBookingAsync(request, It.IsAny<BookingResponse>(), "flight"),
            Times.Once);
    }
}
