#nullable enable
using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Monitoring;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.Memos;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation.Memos;

public class BookingCancellationMemoServiceTests
{
    private readonly Mock<IBookingRepository> _mockBookingRepository;
    private readonly Mock<IBookingCancellationRepCodeService> _mockRepCodeService;
    private readonly Mock<IBookingBlockCheckerService> _mockBookingBlockChecker;
    private readonly Mock<IMetricsService> _mockMetricsService;
    private readonly Mock<ILogger<BookingCancellationMemoService>> _mockLogger;
    private readonly BookingCancellationMemoService _service;

    public BookingCancellationMemoServiceTests()
    {
        _mockBookingRepository = new Mock<IBookingRepository>();
        _mockRepCodeService = new Mock<IBookingCancellationRepCodeService>();
        _mockLogger = new Mock<ILogger<BookingCancellationMemoService>>();
        _mockBookingBlockChecker = new Mock<IBookingBlockCheckerService>();
        _mockMetricsService = new Mock<IMetricsService>();
        var fixture = FixtureUtils.AutoMoqFixture();
        fixture.Inject(Options.Create(new ApiSettings
        {
            BookingsMemos = new BookingsMemosSettings
            {
                Cash = new MemoSettings
                {
                    Code = "RF",
                    Description = "Cash refunded"
                },
                RetainedOtuc = new MemoSettings
                {
                    Code = "OTCR",
                    Description = "One time credit retained with the value of the credit retained"
                },
                IssuedOtuc = new MemoSettings
                {
                    Code = "OTCI",
                    Description = "One time credit Issued with the value of the credit issue"
                },
                FailedCancellation = new MemoSettings
                {
                    Code = "FC",
                    Description = "Amount of cancellation failures:"
                }
            }
        }));
        
        _service = new BookingCancellationMemoService(
            _mockBookingRepository.Object,
            _mockRepCodeService.Object,
                fixture.Create<IOptions<ApiSettings>>(),
            _mockBookingBlockChecker.Object,
            _mockLogger.Object,
            _mockMetricsService.Object);
    }

    [Fact]
    public async Task AddMemosToBooking_ShouldAddMemoWithCorrectRepCode()
    {
        // Arrange
        var bookingResponse = new BookingResponse { BookingReference = "BR123" };
        var bookingCancellationReason = BookingCancellationReason.CustomerLed;
        double daysToDeparture = 61;
        var creditRefundAmount = 250m;
        var cashRefundAmount = 750m;
        var repCode = "REP5";

        _mockRepCodeService
            .Setup(s => s.GetRepCode(bookingCancellationReason, daysToDeparture, creditRefundAmount, cashRefundAmount, It.IsAny<bool>()))
            .Returns(repCode);

        // Act
        await _service.AddMemosToBooking(bookingResponse, bookingCancellationReason, daysToDeparture,
            creditRefundAmount, cashRefundAmount, null, null, null, "Web", null, null);

        // Assert
        _mockBookingRepository.Verify(r => r.ModifyMemo(bookingResponse.BookingReference,
                It.Is<BookingMemo>(m => m.Code == repCode && m.Description == "Refund £750 cash, £250 credit")),
            Times.Once);
    }

