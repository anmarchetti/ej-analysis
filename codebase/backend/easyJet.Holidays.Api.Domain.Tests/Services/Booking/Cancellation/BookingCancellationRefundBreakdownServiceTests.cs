using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.BreakdownStrategies;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation;

public class BookingCancellationRefundBreakdownServiceTests
{
    private readonly BookingCancellationRefundBreakdownService _sut;
    private readonly Mock<IRefundBreakdownStrategy> _refundBreakdownStrategyMock = new Mock<IRefundBreakdownStrategy>();

    public BookingCancellationRefundBreakdownServiceTests()
    {
        _sut = new BookingCancellationRefundBreakdownService(
            new List<IRefundBreakdownStrategy>() { _refundBreakdownStrategyMock.Object });
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_WhenDefinedStrategyForProvidedReason_ShouldReturnResult()
    {
        // Arrange
        var request = new BookingResponse();
        var reason = BookingCancellationReason.CustomerLed;
        var response =
            new BookingCancellationRefundBreakdown() { OriginalBookingValue = 0 };
        var cancellationToken = new CancellationToken();
        _refundBreakdownStrategyMock
            .Setup(x => x.ShouldRefund(reason, It.IsAny<List<string>>()))
            .Returns(true);
        _refundBreakdownStrategyMock
            .Setup(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken))
            .ReturnsAsync(response);


        // Act
        var result = await _sut.GetBookingCancellationRefundBreakdown(request, reason, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(response);
        _refundBreakdownStrategyMock.Verify(x => x.ShouldRefund(reason, It.IsAny<List<string>>()), Times.Once);
        _refundBreakdownStrategyMock.Verify(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken),
            Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_WhenNotDefinedStrategyForProvidedReason_ShouldReturnException()
    {
        // Arrange
        var request = new BookingResponse();
        var reason = BookingCancellationReason.CustomerLed;
        var response =
            new BookingCancellationRefundBreakdown() { OriginalBookingValue = 0 };
        var cancellationToken = new CancellationToken();
        _refundBreakdownStrategyMock
            .Setup(x => x.ShouldRefund(reason, It.IsAny<List<string>>()))
            .Returns(false);
        _refundBreakdownStrategyMock
            .Setup(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken))
            .ReturnsAsync(response);


        // Act
        var f = async () =>
            await _sut.GetBookingCancellationRefundBreakdown(request, reason, null, cancellationToken);

        // Assert
        await f.Should().ThrowAsync<NotImplementedException>();
        _refundBreakdownStrategyMock.Verify(x => x.ShouldRefund(reason, It.IsAny<List<string>>()), Times.Once);
        _refundBreakdownStrategyMock.Verify(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken),
            Times.Never);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_WhenRefundIsNegative_ShouldReturnException()
    {
        // Arrange
        var request = new BookingResponse();
        var reason = BookingCancellationReason.CustomerLed;
        var response = new BookingCancellationRefundBreakdown()
        {
            TotalRefundAmount = -1, OriginalBookingValue = 0
        };
        var cancellationToken = new CancellationToken();
        _refundBreakdownStrategyMock
            .Setup(x => x.ShouldRefund(reason, It.IsAny<List<string>>()))
            .Returns(true);
        _refundBreakdownStrategyMock
            .Setup(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken))
            .ReturnsAsync(response);

        // Act
        var f = async () =>
            await _sut.GetBookingCancellationRefundBreakdown(request, reason, null, cancellationToken);

        // Assert
        await f.Should().ThrowAsync<ApiException>();
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_WhenMultipleStrategiesEligible_ShouldSelectHighestPriority()
    {
        // Arrange
        var request = new BookingResponse();
        var reason = BookingCancellationReason.CustomerLed;
        var cancellationToken = new CancellationToken();
        var highPriorityResponse =
            new BookingCancellationRefundBreakdown() { OriginalBookingValue = 100 };
        var lowPriorityResponse =
            new BookingCancellationRefundBreakdown() { OriginalBookingValue = 50 };

        var lowPriorityMock = new Mock<IRefundBreakdownStrategy>();
        lowPriorityMock.SetupGet(x => x.Priority).Returns(1);
        lowPriorityMock.Setup(x => x.ShouldRefund(reason, It.IsAny<List<string>>())).Returns(true);
        lowPriorityMock
            .Setup(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken))
            .ReturnsAsync(lowPriorityResponse);

        var highPriorityMock = new Mock<IRefundBreakdownStrategy>();
        highPriorityMock.SetupGet(x => x.Priority).Returns(2);
        highPriorityMock.Setup(x => x.ShouldRefund(reason, It.IsAny<List<string>>())).Returns(true);
        highPriorityMock
            .Setup(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken))
            .ReturnsAsync(highPriorityResponse);

        var testee = new BookingCancellationRefundBreakdownService(
            new List<IRefundBreakdownStrategy>() { lowPriorityMock.Object, highPriorityMock.Object });

        // Act
        var result = await testee.GetBookingCancellationRefundBreakdown(request, reason, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(highPriorityResponse);
        highPriorityMock.Verify(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken), Times.Once);
        lowPriorityMock.Verify(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken), Times.Never);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_WhenHigherPriorityStrategyDoesNotMatch_ShouldFallbackToLowerPriority()
    {
        // Arrange
        var request = new BookingResponse();
        var reason = BookingCancellationReason.CustomerLed;
        var cancellationToken = new CancellationToken();
        var lowPriorityResponse =
            new BookingCancellationRefundBreakdown() { OriginalBookingValue = 50 };

        var lowPriorityMock = new Mock<IRefundBreakdownStrategy>();
        lowPriorityMock.SetupGet(x => x.Priority).Returns(1);
        lowPriorityMock.Setup(x => x.ShouldRefund(reason, It.IsAny<List<string>>())).Returns(true);
        lowPriorityMock
            .Setup(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken))
            .ReturnsAsync(lowPriorityResponse);

        var highPriorityMock = new Mock<IRefundBreakdownStrategy>();
        highPriorityMock.SetupGet(x => x.Priority).Returns(2);
        highPriorityMock.Setup(x => x.ShouldRefund(reason, It.IsAny<List<string>>())).Returns(false);

        var testee = new BookingCancellationRefundBreakdownService(
            new List<IRefundBreakdownStrategy>() { lowPriorityMock.Object, highPriorityMock.Object });

        // Act
        var result = await testee.GetBookingCancellationRefundBreakdown(request, reason, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(lowPriorityResponse);
        highPriorityMock.Verify(x => x.ShouldRefund(reason, It.IsAny<List<string>>()), Times.Once);
        highPriorityMock.Verify(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken), Times.Never);
        lowPriorityMock.Verify(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_WhenPromotionCollectionsProvided_ShouldPassPromotionCollections()
    {
        // Arrange
        var expectedPromotionNames = new List<string> { "fah", "lux" };
        var request = new BookingResponse() { PromotionCollections = expectedPromotionNames };
        var reason = BookingCancellationReason.CustomerLed;
        var response =
            new BookingCancellationRefundBreakdown() { OriginalBookingValue = 0 };
        var cancellationToken = new CancellationToken();
        _refundBreakdownStrategyMock
            .Setup(x => x.ShouldRefund(reason, It.Is<List<string>>(p => p.SequenceEqual(expectedPromotionNames))))
            .Returns(true);
        _refundBreakdownStrategyMock
            .Setup(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken))
            .ReturnsAsync(response);

        // Act
        var result = await _sut.GetBookingCancellationRefundBreakdown(request, reason, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(response);
        _refundBreakdownStrategyMock.Verify(
            x => x.ShouldRefund(reason, It.Is<List<string>>(p => p.SequenceEqual(expectedPromotionNames))),
            Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_WhenPromotionCollectionsIsNull_ShouldPassEmptyPromotionNames()
    {
        // Arrange
        var request = new BookingResponse();
        var reason = BookingCancellationReason.CustomerLed;
        var response =
            new BookingCancellationRefundBreakdown() { OriginalBookingValue = 0 };
        var cancellationToken = new CancellationToken();
        _refundBreakdownStrategyMock
            .Setup(x => x.ShouldRefund(reason, It.Is<List<string>>(p => !p.Any())))
            .Returns(true);
        _refundBreakdownStrategyMock
            .Setup(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken))
            .ReturnsAsync(response);

        // Act
        var result = await _sut.GetBookingCancellationRefundBreakdown(request, reason, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(response);
        _refundBreakdownStrategyMock.Verify(x => x.ShouldRefund(reason, It.Is<List<string>>(p => !p.Any())), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_WithAllStrategiesRegistered_WhenCustomerLedAndFlightAndHotelPromotionCollection_ShouldSelectFlightAndHotelStrategy()
    {
        // Arrange
        var request = new BookingResponse() { PromotionCollections = new List<string> { "fah" } };
        var reason = BookingCancellationReason.CustomerLed;
        var cancellationToken = new CancellationToken();

        var mocks = BuildAllStrategyMocks(request, cancellationToken);
        var testee = new BookingCancellationRefundBreakdownService(mocks.AsList());

        // Act
        var result = await testee.GetBookingCancellationRefundBreakdown(request, reason, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(mocks.CustomerLedFlightAndHotelResponse);
        mocks.CustomerLedFlightAndHotel.Verify(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken), Times.Once);
        mocks.CustomerLed.Verify(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken), Times.Never);
        mocks.TradeLed.Verify(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken), Times.Never);
        mocks.EasyJetLed.Verify(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken), Times.Never);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("OTHER")]
    public async Task GetCancellationRefundBreakdown_WithAllStrategiesRegistered_WhenCustomerLedWithoutFlightAndHotelPromotionCollection_ShouldSelectStandardCustomerLedStrategy(string promotionCollection)
    {
        // Arrange
        var request = new BookingResponse();
        if (promotionCollection != null)
        {
            request.PromotionCollections = new List<string> { promotionCollection };
        }

        var reason = BookingCancellationReason.CustomerLed;
        var cancellationToken = new CancellationToken();

        var mocks = BuildAllStrategyMocks(request, cancellationToken);
        var testee = new BookingCancellationRefundBreakdownService(mocks.AsList());

        // Act
        var result = await testee.GetBookingCancellationRefundBreakdown(request, reason, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(mocks.CustomerLedResponse);
        mocks.CustomerLed.Verify(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken), Times.Once);
        mocks.CustomerLedFlightAndHotel.Verify(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken), Times.Never);
        mocks.TradeLed.Verify(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken), Times.Never);
        mocks.EasyJetLed.Verify(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken), Times.Never);
    }

    [Theory]
    [InlineData(BookingCancellationReason.TradeLed)]
    [InlineData(BookingCancellationReason.EasyJetLed)]
    public async Task GetCancellationRefundBreakdown_WithAllStrategiesRegistered_WhenNonCustomerLedReason_ShouldSelectMatchingReasonStrategy(BookingCancellationReason reason)
    {
        // Arrange
        var request = new BookingResponse() { PromotionCollections = new List<string> { "fah" } };
        var cancellationToken = new CancellationToken();

        var mocks = BuildAllStrategyMocks(request, cancellationToken);
        var testee = new BookingCancellationRefundBreakdownService(mocks.AsList());

        // Act
        var result = await testee.GetBookingCancellationRefundBreakdown(request, reason, null, cancellationToken);

        // Assert
        var expectedStrategy = reason == BookingCancellationReason.TradeLed ? mocks.TradeLed : mocks.EasyJetLed;
        var expectedResponse = reason == BookingCancellationReason.TradeLed ? mocks.TradeLedResponse : mocks.EasyJetLedResponse;

        result.Should().BeEquivalentTo(expectedResponse);
        expectedStrategy.Verify(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken), Times.Once);
        mocks.CustomerLed.Verify(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken), Times.Never);
        mocks.CustomerLedFlightAndHotel.Verify(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken), Times.Never);
    }

    private static AllStrategyMocks BuildAllStrategyMocks(BookingResponse request, CancellationToken cancellationToken)
    {
        var mocks = new AllStrategyMocks
        {
            CustomerLed = CreateStrategyMock(
                BookingCancellationReason.CustomerLed,
                priority: 1,
                shouldRefund: (r, _) => r == BookingCancellationReason.CustomerLed),
            CustomerLedFlightAndHotel = CreateStrategyMock(
                BookingCancellationReason.CustomerLed,
                priority: 2,
                shouldRefund: (r, promotionNames) =>
                    r == BookingCancellationReason.CustomerLed
                    && promotionNames.Contains("fah", StringComparer.OrdinalIgnoreCase)),
            TradeLed = CreateStrategyMock(
                BookingCancellationReason.TradeLed,
                priority: 1,
                shouldRefund: (r, _) => r == BookingCancellationReason.TradeLed),
            EasyJetLed = CreateStrategyMock(
                BookingCancellationReason.EasyJetLed,
                priority: 1,
                shouldRefund: (r, _) => r == BookingCancellationReason.EasyJetLed),
            CustomerLedResponse = new BookingCancellationRefundBreakdown { OriginalBookingValue = 1 },
            CustomerLedFlightAndHotelResponse = new BookingCancellationRefundBreakdown { OriginalBookingValue = 2 },
            TradeLedResponse = new BookingCancellationRefundBreakdown { OriginalBookingValue = 3 },
            EasyJetLedResponse = new BookingCancellationRefundBreakdown { OriginalBookingValue = 4 }
        };

        mocks.CustomerLed.Setup(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken)).ReturnsAsync(mocks.CustomerLedResponse);
        mocks.CustomerLedFlightAndHotel.Setup(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken)).ReturnsAsync(mocks.CustomerLedFlightAndHotelResponse);
        mocks.TradeLed.Setup(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken)).ReturnsAsync(mocks.TradeLedResponse);
        mocks.EasyJetLed.Setup(x => x.GetCancellationRefundBreakdown(request, null, cancellationToken)).ReturnsAsync(mocks.EasyJetLedResponse);

        return mocks;
    }

    private static Mock<IRefundBreakdownStrategy> CreateStrategyMock(
        BookingCancellationReason supportedReason,
        ushort priority,
        Func<BookingCancellationReason, List<string>, bool> shouldRefund)
    {
        var mock = new Mock<IRefundBreakdownStrategy>();
        mock.SetupGet(x => x.BookingCancellationReason).Returns(supportedReason);
        mock.SetupGet(x => x.Priority).Returns(priority);
        mock.Setup(x => x.ShouldRefund(It.IsAny<BookingCancellationReason>(), It.IsAny<List<string>>()))
            .Returns(shouldRefund);
        return mock;
    }

    private sealed class AllStrategyMocks
    {
        public Mock<IRefundBreakdownStrategy> CustomerLed { get; set; }
        public Mock<IRefundBreakdownStrategy> CustomerLedFlightAndHotel { get; set; }
        public Mock<IRefundBreakdownStrategy> TradeLed { get; set; }
        public Mock<IRefundBreakdownStrategy> EasyJetLed { get; set; }
        public BookingCancellationRefundBreakdown CustomerLedResponse { get; set; }
        public BookingCancellationRefundBreakdown CustomerLedFlightAndHotelResponse { get; set; }
        public BookingCancellationRefundBreakdown TradeLedResponse { get; set; }
        public BookingCancellationRefundBreakdown EasyJetLedResponse { get; set; }

        public List<IRefundBreakdownStrategy> AsList() =>
            new List<IRefundBreakdownStrategy>
            {
                CustomerLed.Object,
                CustomerLedFlightAndHotel.Object,
                TradeLed.Object,
                EasyJetLed.Object
            };
    }
}