    [Fact]
    public async Task AddMemosToBooking_ShouldLogDebugMessage()
    {
        // Arrange
        var bookingResponse = new BookingResponse { BookingReference = "BR123" };
        var bookingCancellationReason = BookingCancellationReason.CustomerLed;
        double daysToDeparture = 61;
        var creditRefundAmount = 250m;
        var cashRefundAmount = 750m;

        // Act
        await _service.AddMemosToBooking(bookingResponse, bookingCancellationReason, daysToDeparture,
            creditRefundAmount, cashRefundAmount, null, null, null, "Web", null, null);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Applying rep code strategies with parameters")),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception, string>>((v, t) => true)!),
            Times.Once);
    }

    [Theory]
    [InlineData(CancellationReason.CustomerCancellation, null,"CC", "Customer cancellation")]
    [InlineData(CancellationReason.Bereavement, null, "CB", "Customer Bereavement")]
    [InlineData(CancellationReason.SignificantChangeDisruption, null, "CFD", "Significant Change (Disruption)")]
    [InlineData(CancellationReason.SignificantChangeOverbooking, null, "CHD", "Significant Change (Overbooking)")]
    [InlineData(CancellationReason.Illness, null, "CI", "Customer Illness")]
    [InlineData(CancellationReason.Fraud, null, "RPT", "deny RPT")]
    [InlineData(CancellationReason.NonPayment, null, "CNP", "Non Payment")]
    [InlineData(CancellationReason.TestBooking, null, "TB", "Test booking")]
    [InlineData(CancellationReason.CustomerCancellation, "Test note","CC", "Test note")]
    [InlineData(CancellationReason.Bereavement, "Test note", "CB", "Test note")]
    [InlineData(CancellationReason.SignificantChangeDisruption, "Test note", "CFD", "Test note")]
    [InlineData(CancellationReason.SignificantChangeOverbooking, "Test note", "CHD", "Test note")]
    [InlineData(CancellationReason.Illness, "Test note", "CI", "Test note")]
    [InlineData(CancellationReason.Fraud, "Test note", "RPT", "Test note")]
    [InlineData(CancellationReason.NonPayment, "Test note", "CNP", "Test note")]
    [InlineData(CancellationReason.TestBooking, "Test note", "TB", "Test note")]
    [InlineData(null, "Test note", "BC", "Test note")]
    [InlineData(null, null, "BS", "Web")]
    public async Task AddMemosToBooking_ShouldAddMemoWithCorrectCancellationReason(CancellationReason? reason, 
        string? note, string expectedCode, string expectedDescription)
    {
        var bookingResponse = new BookingResponse { BookingReference = "BR123" };
        var bookingCancellationReason = BookingCancellationReason.CustomerLed;
        double daysToDeparture = 61;
        var creditRefundAmount = 250m;
        var cashRefundAmount = 750m;
        var repCode = "REP5";

        _mockRepCodeService
            .Setup(s => s.GetRepCode(bookingCancellationReason, daysToDeparture, creditRefundAmount, cashRefundAmount, It.IsAny<bool>()))
            .Returns(repCode);

        await _service.AddMemosToBooking(bookingResponse, bookingCancellationReason, daysToDeparture,
            creditRefundAmount, cashRefundAmount, reason, note, null, "Web", null, null);

        _mockBookingRepository.Verify(r => r.ModifyMemo(bookingResponse.BookingReference,
            It.Is<BookingMemo>(m => m.Code == expectedCode && m.Description == expectedDescription)), Times.Once);
    }
    
    [Theory]
    [InlineData("Agent1", "Agent1")]
    [InlineData("Agent 1", "Agent 1")]
    [InlineData("Agent 2", "Agent 2")]
    public async Task AddMemosToBooking_ShouldAddMemoWithCorrectAgentName(string agentName, string expectedDescription)
    {
        var bookingResponse = new BookingResponse { BookingReference = "BR123" };
        var bookingCancellationReason = BookingCancellationReason.CustomerLed;
        double daysToDeparture = 61;
        var creditRefundAmount = 250m;
        var cashRefundAmount = 750m;
        var repCode = "REP5";

        _mockRepCodeService
            .Setup(s => s.GetRepCode(bookingCancellationReason, daysToDeparture, creditRefundAmount, cashRefundAmount, It.IsAny<bool>()))
            .Returns(repCode);

        await _service.AddMemosToBooking(bookingResponse, bookingCancellationReason, daysToDeparture,
            creditRefundAmount, cashRefundAmount, null, null, agentName, "Web", null, null);

        _mockBookingRepository.Verify(r => r.ModifyMemo(bookingResponse.BookingReference,
            It.Is<BookingMemo>(m => m.Code == "CA" && m.Description == expectedDescription)), Times.Once);
    }

    [Theory]
    [InlineData("Web", "Web")]
    [InlineData("Bulk tool", "Bulk tool")]
    public async Task AddMemosToBooking_ShouldAddMemoWithCorrectSource(string source, string expectedDescription)
    {
        var bookingResponse = new BookingResponse { BookingReference = "BR123" };
        var bookingCancellationReason = BookingCancellationReason.CustomerLed;
        double daysToDeparture = 61;
        var creditRefundAmount = 250m;
        var cashRefundAmount = 750m;
        var repCode = "REP5";

        _mockRepCodeService
            .Setup(s => s.GetRepCode(bookingCancellationReason, daysToDeparture, creditRefundAmount, cashRefundAmount, It.IsAny<bool>()))
            .Returns(repCode);

        await _service.AddMemosToBooking(bookingResponse, bookingCancellationReason, daysToDeparture,
            creditRefundAmount, cashRefundAmount, null, null, null, source, null, null);

        _mockBookingRepository.Verify(r => r.ModifyMemo(bookingResponse.BookingReference,
            It.Is<BookingMemo>(m => m.Code == "BS" && m.Description == expectedDescription)), Times.Once);
    }
    
    [Fact]
    public async Task AddMemosToBooking_ShouldLogErrorMessage_WhenExceptionOccursDuringGettingRepCodes()
    {
        // Arrange
        var bookingResponse = new BookingResponse { BookingReference = "BR123" };
        var bookingCancellationReason = BookingCancellationReason.CustomerLed;
        double daysToDeparture = 61;
        var creditRefundAmount = 250m;
        var cashRefundAmount = 750m;

        _mockRepCodeService
            .Setup(s => s.GetRepCode(bookingCancellationReason, daysToDeparture, creditRefundAmount, cashRefundAmount, It.IsAny<bool>()))
#pragma warning disable CA2201
            .Throws(new Exception("Test exception"));
#pragma warning restore CA2201

        // Act
        await _service.AddMemosToBooking(
            bookingResponse, bookingCancellationReason, daysToDeparture,
            creditRefundAmount, cashRefundAmount, null, null, null, "Web", null, null);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Adding memos to bookingReference: BR123 failed after cancellation and refund. Continuing without blocking the process.")),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception, string>>((v, t) => true)!),
            Times.Once);
    }
    
    [Fact]
    public async Task AddMemosToBooking_ShouldLogErrorMessage_WhenExceptionOccursDuringSavingMemo()
    {
        // Arrange
        var bookingResponse = new BookingResponse { BookingReference = "BR123" };
        var bookingCancellationReason = BookingCancellationReason.CustomerLed;
        double daysToDeparture = 61;
        var creditRefundAmount = 250m;
        var cashRefundAmount = 750m;
        var repCode = "REP5";

        _mockRepCodeService
            .Setup(s => s.GetRepCode(bookingCancellationReason, daysToDeparture, creditRefundAmount, cashRefundAmount, It.IsAny<bool>()))
            .Returns(repCode);
        _mockBookingRepository.Setup(r => r.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>()))
#pragma warning disable CA2201
            .Throws(new Exception("Test exception"));
#pragma warning restore CA2201

        // Act
        await _service.AddMemosToBooking(
            bookingResponse, bookingCancellationReason, daysToDeparture,
            creditRefundAmount, cashRefundAmount, null, null, null, "Web", null, null);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Adding memos to bookingReference: BR123 failed after cancellation and refund. Continuing without blocking the process.")),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception, string>>((v, t) => true)!),
            Times.Once);
    }
    
    [Theory]
    [InlineData(100, "GBP")]
    [InlineData(112.34, "GBP")]
    [InlineData(112.34, "EUR")]
    public async Task AddMemosToBooking_ShouldAddMemoForRetainedAmountOtuc_WhenGreaterThanZero(decimal retainedAmountOtuc, string currency)
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Currency = new Currency{ Code = currency }
        };

        // Act
        await _service.AddMemosToBooking(bookingResponse, default, 0, null, null, null, null, null, "Web", retainedAmountOtuc, null);

        // Assert
        _mockBookingRepository.Verify(r => r.ModifyMemo(bookingResponse.BookingReference,
            It.Is<BookingMemo>(m => m.Code == "OTCR" && m.Description == $"One time credit retained with the value of the credit retained {retainedAmountOtuc} {currency}")), Times.Once);
    }
    
    [Theory]
    [InlineData(100, "GBP")]
    [InlineData(112.34, "GBP")]
    [InlineData(112.34, "EUR")]
    public async Task AddMemosToBooking_ShouldAddMemoForIssuedAmountOtuc_WhenGreaterThanZero(decimal issuedAmountOtuc, string currency)
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Currency = new Currency{ Code = currency }
        };

        // Act
        await _service.AddMemosToBooking(bookingResponse, default, 0, null, null, null, null, null, "Web", null, issuedAmountOtuc);

        // Assert
        _mockBookingRepository.Verify(r => r.ModifyMemo(bookingResponse.BookingReference,
            It.Is<BookingMemo>(m => m.Code == "OTCI" && m.Description == $"One time credit Issued with the value of the credit issue {issuedAmountOtuc} {currency}")), Times.Once);
    }
    
    [Fact]
    public async Task AddMemosToBooking_ShouldNotAddMemoForRetainedAmountOtuc_WhenRetained0Otuc()
    {
        decimal retainedAmountOtuc = 0;
        var currency = Currency.GBP.Code;
        // Arrange
        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Currency = new Currency{ Code = currency }
        };

        // Act
        await _service.AddMemosToBooking(bookingResponse, default, 0, null, null, null, null, null, "Web", retainedAmountOtuc, null);

        // Assert
        _mockBookingRepository.Verify(r => r.ModifyMemo(bookingResponse.BookingReference,
            It.Is<BookingMemo>(m => m.Code == "OTCR")), Times.Never);
    }
    
    [Fact]
    public async Task AddMemosToBooking_ShouldNotAddMemoForRetainedAmountOtuc_WhenPassNullAsRetainedOtuc()
    {
        decimal? retainedAmountOtuc = null;
        var currency = Currency.GBP.Code;
        // Arrange
        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Currency = new Currency{ Code = currency }
        };

        // Act
        await _service.AddMemosToBooking(bookingResponse, default, 0, null, null, null, null, null, "Web", retainedAmountOtuc, null);

        // Assert
        _mockBookingRepository.Verify(r => r.ModifyMemo(bookingResponse.BookingReference,
            It.Is<BookingMemo>(m => m.Code == "OTCR")), Times.Never);
    }
    
    [Fact]
    public async Task AddMemosToBooking_ShouldNotAddMemoForIssuedAmountOtuc_WhenIssued0Otuc()
    {
        // Arrange
        decimal issuedAmountOtuc = 0;
        var currency = Currency.GBP.Code;
        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Currency = new Currency{ Code = currency }
        };

        // Act
        await _service.AddMemosToBooking(bookingResponse, default, 0, null, null, null, null, null, "Web", null, issuedAmountOtuc);

        // Assert
        _mockBookingRepository.Verify(r => r.ModifyMemo(bookingResponse.BookingReference,
            It.Is<BookingMemo>(m => m.Code == "OTCI")), Times.Never);
    }
    
    [Fact]
    public async Task AddMemosToBooking_ShouldNotAddMemoForIssuedAmountOtuc_WhenPassNullAsIssuedOtuc()
    {
        // Arrange
        decimal? issuedAmountOtuc = null;
        var currency = Currency.GBP.Code;
        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Currency = new Currency{ Code = currency }
        };

        // Act
        await _service.AddMemosToBooking(bookingResponse, default, 0, null, null, null, null, null, "Web", null, issuedAmountOtuc);

        // Assert
        _mockBookingRepository.Verify(r => r.ModifyMemo(bookingResponse.BookingReference,
            It.Is<BookingMemo>(m => m.Code == "OTCI")), Times.Never);
    }

    [Fact]
    public async Task AddFailedCancellationMemo_ShouldAddFirstFailedCancellationMemo_WhenNoExistingMemo()
    {
        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Memo = []
        };

        await _service.AddFailedCancellationMemo(bookingResponse);

        _mockBookingRepository.Verify(r => r.ModifyMemo(bookingResponse.BookingReference,
            It.Is<BookingMemo>(m => m.Code == "FC" && m.Description == "Amount of cancellation failures: 1")), Times.Once);
    }

    [Theory]
    [InlineData("Amount of cancellation failures: 1", 2)]
    [InlineData("Amount of cancellation failures: 7   ", 8)]
    [InlineData("99", 100)]
    public async Task AddFailedCancellationMemo_ShouldIncrementCounter_WhenMemoContainsTrailingNumber(string memoText,
        int expectedCount)
    {
        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Memo =
            [
                new Memo { Code = "FC", Text = memoText }
            ]
        };
        _mockBookingBlockChecker.Setup(b => b.GetTrailingNumberFromMemoText(memoText!)).Returns(expectedCount-1);

        await _service.AddFailedCancellationMemo(bookingResponse);

        _mockBookingRepository.Verify(r => r.ModifyMemo(bookingResponse.BookingReference,
            It.Is<BookingMemo>(m => m.Code == "FC" && m.Description == $"Amount of cancellation failures: {expectedCount}")),
            Times.Once);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Amount of cancellation failures")]
    [InlineData("Amount of cancellation failures: 12x")]
    public async Task AddFailedCancellationMemo_ShouldResetToOne_WhenMemoDoesNotEndWithNumber(string? memoText)
    {
        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Memo =
            [
                new Memo { Code = "FC", Text = memoText! }
            ]
        };
        _mockBookingBlockChecker.Setup(b => b.GetTrailingNumberFromMemoText(memoText!)).Returns(0);

        await _service.AddFailedCancellationMemo(bookingResponse);

        _mockBookingRepository.Verify(r => r.ModifyMemo(bookingResponse.BookingReference,
            It.Is<BookingMemo>(m => m.Code == "FC" && m.Description == "Amount of cancellation failures: 1")), Times.Once);
    }

    [Fact]
    public async Task AddMemosToBooking_WhenSuccessful_ShouldEmitSuccessMetricPerSavedMemo()
    {
        var bookingResponse = new BookingResponse { BookingReference = "BR123", Currency = Currency.GBP };
        _mockRepCodeService
            .Setup(s => s.GetRepCode(It.IsAny<BookingCancellationReason>(), It.IsAny<double>(), It.IsAny<decimal?>(), It.IsAny<decimal?>(), It.IsAny<bool>()))
            .Returns("REP5");

        await _service.AddMemosToBooking(bookingResponse, BookingCancellationReason.CustomerLed, 61,
            250m, 750m, null, null, null, "Web", null, null);

        _mockMetricsService.Verify(m => m.IncrementCounter(
                CancellationMetricConstants.MemoAddedTotal,
                1,
                It.Is<KeyValuePair<string, object>[]>(labels => HasExpectedLabels(labels,
                    "memo_type", "repcode",
                    "status", MetricConstants.SuccessMetricStatus))),
            Times.Once);

        _mockMetricsService.Verify(m => m.IncrementCounter(
                CancellationMetricConstants.MemoAddedTotal,
                1,
                It.Is<KeyValuePair<string, object>[]>(labels => HasExpectedLabels(labels,
                    "memo_type", "source",
                    "status", MetricConstants.SuccessMetricStatus))),
            Times.Once);

        _mockMetricsService.Verify(m => m.IncrementCounter(
                CancellationMetricConstants.MemoAddedTotal,
                1,
                It.Is<KeyValuePair<string, object>[]>(labels =>
                    HasExpectedLabels(labels, "status", MetricConstants.FailureMetricStatus))),
            Times.Never);
    }

    [Fact]
    public async Task AddMemosToBooking_WhenSaveFails_ShouldEmitFailureMetric()
    {
        var bookingResponse = new BookingResponse { BookingReference = "BR123", Currency = Currency.GBP };
        _mockRepCodeService
            .Setup(s => s.GetRepCode(It.IsAny<BookingCancellationReason>(), It.IsAny<double>(), It.IsAny<decimal?>(), It.IsAny<decimal?>(), It.IsAny<bool>()))
            .Returns("REP5");
        _mockBookingRepository.Setup(r => r.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>()))
            .ThrowsAsync(new InvalidOperationException("save failed"));

        await _service.AddMemosToBooking(bookingResponse, BookingCancellationReason.CustomerLed, 61,
            250m, 750m, null, null, null, "Web", null, null);

        _mockMetricsService.Verify(m => m.IncrementCounter(
                CancellationMetricConstants.MemoAddedTotal,
                1,
                It.Is<KeyValuePair<string, object>[]>(labels => HasExpectedLabels(labels,
                    "memo_type", "unknown",
                    "status", MetricConstants.FailureMetricStatus))),
            Times.Once);

        _mockMetricsService.Verify(m => m.IncrementCounter(
                CancellationMetricConstants.MemoAddedTotal,
                1,
                It.Is<KeyValuePair<string, object>[]>(labels =>
                    HasExpectedLabels(labels, "status", MetricConstants.SuccessMetricStatus))),
            Times.Never);
    }

    [Fact]
    public async Task AddFailedCancellationMemo_WhenSuccessful_ShouldEmitRetryAndSuccessMetrics()
    {
        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Memo = []
        };

        await _service.AddFailedCancellationMemo(bookingResponse);

        _mockMetricsService.Verify(m => m.IncrementCounter(CancellationMetricConstants.RetryTotal, 1,
            It.IsAny<KeyValuePair<string, object>[]>()), Times.Once);

        _mockMetricsService.Verify(m => m.IncrementCounter(
                CancellationMetricConstants.MemoAddedTotal,
                1,
                It.Is<KeyValuePair<string, object>[]>(labels => HasExpectedLabels(labels,
                    "memo_type", "failed_cancellation",
                    "status", MetricConstants.SuccessMetricStatus))),
            Times.Once);
    }

    [Fact]
    public async Task AddFailedCancellationMemo_WhenSaveFails_ShouldEmitRetryAndFailureMetrics()
    {
        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Memo = []
        };

        _mockBookingRepository.Setup(r => r.ModifyMemo(It.IsAny<string>(), It.IsAny<BookingMemo>()))
            .ThrowsAsync(new InvalidOperationException("save failed"));

        await _service.AddFailedCancellationMemo(bookingResponse);

        _mockMetricsService.Verify(m => m.IncrementCounter(CancellationMetricConstants.RetryTotal, 1,
            It.IsAny<KeyValuePair<string, object>[]>()), Times.Once);

        _mockMetricsService.Verify(m => m.IncrementCounter(
                CancellationMetricConstants.MemoAddedTotal,
                1,
                It.Is<KeyValuePair<string, object>[]>(labels => HasExpectedLabels(labels,
                    "memo_type", "failed_cancellation",
                    "status", MetricConstants.FailureMetricStatus))),
            Times.Once);

        _mockMetricsService.Verify(m => m.IncrementCounter(
                CancellationMetricConstants.MemoAddedTotal,
                1,
                It.Is<KeyValuePair<string, object>[]>(labels =>
                    HasExpectedLabels(labels, "status", MetricConstants.SuccessMetricStatus))),
            Times.Never);
    }

    private static bool HasExpectedLabels(KeyValuePair<string, object>[] labels, params string[] expectedKeyValuePairs)
    {
        if (expectedKeyValuePairs.Length % 2 != 0)
        {
            return false;
        }

        for (var i = 0; i < expectedKeyValuePairs.Length; i += 2)
        {
            var key = expectedKeyValuePairs[i];
            var value = expectedKeyValuePairs[i + 1];
            var hasLabel = labels.Any(label =>
                label.Key == key &&
                string.Equals(label.Value.ToString(), value, StringComparison.Ordinal));

            if (!hasLabel)
            {
                return false;
            }
        }

        return true;
    }
}