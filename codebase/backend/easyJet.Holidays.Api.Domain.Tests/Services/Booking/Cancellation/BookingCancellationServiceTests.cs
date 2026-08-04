using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Monitoring;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.Memos;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Collections.ObjectModel;
using Voucherify.DataModel;
using Xunit;
using BookingRefundResponse = easyJet.Holidays.Api.Domain.Data.Booking.BookingRefundResponse;
using CustomerDetails = easyJet.Holidays.Api.Domain.Data.Authentication.CustomerDetails;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation;

public class BookingCancellationServiceTests
{
    private readonly BookingCancellationService _sut;
    private readonly Mock<IBookingRepository> _bookingRepositoryMock = new Mock<IBookingRepository>();

    private readonly Mock<IBookingCancellationRefundBreakdownService> _bookingCancellationRefundBreakdownServiceMock =
        new Mock<IBookingCancellationRefundBreakdownService>();

    private readonly Mock<IBookingCancellationRefundValidationService> _bookingCancellationRefundValidationService =
        new Mock<IBookingCancellationRefundValidationService>();

    private readonly Mock<IBookingCancellationRefundSummaryService> _bookingCancellationRefundSummaryService =
        new Mock<IBookingCancellationRefundSummaryService>();

    private readonly Mock<IBookingCreditExpiryStateService> _bookingCreditExpiryStateService =
        new Mock<IBookingCreditExpiryStateService>();

    private readonly Mock<IBookingCancellationRequestService> _bookingCancellationRequestService =
        new Mock<IBookingCancellationRequestService>();

    private readonly Mock<IBookingCancellationCalculateCreditRefundService>
        _bookingCancellationCalculateCreditRefundService =
            new Mock<IBookingCancellationCalculateCreditRefundService>();

    private readonly Mock<IBookingCancellationCreditRefundService>
        _bookingCancellationCreditRefundService =
            new Mock<IBookingCancellationCreditRefundService>();

    private readonly Mock<IBookingCancellationPaymentRefundService>
        _bookingCancellationPaymentRefundService =
            new Mock<IBookingCancellationPaymentRefundService>();

    private readonly Mock<IVouchersService> _vouchersService =
        new Mock<IVouchersService>();

    private readonly Mock<IVouchersCustomerRepository> _vouchersCustomerRepository =
        new Mock<IVouchersCustomerRepository>();

    private readonly Mock<IBookingCancellationRefundOptionService> _bookingCancellationRefundOptionService =
        new Mock<IBookingCancellationRefundOptionService>();

    private readonly Mock<IBookingBlockCheckerService> _bookingBlockChecker = new Mock<IBookingBlockCheckerService>();

    private readonly Mock<IBookingCancellationMemoService> _bookingCancellationMemoService =
        new Mock<IBookingCancellationMemoService>();

    private readonly Mock<ILogger<BookingCancellationService>>
        _logger = new Mock<ILogger<BookingCancellationService>>();

    private readonly Mock<IBookingRefundService> _bookingRefundService = new Mock<IBookingRefundService>();

    private readonly Mock<ISettingsService> _settingsService = new Mock<ISettingsService>();
    private readonly Mock<IMetricsService> _metricsService = new Mock<IMetricsService>();

    public BookingCancellationServiceTests()
    {
        _bookingRepositoryMock.Setup(x => x.GetBookingMemo(It.IsAny<string>())).ReturnsAsync([]);

        _bookingCancellationRequestService.Setup(x => x.IsWebsiteRequest()).ReturnsAsync(false);
        _bookingCancellationRefundValidationService
            .Setup(x => x.IsRefundEnabled(It.IsAny<BookingResponse>(), It.IsAny<bool>(),
                It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(true);

        _bookingCancellationCreditRefundService.Setup(i => i.RefundCreditAmount(It.IsAny<BookingCancellationRequest>(),
                It.IsAny<BookingResponse>(), It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BookingRefundExtendedResponse()
            {
                CreatedVouchers = new ReadOnlyCollection<CreatedVoucher>(new List<CreatedVoucher>())
            });

        _bookingCancellationPaymentRefundService.Setup(i => i.RefundPaymentAmount(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationRequestRefundOption>(), It.IsAny<BookingCancellationRefundBreakdown>()))
            .ReturnsAsync(new List<BookingRefundResponse>());

        var settings =
            new CreditAndCashRefundSettings() { ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture = 27 };
        _settingsService.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(settings);

        _sut = new BookingCancellationService(
            _bookingRepositoryMock.Object,
            _bookingCancellationRefundBreakdownServiceMock.Object,
            _bookingCancellationRequestService.Object,
            _bookingCancellationRefundValidationService.Object,
            _bookingCancellationRefundSummaryService.Object,
            _bookingCreditExpiryStateService.Object,
            _bookingCancellationCreditRefundService.Object,
            _bookingCancellationPaymentRefundService.Object,
            _bookingCancellationRefundOptionService.Object,
            _bookingCancellationMemoService.Object,
            _bookingRefundService.Object,
            _logger.Object,
            _bookingBlockChecker.Object,
            _metricsService.Object);
    }

    [Fact]
    public async Task CancelBooking_WhenSendProperRequest_ShouldReturnResult()
    {
        decimal? feeToOverride = null;
        BookingCancellationReason reason = BookingCancellationReason.CustomerLed;
        CancellationToken cancellationToken = new CancellationToken();
        BookingResponse bookingResponse = new BookingResponse()
        {
            Currency = Currency.GBP,
            Guests =
            [
                new PersonWithDetails() { FirstName = "FirstName", LastName = "LastName", IsLead = true }
            ],
            LeadPassenger = new LeadPassenger() { Email = "email@email.com", },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route() { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                    ]
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 100, PaymentHistory = new List<PaymentHistoryItem>().ToArray()
            }
        };
        var customer = new Customer() { SourceId = "customerId" };
        _vouchersCustomerRepository
            .Setup(x => x.GetOrCreate(null,
                It.IsAny<CustomerDetails>()))
            .ReturnsAsync(customer);

        BookingCancellationRefundBreakdown refundBreakdown =
            new BookingCancellationRefundBreakdown() { OriginalBookingValue = 1000, };
        BookingCancellationRequest request = new BookingCancellationRequest
        {
            RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
            BookingBreakdownValidationHash = refundBreakdown.GetHashCode(),
        };
        _bookingCancellationRefundBreakdownServiceMock
            .Setup(x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, feeToOverride,
                cancellationToken))
            .ReturnsAsync(refundBreakdown);

        var bookingCancellationCreditRefundBreakdown = new BookingCancellationCreditRefundBreakdown();
        _bookingCancellationCalculateCreditRefundService
            .Setup(x => x.CalculateCreditRefund(bookingResponse, refundBreakdown, request.RefundOption.Value,
                cancellationToken))
            .ReturnsAsync(bookingCancellationCreditRefundBreakdown);
        var bookingRefundResponse = new BookingRefundExtendedResponse();
        _vouchersService
            .Setup(x => x.RefundCreditsAndUpdateBooking(bookingResponse, bookingCancellationCreditRefundBreakdown,
                request.Source,
                customer.SourceId, true))
            .ReturnsAsync(bookingRefundResponse);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(request))
            .ReturnsAsync(bookingResponse);
        CancellationResponse response = new CancellationResponse()
        {
            BookingReference = bookingResponse.BookingReference,
        };

        _bookingCancellationRefundOptionService.Setup(i => i.GetRefundOption(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(BookingCancellationRefundOption.OriginalPayment);

        // Act
        var result = await _sut.CancelBooking(request, reason, feeToOverride, false, false, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(response);
        _bookingRepositoryMock.Verify(x => x.GetBooking(request), Times.Once);
        _bookingCancellationRefundBreakdownServiceMock.Verify(
            x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, feeToOverride, cancellationToken),
            Times.Once);
        _bookingCancellationMemoService.Verify(
            x => x.AddMemosToBooking(bookingResponse, reason, It.IsAny<double>(), It.IsAny<decimal>(),
                It.IsAny<decimal>(), It.IsAny<CancellationReason?>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<decimal?>(), It.IsAny<decimal?>(), cancellationToken), Times.Once);
    }

    [Fact]
    public async Task CancelBooking_WhenSendProperSharedServiceRequest_ShouldReturnResult()
    {
        decimal? feeToOverride = null;
        BookingCancellationReason reason = BookingCancellationReason.CustomerLed;
        CancellationToken cancellationToken = new CancellationToken();
        BookingResponse bookingResponse = new BookingResponse()
        {
            Currency = Currency.GBP,
            Guests =
            [
                new PersonWithDetails() { FirstName = "FirstName", LastName = "LastName", IsLead = true }
            ],
            LeadPassenger = new LeadPassenger() { Email = "email@email.com", },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route() { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                    ]
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 100, PaymentHistory = new List<PaymentHistoryItem>().ToArray()
            },
            MarketCode = "MarketCode",
            Language = "Language"
        };
        var customer = new Customer() { SourceId = "customerId" };
        _vouchersCustomerRepository
            .Setup(x => x.GetOrCreate(null,
                It.IsAny<CustomerDetails>()))
            .ReturnsAsync(customer);

        BookingCancellationRefundBreakdown refundBreakdown =
            new BookingCancellationRefundBreakdown() { OriginalBookingValue = 1000, };
        BookingCancellationRequest request = new BookingCancellationRequest
        {
            RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
            BookingBreakdownValidationHash = refundBreakdown.GetHashCode(),
        };
        _bookingCancellationRefundBreakdownServiceMock
            .Setup(x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, feeToOverride,
                cancellationToken))
            .ReturnsAsync(refundBreakdown);

        var bookingCancellationCreditRefundBreakdown = new BookingCancellationCreditRefundBreakdown();
        _bookingCancellationCalculateCreditRefundService
            .Setup(x => x.CalculateCreditRefund(bookingResponse, refundBreakdown, request.RefundOption.Value,
                cancellationToken))
            .ReturnsAsync(bookingCancellationCreditRefundBreakdown);
        var bookingRefundResponse = new BookingRefundExtendedResponse();
        _vouchersService
            .Setup(x => x.RefundCreditsAndUpdateBooking(bookingResponse, bookingCancellationCreditRefundBreakdown,
                request.Source,
                customer.SourceId, true))
            .ReturnsAsync(bookingRefundResponse);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(request))
            .ReturnsAsync(bookingResponse);
        CancellationResponse response = new CancellationResponse()
        {
            BookingReference = bookingResponse.BookingReference,
        };

        _bookingCancellationRefundOptionService.Setup(i => i.GetRefundOption(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(BookingCancellationRefundOption.OriginalPayment);

        // Act
        var result = await _sut.CancelBooking(request, reason, feeToOverride, true, false, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(response);
        _bookingRepositoryMock.Verify(x => x.GetBooking(request), Times.Once);
        _bookingCancellationRefundBreakdownServiceMock.Verify(
            x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, feeToOverride, cancellationToken),
            Times.Once);
        _bookingCancellationMemoService.Verify(
            x => x.AddMemosToBooking(bookingResponse, reason, It.IsAny<double>(), It.IsAny<decimal>(),
                It.IsAny<decimal>(), It.IsAny<CancellationReason?>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<decimal?>(), It.IsAny<decimal?>(), cancellationToken), Times.Once);
    }

    [Fact]
    public async Task CancelBooking_WhenSendBookingWhichIsAlreadyCanceled_ShouldNotCancelAgain()
    {
        decimal? feeToOverride = null;
        BookingCancellationReason reason = BookingCancellationReason.CustomerLed;
        CancellationToken cancellationToken = new CancellationToken();
        BookingResponse bookingResponse = new BookingResponse()
        {
            Currency = Currency.GBP,
            Guests =
            [
                new PersonWithDetails() { FirstName = "FirstName", LastName = "LastName", IsLead = true }
            ],
            LeadPassenger = new LeadPassenger() { Email = "email@email.com", },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route() { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                    ]
                }
            },
            PaymentInfo =
                new PriceInfo() { TotalPrice = 100, PaymentHistory = new List<PaymentHistoryItem>().ToArray() },
            MarketCode = "MarketCode",
            Language = "Language",
            BookingStatus = "CANCELED"
        };
        var customer = new Customer() { SourceId = "customerId" };
        _vouchersCustomerRepository
            .Setup(x => x.GetOrCreate(null,
                It.IsAny<CustomerDetails>()))
            .ReturnsAsync(customer);

        BookingCancellationRefundBreakdown refundBreakdown =
            new BookingCancellationRefundBreakdown() { OriginalBookingValue = 1000, };
        BookingCancellationRequest request = new BookingCancellationRequest
        {
            RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
            BookingBreakdownValidationHash = refundBreakdown.GetHashCode(),
        };
        _bookingCancellationRefundBreakdownServiceMock
            .Setup(x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, feeToOverride,
                cancellationToken))
            .ReturnsAsync(refundBreakdown);

        var bookingCancellationCreditRefundBreakdown = new BookingCancellationCreditRefundBreakdown();
        _bookingCancellationCalculateCreditRefundService
            .Setup(x => x.CalculateCreditRefund(bookingResponse, refundBreakdown, request.RefundOption.Value,
                cancellationToken))
            .ReturnsAsync(bookingCancellationCreditRefundBreakdown);
        var bookingRefundResponse = new BookingRefundExtendedResponse();
        _vouchersService
            .Setup(x => x.RefundCreditsAndUpdateBooking(bookingResponse, bookingCancellationCreditRefundBreakdown,
                request.Source,
                customer.SourceId, true))
            .ReturnsAsync(bookingRefundResponse);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(request))
            .ReturnsAsync(bookingResponse);
        CancellationResponse response = new CancellationResponse()
        {
            BookingReference = bookingResponse.BookingReference,
        };

        _bookingCancellationRefundOptionService.Setup(i => i.GetRefundOption(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(BookingCancellationRefundOption.OriginalPayment);

        // Act
        var result = await _sut.CancelBooking(request, reason, feeToOverride, true, false, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(response);
        _bookingRepositoryMock.Verify(x => x.GetBooking(request), Times.Once);
        _bookingRepositoryMock.Verify(x => x.CancelBooking(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<IList<string>>()),
            Times.Never);
        _bookingRepositoryMock.Verify(
            x => x.CancelBooking(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<IList<string>?>()), Times.Never);
        _bookingCancellationRefundBreakdownServiceMock.Verify(
            x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, feeToOverride, cancellationToken),
            Times.Once);
        _bookingCancellationMemoService.Verify(
            x => x.AddMemosToBooking(bookingResponse, reason, It.IsAny<double>(), It.IsAny<decimal>(),
                It.IsAny<decimal>(), It.IsAny<CancellationReason?>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<decimal?>(), It.IsAny<decimal?>(), cancellationToken), Times.Once);

    }

    [Fact]
    public async Task
        CancelBooking_WhenSendOriginalPaymentRefundRequestForEasyJetLedButCalculatedOnlyCreditOnly_ShouldReturnResult()
    {
        decimal? feeToOverride = null;
        BookingCancellationReason reason = BookingCancellationReason.EasyJetLed;
        CancellationToken cancellationToken = new CancellationToken();
        BookingResponse bookingResponse = new BookingResponse()
        {
            Currency = Currency.GBP,
            Guests =
            [
                new PersonWithDetails() { FirstName = "FirstName", LastName = "LastName", IsLead = true }
            ],
            LeadPassenger = new LeadPassenger() { Email = "email@email.com", },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route() { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                    ]
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 100, PaymentHistory = new List<PaymentHistoryItem>().ToArray()
            }
        };
        var customer = new Customer() { SourceId = "customerId" };
        _vouchersCustomerRepository
            .Setup(x => x.GetOrCreate(null,
                It.IsAny<CustomerDetails>()))
            .ReturnsAsync(customer);

        BookingCancellationRefundBreakdown refundBreakdown =
            new BookingCancellationRefundBreakdown() { OriginalBookingValue = 1000, };
        BookingCancellationRequest request = new BookingCancellationRequest
        {
            RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
            BookingBreakdownValidationHash = refundBreakdown.GetHashCode(),
        };
        _bookingCancellationRefundBreakdownServiceMock
            .Setup(x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, feeToOverride,
                cancellationToken))
            .ReturnsAsync(refundBreakdown);

        var bookingCancellationCreditRefundBreakdown = new BookingCancellationCreditRefundBreakdown();
        _bookingCancellationCalculateCreditRefundService
            .Setup(x => x.CalculateCreditRefund(bookingResponse, refundBreakdown, request.RefundOption.Value,
                cancellationToken))
            .ReturnsAsync(bookingCancellationCreditRefundBreakdown);
        var bookingRefundResponse = new BookingRefundExtendedResponse();
        _vouchersService
            .Setup(x => x.RefundCreditsAndUpdateBooking(bookingResponse, bookingCancellationCreditRefundBreakdown,
                request.Source,
                customer.SourceId, true))
            .ReturnsAsync(bookingRefundResponse);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(request))
            .ReturnsAsync(bookingResponse);
        CancellationResponse response = new CancellationResponse()
        {
            BookingReference = bookingResponse.BookingReference,
        };

        _bookingCancellationRefundOptionService.Setup(i => i.GetRefundOption(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(BookingCancellationRefundOption.CreditOnly);

        // Act
        var result = await _sut.CancelBooking(request, reason, feeToOverride, true, false, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(response);
        _bookingRepositoryMock.Verify(x => x.GetBooking(request), Times.Once);
        _bookingCancellationRefundBreakdownServiceMock.Verify(
            x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, feeToOverride, cancellationToken),
            Times.Once);
        _bookingCancellationMemoService.Verify(
            x => x.AddMemosToBooking(bookingResponse, reason, It.IsAny<double>(), It.IsAny<decimal>(),
                It.IsAny<decimal>(), It.IsAny<CancellationReason?>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<decimal?>(), It.IsAny<decimal?>(), cancellationToken), Times.Once);
    }

    [Theory]
    [InlineData(0, 0)]
    [InlineData(123.34, 987.65)]
    public async Task CancelBooking_WhenOTUCInside_ShouldSendRetainedAndIssuedValueToMemo(decimal retainedOtuc,
        decimal issuedOtuc)
    {
        decimal? feeToOverride = null;
        BookingCancellationReason reason = BookingCancellationReason.EasyJetLed;
        CancellationToken cancellationToken = new CancellationToken();
        BookingResponse bookingResponse = new BookingResponse()
        {
            Currency = Currency.GBP,
            Guests =
            [
                new PersonWithDetails() { FirstName = "FirstName", LastName = "LastName", IsLead = true }
            ],
            LeadPassenger = new LeadPassenger() { Email = "email@email.com", },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route() { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                    ]
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 100, PaymentHistory = new List<PaymentHistoryItem>().ToArray()
            }
        };
        var customer = new Customer() { SourceId = "customerId" };
        _vouchersCustomerRepository
            .Setup(x => x.GetOrCreate(null,
                It.IsAny<CustomerDetails>()))
            .ReturnsAsync(customer);

        BookingCancellationRefundBreakdown refundBreakdown =
            new BookingCancellationRefundBreakdown()
            {
                OriginalBookingValue = 1000,
                OneTimeUseCreditKeptAmount = retainedOtuc,
                OneTimeUseCreditRefundAmount = issuedOtuc
            };
        BookingCancellationRequest request = new BookingCancellationRequest
        {
            RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
            BookingBreakdownValidationHash = refundBreakdown.GetHashCode(),
        };
        _bookingCancellationRefundBreakdownServiceMock
            .Setup(x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, feeToOverride,
                cancellationToken))
            .ReturnsAsync(refundBreakdown);

        var bookingCancellationCreditRefundBreakdown = new BookingCancellationCreditRefundBreakdown();
        _bookingCancellationCalculateCreditRefundService
            .Setup(x => x.CalculateCreditRefund(bookingResponse, refundBreakdown, request.RefundOption.Value,
                cancellationToken))
            .ReturnsAsync(bookingCancellationCreditRefundBreakdown);
        var bookingRefundResponse = new BookingRefundExtendedResponse();
        _vouchersService
            .Setup(x => x.RefundCreditsAndUpdateBooking(bookingResponse, bookingCancellationCreditRefundBreakdown,
                request.Source,
                customer.SourceId, true))
            .ReturnsAsync(bookingRefundResponse);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(request))
            .ReturnsAsync(bookingResponse);
        CancellationResponse response = new CancellationResponse()
        {
            BookingReference = bookingResponse.BookingReference,
        };

        _bookingCancellationRefundOptionService.Setup(i => i.GetRefundOption(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(BookingCancellationRefundOption.CreditOnly);

        // Act
        var result = await _sut.CancelBooking(request, reason, feeToOverride, true, false, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(response);
        _bookingRepositoryMock.Verify(x => x.GetBooking(request), Times.Once);
        _bookingCancellationRefundBreakdownServiceMock.Verify(
            x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, feeToOverride, cancellationToken),
            Times.Once);
        _bookingCancellationMemoService.Verify(
            x => x.AddMemosToBooking(bookingResponse, reason, It.IsAny<double>(), It.IsAny<decimal>(),
                It.IsAny<decimal>(), It.IsAny<CancellationReason?>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), retainedOtuc, issuedOtuc, cancellationToken), Times.Once);
    }

    [Fact]
    public async Task CancelBooking_NoRefundOptionButSubmitCashRefund_ThrowException()
    {
        decimal? feeToOverride = null;
        var reason = BookingCancellationReason.CustomerLed;
        var cancellationToken = new CancellationToken();
        var bookingResponse = new BookingResponse()
        {
            Currency = Currency.GBP,
            Guests =
            [
                new PersonWithDetails() { FirstName = "FirstName", LastName = "LastName", IsLead = true }
            ],
            LeadPassenger = new LeadPassenger() { Email = "email@email.com", },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route() { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                    ]
                }
            }
        };

        var refundBreakdown = new BookingCancellationRefundBreakdown() { OriginalBookingValue = 1000, };
        var request = new BookingCancellationRequest
        {
            RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
            BookingBreakdownValidationHash = refundBreakdown.GetHashCode(),
        };
        _bookingCancellationRefundBreakdownServiceMock
            .Setup(x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, feeToOverride,
                cancellationToken))
            .ReturnsAsync(refundBreakdown);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(request))
            .ReturnsAsync(bookingResponse);

        _bookingCancellationRefundOptionService.Setup(x => x.GetRefundOption(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(BookingCancellationRefundOption.None);

        // Act
        Func<Task<CancellationResponse>> f = async () =>
            await _sut.CancelBooking(request, reason, null, false, false, cancellationToken);

        // Assert
        await f.Should().ThrowAsync<ApiException>()
            .Where(x => x.Code.Equals(ApiExceptionCodes.BookingCancellationRefundOptionError));
    }

    [Theory]
    [InlineData(BookingCancellationRequestRefundOption.OriginalPayment, BookingCancellationRefundOption.OriginalPayment,
        false)]
    [InlineData(BookingCancellationRequestRefundOption.OriginalPayment,
        BookingCancellationRefundOption.CreditAndOriginalPayment, false)]
    [InlineData(BookingCancellationRequestRefundOption.OriginalPayment, BookingCancellationRefundOption.CreditOnly,
        true)]
    [InlineData(BookingCancellationRequestRefundOption.OriginalPayment, BookingCancellationRefundOption.None, true)]
    [InlineData(BookingCancellationRequestRefundOption.Credit, BookingCancellationRefundOption.CreditOnly, false)]
    [InlineData(BookingCancellationRequestRefundOption.Credit, BookingCancellationRefundOption.CreditAndOriginalPayment,
        false)]
    [InlineData(BookingCancellationRequestRefundOption.Credit, BookingCancellationRefundOption.OriginalPayment, true)]
    [InlineData(BookingCancellationRequestRefundOption.Credit, BookingCancellationRefundOption.None, true)]
    [InlineData(BookingCancellationRequestRefundOption.None, BookingCancellationRefundOption.None, false)]
    [InlineData(BookingCancellationRequestRefundOption.None, BookingCancellationRefundOption.CreditOnly, true)]
    [InlineData(BookingCancellationRequestRefundOption.None, BookingCancellationRefundOption.CreditAndOriginalPayment,
        true)]
    [InlineData(BookingCancellationRequestRefundOption.None, BookingCancellationRefundOption.OriginalPayment, true)]
    public async Task CancelBooking_CheckRequestedRefundOption_ToCalculatedRefundOption(
        BookingCancellationRequestRefundOption requestRefundOption,
        BookingCancellationRefundOption calculatedRefundOption,
        bool mustThrowException)
    {
        decimal? feeToOverride = null;
        var reason = BookingCancellationReason.CustomerLed;
        var cancellationToken = new CancellationToken();
        var bookingResponse = new BookingResponse()
        {
            Currency = Currency.GBP,
            Guests =
            [
                new PersonWithDetails() { FirstName = "FirstName", LastName = "LastName", IsLead = true }
            ],
            LeadPassenger = new LeadPassenger() { Email = "email@email.com", },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route() { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                    ]
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 100, PaymentHistory = new List<PaymentHistoryItem>().ToArray()
            }
        };

        var refundBreakdown = new BookingCancellationRefundBreakdown() { OriginalBookingValue = 1000, };
        var request = new BookingCancellationRequest
        {
            RefundOption = requestRefundOption, BookingBreakdownValidationHash = refundBreakdown.GetHashCode(),
        };
        _bookingCancellationRefundBreakdownServiceMock
            .Setup(x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, feeToOverride,
                cancellationToken))
            .ReturnsAsync(refundBreakdown);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(request))
            .ReturnsAsync(bookingResponse);

        _bookingCancellationRefundOptionService.Setup(i => i.GetRefundOption(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(BookingCancellationRefundOption.None);

        _bookingCancellationRefundOptionService.Setup(i => i.GetRefundOption(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(calculatedRefundOption);

        CancellationResponse response = new CancellationResponse()
        {
            BookingReference = bookingResponse.BookingReference,
        };

        // Act
        Func<Task<CancellationResponse>> cancelBookingFunction = async () =>
            await _sut.CancelBooking(request, reason, null, false, false, cancellationToken);

        // Assert
        if (mustThrowException)
        {
            await cancelBookingFunction.Should().ThrowAsync<ApiException>().Where(x =>
                x.Code.Equals(ApiExceptionCodes.BookingCancellationRefundOptionError));
        }
        else
        {
            var result = await cancelBookingFunction();
            result.Should().BeEquivalentTo(response);
        }
    }

    [Fact]
    public async Task CancelBooking_EasyjetLedCancellationWithTradeBooking_CancelBookingOnly()
    {
        decimal? feeToOverride = null;
        var reason = BookingCancellationReason.EasyJetLed;
        var cancellationToken = new CancellationToken();
        var bookingResponse = new BookingResponse()
        {
            Currency = Currency.GBP,
            Guests =
            [
                new PersonWithDetails() { FirstName = "FirstName", LastName = "LastName", IsLead = true }
            ],
            LeadPassenger = new LeadPassenger() { Email = "email@email.com", },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route() { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                    ]
                }
            },
            PaymentInfo =
                new PriceInfo()
                {
                    TotalPrice = 2150.67m,
                    PaymentReceived = 2000.34m,
                    PaymentHistory = new List<PaymentHistoryItem>().ToArray()
                },
            AgentData = new BookingAgentData() { AgentName = "TradeBooking", AgentNumber = "123456" },
            BookingReference = "123456",
            IsExternalAgency = true
        };

        var refundBreakdown =
            new BookingCancellationRefundBreakdown() { CashRefundAmount = 2000.34m, OriginalBookingValue = 2150.67m, };
        var request = new BookingCancellationRequest
        {
            RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
            BookingBreakdownValidationHash = refundBreakdown.GetHashCode(),
        };
        _bookingCancellationRefundBreakdownServiceMock
            .Setup(x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, feeToOverride,
                cancellationToken))
            .ReturnsAsync(refundBreakdown);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(request))
            .ReturnsAsync(bookingResponse);
        var response = new CancellationResponse()
        {
            BookingReference = bookingResponse.BookingReference,
            CashRefundAmount = 2000.34m,
            CreditRefundAmount = 0,
        };

        _bookingCancellationRefundOptionService.Setup(i => i.GetRefundOption(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(BookingCancellationRefundOption.None);

        // Act
        var result = await _sut.CancelBooking(request, reason, null, false, false, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(response);
    }

    [Fact]
    public async Task CancelBooking_TradeLedCancellationWithTradeBooking_CancelBookingOnly()
    {
        decimal? feeToOverride = null;
        var reason = BookingCancellationReason.TradeLed;
        var cancellationToken = new CancellationToken();
        var bookingResponse = new BookingResponse()
        {
            Currency = Currency.GBP,
            Guests =
            [
                new PersonWithDetails() { FirstName = "FirstName", LastName = "LastName", IsLead = true }
            ],
            LeadPassenger = new LeadPassenger() { Email = "email@email.com", },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route() { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                    ]
                }
            },
            PaymentInfo =
                new PriceInfo()
                {
                    TotalPrice = 2150.67m,
                    PaymentReceived = 2000.34m,
                    PaymentHistory = new List<PaymentHistoryItem>().ToArray()
                },
            AgentData = new BookingAgentData() { AgentName = "TradeBooking", AgentNumber = "123456" },
            BookingReference = "123456",
            IsExternalAgency = true
        };

        var refundBreakdown =
            new BookingCancellationRefundBreakdown() { CashRefundAmount = 2000.34m, OriginalBookingValue = 1000, };
        var request = new BookingCancellationRequest
        {
            RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
            BookingBreakdownValidationHash = refundBreakdown.GetHashCode(),
        };
        _bookingCancellationRefundBreakdownServiceMock
            .Setup(x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, feeToOverride,
                cancellationToken))
            .ReturnsAsync(refundBreakdown);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(request))
            .ReturnsAsync(bookingResponse);
        var response = new CancellationResponse()
        {
            BookingReference = bookingResponse.BookingReference,
            CashRefundAmount = 2000.34m,
            CreditRefundAmount = 0,
        };

        _bookingCancellationRefundOptionService.Setup(i => i.GetRefundOption(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(BookingCancellationRefundOption.None);

        // Act
        var result = await _sut.CancelBooking(request, reason, null, false, false, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(response);

        _bookingRefundService.Verify(x => x.AddCashMemoToBooking(2000.34m, bookingResponse), Times.Once);
    }

    [Fact]
    public async Task
        CancelBooking_TradeLedCancellationWithTradeBookingWhenErrorDuringAddingMemos_ShouldCancelBookingAndLogWarningThatAddingMemoFailed()
    {
        decimal? feeToOverride = null;
        var reason = BookingCancellationReason.TradeLed;
        var cancellationToken = new CancellationToken();
        var bookingResponse = new BookingResponse()
        {
            Currency = Currency.GBP,
            Guests =
            [
                new PersonWithDetails() { FirstName = "FirstName", LastName = "LastName", IsLead = true }
            ],
            LeadPassenger = new LeadPassenger() { Email = "email@email.com", },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route() { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                    ]
                }
            },
            PaymentInfo =
                new PriceInfo()
                {
                    TotalPrice = 2150.67m,
                    PaymentReceived = 2000.34m,
                    PaymentHistory = new List<PaymentHistoryItem>().ToArray()
                },
            AgentData = new BookingAgentData() { AgentName = "TradeBooking", AgentNumber = "123456" },
            BookingReference = "123456",
            IsExternalAgency = true
        };

        var refundBreakdown =
            new BookingCancellationRefundBreakdown() { CashRefundAmount = 2000.34m, OriginalBookingValue = 1000, };
        var request = new BookingCancellationRequest
        {
            RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
            BookingBreakdownValidationHash = refundBreakdown.GetHashCode(),
        };
        _bookingCancellationRefundBreakdownServiceMock
            .Setup(x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, feeToOverride,
                cancellationToken))
            .ReturnsAsync(refundBreakdown);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(request))
            .ReturnsAsync(bookingResponse);
        var response = new CancellationResponse()
        {
            BookingReference = bookingResponse.BookingReference,
            CashRefundAmount = 2000.34m,
            CreditRefundAmount = 0,
        };

        _bookingCancellationRefundOptionService.Setup(i => i.GetRefundOption(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(BookingCancellationRefundOption.None);
        _bookingRefundService.Setup(r => r.AddCashMemoToBooking(It.IsAny<decimal>(), It.IsAny<BookingResponse>()))
#pragma warning disable CA2201
            .Throws(new Exception("Test exception"));
#pragma warning restore CA2201

        // Act
        var result = await _sut.CancelBooking(request, reason, null, false, false, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(response);

        _bookingRefundService.Verify(x => x.AddCashMemoToBooking(2000.34m, bookingResponse), Times.Once);
        _logger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) =>
                    v.ToString()!.Contains(
                        "Adding cash memo to bookingReference: 123456 failed during cancellation. Continuing without blocking the process.")),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception, string>>((v, t) => true)!),
            Times.Once);
    }

    [Fact]
    public async Task CancelBooking_WhenErrorDuringGettingBooking_ShouldReturnException()
    {
        // Arrange
        BookingCancellationRequest request =
            new BookingCancellationRequest() { RefundOption = BookingCancellationRequestRefundOption.OriginalPayment };
        BookingCancellationReason reason = BookingCancellationReason.CustomerLed;
        CancellationToken cancellationToken = new CancellationToken();
        _bookingRepositoryMock
            .Setup(x => x.GetBooking(request))
            .Throws<ApiException>(() => new ApiException(ApiExceptionCodes.BookingViewError));

        // Act
        Func<Task<CancellationResponse>> f = async () =>
            await _sut.CancelBooking(request, reason, null, false, false, cancellationToken);

        // Assert
        await f.Should().ThrowAsync<ApiException>().Where(x => x.Code.Equals(ApiExceptionCodes.BookingViewError));
        _bookingRepositoryMock.Verify(x => x.GetBooking(request), Times.Once);
        _bookingCancellationRefundBreakdownServiceMock.Verify(
            x => x.GetBookingCancellationRefundBreakdown(It.IsAny<BookingResponse>(), reason, null, cancellationToken),
            Times.Never);
    }

    [Fact]
    public async Task CancelBooking_ShouldAddFailedCancellationMemo_WhenCreditRefundThrows()
    {
        // Arrange
        var reason = BookingCancellationReason.CustomerLed;
        var cancellationToken = new CancellationToken();
        var bookingResponse = new BookingResponse { BookingReference = "REF123" };
        var refundBreakdown = new BookingCancellationRefundBreakdown
        {
            OriginalBookingValue = 1000, CashRefundAmount = 250
        };
        var request = new BookingCancellationRequest
        {
            RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
            BookingBreakdownValidationHash = refundBreakdown.GetHashCode()
        };
        var paymentRefund = new List<BookingRefundResponse> { new() { PaymentId = "payment-1" } };
        var expectedException = new InvalidOperationException("Credit refund failed");

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(request))
            .ReturnsAsync(bookingResponse);
        _bookingCancellationRefundBreakdownServiceMock
            .Setup(x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, null, cancellationToken))
            .ReturnsAsync(refundBreakdown);
        _bookingCancellationRefundOptionService
            .Setup(x => x.GetRefundOption(bookingResponse, refundBreakdown, reason))
            .ReturnsAsync(BookingCancellationRefundOption.OriginalPayment);
        _bookingCancellationPaymentRefundService
            .Setup(x => x.RefundPaymentAmount(bookingResponse, request.RefundOption.Value, refundBreakdown))
            .ReturnsAsync(paymentRefund);
        _bookingCancellationPaymentRefundService
            .Setup(x => x.RollbackRefundAmount(
                bookingResponse,
                It.Is<ReadOnlyCollection<BookingRefundResponse>>(refunds =>
                    refunds.Count == 1 && refunds[0] == paymentRefund[0]),
                expectedException))
            .ReturnsAsync(true);
        _bookingCancellationCreditRefundService
            .Setup(x => x.RefundCreditAmount(request, bookingResponse, refundBreakdown, cancellationToken))
            .ThrowsAsync(expectedException);

        // Act
        Func<Task> act = async () => await _sut.CancelBooking(request, reason, null, false, false, cancellationToken);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("Credit refund failed");
        _bookingCancellationMemoService.Verify(
            x => x.AddFailedCancellationMemo(bookingResponse, cancellationToken),
            Times.Once);
        _bookingCancellationPaymentRefundService.Verify(
            x => x.RollbackRefundAmount(
                bookingResponse,
                It.Is<ReadOnlyCollection<BookingRefundResponse>>(refunds =>
                    refunds.Count == 1 && refunds[0] == paymentRefund[0]),
                expectedException),
            Times.Once);
        _bookingCancellationCreditRefundService.Verify(
            x => x.RollbackCreditRefund(It.IsAny<BookingResponse>(), It.IsAny<IReadOnlyCollection<CreatedVoucher>>()),
            Times.Never);
        _bookingRepositoryMock.Verify(
            x => x.CancelBooking(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<IList<string>>()),
            Times.Never);
        _bookingCancellationMemoService.Verify(
            x => x.AddMemosToBooking(It.IsAny<BookingResponse>(), It.IsAny<BookingCancellationReason>(),
                It.IsAny<double>(), It.IsAny<decimal?>(), It.IsAny<decimal?>(), It.IsAny<CancellationReason?>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<decimal?>(),
                It.IsAny<decimal?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CancelBooking_ShouldAddFailedCancellationMemo_WhenCancellingBookingInAtcomThrows()
    {
        // Arrange
        var reason = BookingCancellationReason.CustomerLed;
        var cancellationToken = new CancellationToken();
        var bookingResponse = new BookingResponse { BookingReference = "REF123" };
        var refundBreakdown = new BookingCancellationRefundBreakdown
        {
            OriginalBookingValue = 1000, CashRefundAmount = 250
        };
        var request = new BookingCancellationRequest
        {
            RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
            BookingBreakdownValidationHash = refundBreakdown.GetHashCode()
        };
        var paymentRefund = new List<BookingRefundResponse> { new() { PaymentId = "payment-1" } };
        var createdVouchers = new ReadOnlyCollection<CreatedVoucher>(
            new List<CreatedVoucher> { new() });
        var creditRefund = new BookingRefundExtendedResponse { CreatedVouchers = createdVouchers };
        var expectedException = new InvalidOperationException("ATCOM cancellation failed");

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(request))
            .ReturnsAsync(bookingResponse);
        _bookingCancellationRefundBreakdownServiceMock
            .Setup(x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, null, cancellationToken))
            .ReturnsAsync(refundBreakdown);
        _bookingCancellationRefundOptionService
            .Setup(x => x.GetRefundOption(bookingResponse, refundBreakdown, reason))
            .ReturnsAsync(BookingCancellationRefundOption.OriginalPayment);
        _bookingCancellationPaymentRefundService
            .Setup(x => x.RefundPaymentAmount(bookingResponse, request.RefundOption.Value, refundBreakdown))
            .ReturnsAsync(paymentRefund);
        _bookingCancellationPaymentRefundService
            .Setup(x => x.RollbackRefundAmount(
                bookingResponse,
                It.Is<ReadOnlyCollection<BookingRefundResponse>>(refunds =>
                    refunds.Count == 1 && refunds[0] == paymentRefund[0]),
                expectedException))
            .ReturnsAsync(true);
        _bookingCancellationCreditRefundService
            .Setup(x => x.RefundCreditAmount(request, bookingResponse, refundBreakdown, cancellationToken))
            .ReturnsAsync(creditRefund);
        _bookingCancellationCreditRefundService
            .Setup(x => x.RollbackCreditRefund(bookingResponse, createdVouchers))
            .ReturnsAsync(true);
        _bookingRepositoryMock
            .Setup(x => x.CancelBooking(bookingResponse.BookingReference, "Booking Cancellation", true, It.IsAny<IList<string>>()))
            .ThrowsAsync(expectedException);

        // Act
        Func<Task> act = async () => await _sut.CancelBooking(request, reason, null, false, false, cancellationToken);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("ATCOM cancellation failed");
        _bookingCancellationMemoService.Verify(
            x => x.AddFailedCancellationMemo(bookingResponse, cancellationToken),
            Times.Once);
        _bookingCancellationPaymentRefundService.Verify(
            x => x.RollbackRefundAmount(
                bookingResponse,
                It.Is<ReadOnlyCollection<BookingRefundResponse>>(refunds =>
                    refunds.Count == 1 && refunds[0] == paymentRefund[0]),
                expectedException),
            Times.Once);
        _bookingCancellationCreditRefundService.Verify(
            x => x.RollbackCreditRefund(bookingResponse, createdVouchers),
            Times.Once);
        _bookingCancellationMemoService.Verify(
            x => x.AddMemosToBooking(It.IsAny<BookingResponse>(), It.IsAny<BookingCancellationReason>(),
                It.IsAny<double>(), It.IsAny<decimal?>(), It.IsAny<decimal?>(), It.IsAny<CancellationReason?>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<decimal?>(),
                It.IsAny<decimal?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CancelBooking_WhenOverrideFee_ShouldReturnResult()
    {
        // Arrange
        decimal feeToOverride = 9999;
        BookingCancellationReason reason = BookingCancellationReason.CustomerLed;
        CancellationToken cancellationToken = new CancellationToken();
        BookingResponse bookingResponse = new BookingResponse()
        {
            Currency = Currency.GBP,
            Guests =
            [
                new PersonWithDetails() { FirstName = "FirstName", LastName = "LastName", IsLead = true }
            ],
            LeadPassenger = new LeadPassenger() { Email = "email@email.com", },
            PaymentInfo =
                new PriceInfo() { TotalPrice = 1000, PaymentHistory = new List<PaymentHistoryItem>().ToArray() },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(61).AddHours(1), Direction = Direction.Outbound
                        }
                    ],
                }
            },
        };
        var customer = new Customer() { SourceId = "customerId" };
        _vouchersCustomerRepository
            .Setup(x => x.GetOrCreate(null,
                It.IsAny<CustomerDetails>()))
            .ReturnsAsync(customer);

        BookingCancellationRefundBreakdown refundBreakdown =
            new BookingCancellationRefundBreakdown() { CancelFeeAmount = feeToOverride, OriginalBookingValue = 1000, };
        BookingCancellationRequest request = new BookingCancellationRequest
        {
            RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
            BookingBreakdownValidationHash = refundBreakdown.GetHashCode()
        };
        _bookingCancellationRefundBreakdownServiceMock
            .Setup(x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, It.IsAny<decimal?>(),
                cancellationToken))
            .ReturnsAsync(refundBreakdown);

        var bookingCancellationCreditRefundBreakdown = new BookingCancellationCreditRefundBreakdown();
        _bookingCancellationCalculateCreditRefundService
            .Setup(x => x.CalculateCreditRefund(bookingResponse, refundBreakdown, request.RefundOption.Value,
                cancellationToken))
            .ReturnsAsync(bookingCancellationCreditRefundBreakdown);
        var bookingRefundResponse = new BookingRefundExtendedResponse()
        {
            CreatedVouchers = new ReadOnlyCollection<CreatedVoucher>(new List<CreatedVoucher>())
        };
        _vouchersService
            .Setup(x => x.RefundCreditsAndUpdateBooking(bookingResponse, bookingCancellationCreditRefundBreakdown,
                request.Source,
                customer.SourceId, true))
            .ReturnsAsync(bookingRefundResponse);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(request))
            .ReturnsAsync(bookingResponse);
        CancellationResponse response = new CancellationResponse()
        {
            BookingReference = bookingResponse.BookingReference,
        };

        _bookingCancellationRefundOptionService.Setup(i => i.GetRefundOption(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(BookingCancellationRefundOption.OriginalPayment);

        // Act
        var result = await _sut.CancelBooking(request, reason, feeToOverride, false, false, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(response);
        _bookingRepositoryMock.Verify(x => x.GetBooking(request), Times.Once);
        _bookingCancellationRefundBreakdownServiceMock.Verify(
            x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, feeToOverride, cancellationToken),
            Times.Once);
        _bookingCancellationMemoService.Verify(
            x => x.AddMemosToBooking(bookingResponse, reason, It.IsAny<double>(), It.IsAny<decimal>(),
                It.IsAny<decimal>(), It.IsAny<CancellationReason?>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<decimal?>(), It.IsAny<decimal?>(), cancellationToken), Times.Once);
    }


    [Fact]
    public async Task ValidatePreflightChecks_ShouldThrowExceptionIfRefundNotAllowed()
    {
        // Arrange
        var bookingResponse = new BookingResponse();
        _bookingCancellationRefundValidationService
            .Setup(x => x.IsRefundEnabled(It.IsAny<BookingResponse>(), It.IsAny<bool>(),
                It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(false);

        // Act & Assert
        await Assert.ThrowsAsync<ApiException>(async () =>
            await _sut.ValidatePreflightChecks(bookingResponse, BookingCancellationReason.CustomerLed, false, false));
    }

    [Fact]
    public async Task ValidatePreflightChecks_ShouldThrowExceptionForTradeBookingAndB2CCustomerLed()
    {
        // Arrange
        var bookingResponse = new BookingResponse() { IsExternalAgency = true };
        _bookingCancellationRefundValidationService
            .Setup(x => x.IsRefundEnabled(It.IsAny<BookingResponse>(), It.IsAny<bool>(),
                It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(true);
        _bookingCancellationRefundValidationService
            .Setup(x => x.IsCurrentUserLeadPassenger(It.IsAny<BookingResponse>()))
            .ReturnsAsync(true);
        _bookingCancellationRequestService
            .Setup(x => x.IsWebsiteRequest())
            .ReturnsAsync(true);


        // Act & Assert
        await Assert.ThrowsAsync<ApiException>(async () =>
            await _sut.ValidatePreflightChecks(bookingResponse, BookingCancellationReason.CustomerLed, false, false));
    }

    [Fact]
    public async Task CancelBooking_ShouldThrowIfRefundDiffersFromPreviousCalculation()
    {
        // Arrange
        var bookingCancellationRequest = new BookingCancellationRequest
        {
            BookingBreakdownValidationHash = 123,
            RefundOption = BookingCancellationRequestRefundOption.OriginalPayment
        };
        var bookingCancellationReason = BookingCancellationReason.CustomerLed;
        var cancellationToken = CancellationToken.None;

        var bookingResponse = new BookingResponse
        {
            Currency = new Currency { Code = "GBP" }, BookingReference = "REF123"
        };

        var refundBreakdown = new BookingCancellationRefundBreakdown() { OriginalBookingValue = 1000, };

        _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<BookingCancellationRequestBase>()))
            .ReturnsAsync(bookingResponse);


        _bookingCancellationRefundBreakdownServiceMock.Setup(x => x.GetBookingCancellationRefundBreakdown(
                It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationReason>(), It.IsAny<decimal?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(refundBreakdown);

        // Act & Assert
        await Assert.ThrowsAsync<ApiException>(async () =>
            await _sut.CancelBooking(bookingCancellationRequest, bookingCancellationReason, null,
                false, false, cancellationToken));
    }

    [Fact]
    public async Task CancelBooking_ShouldThrowIfCreditOnlyRefundButOriginalPaymentWasTransmitted()
    {
        // Arrange
        var refundBreakdown = new BookingCancellationRefundBreakdown()
        {
            CashRefundAmount = 0, CreditRefundAmount = 100, TotalRefundAmount = 100, OriginalBookingValue = 1000,
        };

        var bookingCancellationRequest = new BookingCancellationRequest
        {
            BookingBreakdownValidationHash = refundBreakdown.GetHashCode(),
            RefundOption = BookingCancellationRequestRefundOption.OriginalPayment
        };
        var bookingCancellationReason = BookingCancellationReason.CustomerLed;
        var cancellationToken = CancellationToken.None;

        var bookingResponse = new BookingResponse
        {
            Currency = new Currency { Code = "GBP" }, BookingReference = "REF123"
        };

        _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<BookingCancellationRequestBase>()))
            .ReturnsAsync(bookingResponse);


        _bookingCancellationRefundBreakdownServiceMock.Setup(x => x.GetBookingCancellationRefundBreakdown(
                It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationReason>(), It.IsAny<decimal?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(refundBreakdown);

        _bookingCancellationRefundOptionService.Setup(x => x.GetRefundOption(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(BookingCancellationRefundOption.CreditOnly);

        // Act & Assert
        await Assert.ThrowsAsync<ApiException>(async () =>
            await _sut.CancelBooking(bookingCancellationRequest, bookingCancellationReason, null,
                false, false, cancellationToken));
    }

    [Fact]
    public async Task CancelBooking_ShouldThrowIfOriginalPaymentOnlyRefundButCreditOnlyWasTransmitted()
    {
        // Arrange
        var refundBreakdown = new BookingCancellationRefundBreakdown()
        {
            CashRefundAmount = 0, CreditRefundAmount = 100, TotalRefundAmount = 100, OriginalBookingValue = 1000,
        };

        var bookingCancellationRequest = new BookingCancellationRequest
        {
            BookingBreakdownValidationHash = refundBreakdown.GetHashCode(),
            RefundOption = BookingCancellationRequestRefundOption.Credit
        };
        var bookingCancellationReason = BookingCancellationReason.CustomerLed;
        var cancellationToken = CancellationToken.None;

        var bookingResponse = new BookingResponse
        {
            Currency = new Currency { Code = "GBP" }, BookingReference = "REF123"
        };

        _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<BookingCancellationRequestBase>()))
            .ReturnsAsync(bookingResponse);


        _bookingCancellationRefundBreakdownServiceMock.Setup(x => x.GetBookingCancellationRefundBreakdown(
                It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationReason>(), It.IsAny<decimal?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(refundBreakdown);

        _bookingCancellationRefundOptionService.Setup(x => x.GetRefundOption(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(BookingCancellationRefundOption.OriginalPayment);

        // Act & Assert
        await Assert.ThrowsAsync<ApiException>(async () =>
            await _sut.CancelBooking(bookingCancellationRequest, bookingCancellationReason, null, false, false,
                cancellationToken));
    }

    [Fact]
    public async Task CancelBooking_ShouldThrowIfNotLeadPassengerCancelBooking()
    {
        // Arrange
        var refundBreakdown = new BookingCancellationRefundBreakdown()
        {
            CashRefundAmount = 0, CreditRefundAmount = 100, TotalRefundAmount = 500, OriginalBookingValue = 1000,
        };

        var bookingCancellationRequest = new BookingCancellationRequest
        {
            BookingBreakdownValidationHash = refundBreakdown.GetHashCode(),
            RefundOption = BookingCancellationRequestRefundOption.OriginalPayment
        };
        var bookingCancellationReason = BookingCancellationReason.CustomerLed;
        var cancellationToken = CancellationToken.None;

        var bookingResponse = new BookingResponse
        {
            Currency = new Currency { Code = "GBP" }, BookingReference = "REF123"
        };

        _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<BookingCancellationRequestBase>()))
            .ReturnsAsync(bookingResponse);


        _bookingCancellationRefundBreakdownServiceMock.Setup(x => x.GetBookingCancellationRefundBreakdown(
                It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationReason>(), It.IsAny<decimal?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(refundBreakdown);

        _bookingCancellationRequestService.Setup(x => x.IsWebsiteRequest()).ReturnsAsync(true);
        _bookingCancellationRefundValidationService
            .Setup(x => x.IsCurrentUserLeadPassenger(It.IsAny<BookingResponse>())).ReturnsAsync(false);

        // Act & Assert
        await Assert.ThrowsAsync<ApiException>(async () =>
            await _sut.CancelBooking(bookingCancellationRequest, bookingCancellationReason, null,
                false, false, cancellationToken));
    }

    [Fact]
    public async Task GetCancellationSummary_ShouldReturnCancellationSummary()
    {
        // Arrange
        var cancellationRequest = new BookingCancellationSummaryRequest();
        var cancellationReason = new BookingCancellationReason();
        var bookingResponse = new BookingResponse();

        // Setup mocks
        _bookingRepositoryMock.Setup(r => r.GetBooking(It.IsAny<BookingCancellationSummaryRequest>()))
            .ReturnsAsync(bookingResponse);

        _bookingCancellationRefundBreakdownServiceMock
            .Setup(r => r.GetBookingCancellationRefundBreakdown(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationReason>(), It.IsAny<decimal>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BookingCancellationRefundBreakdown() { OriginalBookingValue = 1000, });

        _bookingCancellationRefundSummaryService
            .Setup(r => r.GetCancellationRefundSummary(It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationRefundOption>(), It.IsAny<bool>()))
            .ReturnsAsync(new CancellationSummaryResponse());
        _bookingCreditExpiryStateService
            .Setup(r => r.GetCreditExpiryStateAsync(It.IsAny<BookingResponse>()))
            .ReturnsAsync(BookingCreditExpiryState.ExpiredOnly);

        // Act
        var result = await _sut.GetCancellationSummary(cancellationRequest, cancellationReason, null, false, false,
            CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.CreditExpiryState.Should().Be(BookingCreditExpiryState.ExpiredOnly);
        _bookingRepositoryMock.Verify(r => r.GetBooking(It.IsAny<BookingCancellationSummaryRequest>()), Times.Once);
        _bookingCancellationRefundSummaryService.Verify(
            r => r.GetCancellationRefundSummary(It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationRefundOption>(), It.IsAny<bool>()), Times.Once);
        _bookingCreditExpiryStateService.Verify(r => r.GetCreditExpiryStateAsync(It.IsAny<BookingResponse>()), Times.Once);
    }

    [Fact]
    public async Task GetCancellationSummary_WhenSuccessful_ShouldEmitSuccessMetricOnlyOnce()
    {
        var cancellationRequest = new BookingCancellationSummaryRequest();
        var cancellationReason = BookingCancellationReason.CustomerLed;
        var bookingResponse = new BookingResponse { BookingReference = "BR123" };

        _bookingRepositoryMock.Setup(r => r.GetBooking(It.IsAny<BookingCancellationSummaryRequest>()))
            .ReturnsAsync(bookingResponse);
        _bookingCancellationRefundBreakdownServiceMock
            .Setup(r => r.GetBookingCancellationRefundBreakdown(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationReason>(), It.IsAny<decimal>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BookingCancellationRefundBreakdown { OriginalBookingValue = 1000 });
        _bookingCancellationRefundOptionService
            .Setup(r => r.GetRefundOption(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationRefundBreakdown>(), It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(BookingCancellationRefundOption.OriginalPayment);
        _bookingCancellationRefundSummaryService
            .Setup(r => r.GetCancellationRefundSummary(It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationRefundOption>(), It.IsAny<bool>()))
            .ReturnsAsync(new CancellationSummaryResponse());

        await _sut.GetCancellationSummary(cancellationRequest, cancellationReason, null, false, false, CancellationToken.None);

        _metricsService.Verify(m => m.IncrementCounter(
                CancellationMetricConstants.SummaryAttemptTotal,
                1,
                It.Is<KeyValuePair<string, object>[]>(labels => HasExpectedLabels(labels,
                    "reason", cancellationReason.ToString(),
                    "channel", "website",
                    "status", MetricConstants.SuccessMetricStatus))),
            Times.Once);

        _metricsService.Verify(m => m.IncrementCounter(
                CancellationMetricConstants.SummaryAttemptTotal,
                1,
                It.Is<KeyValuePair<string, object>[]>(labels =>
                    HasExpectedLabels(labels, "status", MetricConstants.FailureMetricStatus))),
            Times.Never);
    }

    [Fact]
    public async Task GetCancellationSummary_WhenExceptionThrown_ShouldEmitFailureMetricWithErrorLabels()
    {
        var cancellationRequest = new BookingCancellationSummaryRequest();
        var cancellationReason = BookingCancellationReason.CustomerLed;
        var exception = new InvalidOperationException("boom");

        _bookingRepositoryMock.Setup(r => r.GetBooking(It.IsAny<BookingCancellationSummaryRequest>()))
            .ThrowsAsync(exception);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.GetCancellationSummary(cancellationRequest, cancellationReason, null, false, false, CancellationToken.None));

        _metricsService.Verify(m => m.IncrementCounter(
                CancellationMetricConstants.SummaryAttemptTotal,
                1,
                It.Is<KeyValuePair<string, object>[]>(labels => HasExpectedLabels(labels,
                    "reason", cancellationReason.ToString(),
                    "channel", "website",
                    "status", MetricConstants.FailureMetricStatus,
                    "error_code", nameof(InvalidOperationException),
                    "error_description", exception.Message))),
            Times.Once);

        _metricsService.Verify(m => m.IncrementCounter(
                CancellationMetricConstants.SummaryAttemptTotal,
                1,
                It.Is<KeyValuePair<string, object>[]>(labels =>
                    HasExpectedLabels(labels, "status", MetricConstants.SuccessMetricStatus))),
            Times.Never);
    }

    [Fact]
    public async Task GetCancellationSummary_WhenApiExceptionThrown_ShouldEmitFailureMetricWithApiErrorCode()
    {
        var cancellationRequest = new BookingCancellationSummaryRequest();
        var cancellationReason = BookingCancellationReason.CustomerLed;
        var exception = new ApiException(ApiExceptionCodes.BookingBlocked, "Booking is blocked");

        _bookingRepositoryMock.Setup(r => r.GetBooking(It.IsAny<BookingCancellationSummaryRequest>()))
            .ThrowsAsync(exception);

        await Assert.ThrowsAsync<ApiException>(() =>
            _sut.GetCancellationSummary(cancellationRequest, cancellationReason, null, false, false, CancellationToken.None));

        _metricsService.Verify(m => m.IncrementCounter(
                CancellationMetricConstants.SummaryAttemptTotal,
                1,
                It.Is<KeyValuePair<string, object>[]>(labels => HasExpectedLabels(labels,
                    "reason", cancellationReason.ToString(),
                    "channel", "website",
                    "status", MetricConstants.FailureMetricStatus,
                    "error_code", ApiExceptionCodes.BookingBlocked.ToString(),
                    "error_description", exception.Message))),
            Times.Once);
    }

    [Fact]
    public async Task
        GetCancellationSummary_WhenLogBookingCancellationRefundBreakdownThrowsException_ShouldReturnCancellationSummary()
    {
        // Arrange
        var cancellationRequest = new BookingCancellationSummaryRequest();
        var cancellationReason = new BookingCancellationReason();
        var bookingResponse = new BookingResponse();
        var logCallCount = 0;

        // Setup mocks
        _bookingRepositoryMock.Setup(r => r.GetBooking(It.IsAny<BookingCancellationSummaryRequest>()))
            .ReturnsAsync(bookingResponse);

        _bookingCancellationRefundBreakdownServiceMock
            .Setup(r => r.GetBookingCancellationRefundBreakdown(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationReason>(), It.IsAny<decimal>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BookingCancellationRefundBreakdown() { OriginalBookingValue = 1000, });

        _bookingCancellationRefundSummaryService
            .Setup(r => r.GetCancellationRefundSummary(It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationRefundOption>(), It.IsAny<bool>()))
            .ReturnsAsync(new CancellationSummaryResponse());

        // Setup logger to throw exception on first LogInformation call (LogBookingCancellationRefundBreakdown)
        _logger.Setup(x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()))
            .Callback(() =>
            {
                logCallCount++;
                if (logCallCount == 1) // First LogInformation call is LogBookingCancellationRefundBreakdown
                {
                    throw new InvalidOperationException("Test exception for LogBookingCancellationRefundBreakdown");
                }
            });

        // Act
        var result = await _sut.GetCancellationSummary(cancellationRequest, cancellationReason, null, false, false,
            CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        _bookingRepositoryMock.Verify(r => r.GetBooking(It.IsAny<BookingCancellationSummaryRequest>()), Times.Once);
        _bookingCancellationRefundSummaryService.Verify(
            r => r.GetCancellationRefundSummary(It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationRefundOption>(), It.IsAny<bool>()), Times.Once);
        _logger.Verify(x => x.Log(
            LogLevel.Warning,
            It.IsAny<EventId>(),
            It.IsAny<It.IsAnyType>(),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception, string>>()), Times.AtLeastOnce);
    }

    [Fact]
    public async Task
        GetCancellationSummary_WhenLogBookingCancellationRefundOptionThrowsException_ShouldReturnCancellationSummary()
    {
        // Arrange
        var cancellationRequest = new BookingCancellationSummaryRequest();
        var cancellationReason = new BookingCancellationReason();
        var bookingResponse = new BookingResponse();
        var logCallCount = 0;

        // Setup mocks
        _bookingRepositoryMock.Setup(r => r.GetBooking(It.IsAny<BookingCancellationSummaryRequest>()))
            .ReturnsAsync(bookingResponse);

        _bookingCancellationRefundBreakdownServiceMock
            .Setup(r => r.GetBookingCancellationRefundBreakdown(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationReason>(), It.IsAny<decimal>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BookingCancellationRefundBreakdown() { OriginalBookingValue = 1000, });

        _bookingCancellationRefundSummaryService
            .Setup(r => r.GetCancellationRefundSummary(It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationRefundOption>(), It.IsAny<bool>()))
            .ReturnsAsync(new CancellationSummaryResponse());

        // Setup logger to throw exception on second LogInformation call (LogBookingCancellationRefundOption)
        _logger.Setup(x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()))
            .Callback(() =>
            {
                logCallCount++;
                if (logCallCount == 2) // Second LogInformation call is LogBookingCancellationRefundOption
                {
                    throw new InvalidOperationException("Test exception for LogBookingCancellationRefundOption");
                }
            });

        // Act
        var result = await _sut.GetCancellationSummary(cancellationRequest, cancellationReason, null, false, false,
            CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        _bookingRepositoryMock.Verify(r => r.GetBooking(It.IsAny<BookingCancellationSummaryRequest>()), Times.Once);
        _bookingCancellationRefundSummaryService.Verify(
            r => r.GetCancellationRefundSummary(It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationRefundOption>(), It.IsAny<bool>()), Times.Once);
        _logger.Verify(x => x.Log(
            LogLevel.Warning,
            It.IsAny<EventId>(),
            It.IsAny<It.IsAnyType>(),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception, string>>()), Times.AtLeastOnce);
    }

    [Fact]
    public async Task GetCancellationSummary_ShouldReturnTradeCancellationSummary()
    {
        // Arrange
        var cancellationRequest = new BookingCancellationSummaryRequest();
        var cancellationReason = new BookingCancellationReason();
        var bookingResponse = new BookingResponse() { IsExternalAgency = true };

        // Setup mocks
        _bookingRepositoryMock.Setup(r => r.GetBooking(It.IsAny<BookingCancellationSummaryRequest>()))
            .ReturnsAsync(bookingResponse);

        _bookingCancellationRefundBreakdownServiceMock
            .Setup(r => r.GetBookingCancellationRefundBreakdown(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationReason>(), It.IsAny<decimal>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BookingCancellationRefundBreakdown() { OriginalBookingValue = 1000, });

        _bookingCancellationRefundSummaryService
            .Setup(r => r.GetCancellationRefundSummary(It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationRefundOption>(), It.IsAny<bool>()))
            .ReturnsAsync(new CancellationSummaryTradeResponse());

        // Act
        var result = await _sut.GetCancellationSummary(cancellationRequest, cancellationReason, null, false, false,
            CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeOfType(typeof(CancellationSummaryTradeResponse));
        _bookingRepositoryMock.Verify(r => r.GetBooking(It.IsAny<BookingCancellationSummaryRequest>()), Times.Once);
        _bookingCancellationRefundSummaryService.Verify(
            r => r.GetCancellationRefundSummary(It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationRefundOption>(), It.IsAny<bool>()), Times.Once);
    }

    [Fact]
    public async Task CancelBooking_WhenIsSharedServiceCall_True_ShouldNotCheckBookingBlock()
    {
        // Arrange
        decimal? feeToOverride = null;
        BookingCancellationReason reason = BookingCancellationReason.CustomerLed;
        CancellationToken cancellationToken = new CancellationToken();
        BookingResponse bookingResponse = new BookingResponse()
        {
            Currency = Currency.GBP,
            Guests =
            [
                new PersonWithDetails() { FirstName = "FirstName", LastName = "LastName", IsLead = true }
            ],
            LeadPassenger = new LeadPassenger() { Email = "email@email.com", },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route() { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                    ]
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 100, PaymentHistory = new List<PaymentHistoryItem>().ToArray()
            }
        };
        var customer = new Customer() { SourceId = "customerId" };
        _vouchersCustomerRepository
            .Setup(x => x.GetOrCreate(null,
                It.IsAny<CustomerDetails>()))
            .ReturnsAsync(customer);

        BookingCancellationRefundBreakdown refundBreakdown =
            new BookingCancellationRefundBreakdown() { OriginalBookingValue = 1000, };
        BookingCancellationRequest request = new BookingCancellationRequest
        {
            RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
            BookingBreakdownValidationHash = refundBreakdown.GetHashCode(),
        };
        _bookingCancellationRefundBreakdownServiceMock
            .Setup(x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, feeToOverride,
                cancellationToken))
            .ReturnsAsync(refundBreakdown);

        var bookingCancellationCreditRefundBreakdown = new BookingCancellationCreditRefundBreakdown();
        _bookingCancellationCalculateCreditRefundService
            .Setup(x => x.CalculateCreditRefund(bookingResponse, refundBreakdown, request.RefundOption.Value,
                cancellationToken))
            .ReturnsAsync(bookingCancellationCreditRefundBreakdown);
        var bookingRefundResponse = new BookingRefundExtendedResponse();
        _vouchersService
            .Setup(x => x.RefundCreditsAndUpdateBooking(bookingResponse, bookingCancellationCreditRefundBreakdown,
                request.Source,
                customer.SourceId, true))
            .ReturnsAsync(bookingRefundResponse);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(request))
            .ReturnsAsync(bookingResponse);
        CancellationResponse response = new CancellationResponse()
        {
            BookingReference = bookingResponse.BookingReference,
        };

        _bookingCancellationRefundOptionService.Setup(i => i.GetRefundOption(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(BookingCancellationRefundOption.OriginalPayment);
        _bookingBlockChecker.Setup(x => x.CheckIfBookingIsBlocked(It.IsAny<BookingResponse>())).ReturnsAsync(true);

        // Act & Assert
        await _sut.Invoking(s =>
                s.CancelBooking(request, BookingCancellationReason.CustomerLed, null, true, false, CancellationToken.None))
            .Should().NotThrowAsync();
    }

    [Fact]
    public async Task CancelBooking_WhenBookingIsNotBlocked_ShouldNotThrow()
    {
        // Arrange
        decimal? feeToOverride = null;
        BookingCancellationReason reason = BookingCancellationReason.CustomerLed;
        CancellationToken cancellationToken = new CancellationToken();
        BookingResponse bookingResponse = new BookingResponse()
        {
            Currency = Currency.GBP,
            Guests =
            [
                new PersonWithDetails() { FirstName = "FirstName", LastName = "LastName", IsLead = true }
            ],
            LeadPassenger = new LeadPassenger() { Email = "email@email.com", },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route() { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                    ]
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 100, PaymentHistory = new List<PaymentHistoryItem>().ToArray()
            }
        };
        var customer = new Customer() { SourceId = "customerId" };
        _vouchersCustomerRepository
            .Setup(x => x.GetOrCreate(null,
                It.IsAny<CustomerDetails>()))
            .ReturnsAsync(customer);

        BookingCancellationRefundBreakdown refundBreakdown =
            new BookingCancellationRefundBreakdown() { OriginalBookingValue = 1000, };
        BookingCancellationRequest request = new BookingCancellationRequest
        {
            RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
            BookingBreakdownValidationHash = refundBreakdown.GetHashCode(),
        };
        _bookingCancellationRefundBreakdownServiceMock
            .Setup(x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, feeToOverride,
                cancellationToken))
            .ReturnsAsync(refundBreakdown);

        var bookingCancellationCreditRefundBreakdown = new BookingCancellationCreditRefundBreakdown();
        _bookingCancellationCalculateCreditRefundService
            .Setup(x => x.CalculateCreditRefund(bookingResponse, refundBreakdown, request.RefundOption.Value,
                cancellationToken))
            .ReturnsAsync(bookingCancellationCreditRefundBreakdown);
        var bookingRefundResponse = new BookingRefundExtendedResponse();
        _vouchersService
            .Setup(x => x.RefundCreditsAndUpdateBooking(bookingResponse, bookingCancellationCreditRefundBreakdown,
                request.Source,
                customer.SourceId, true))
            .ReturnsAsync(bookingRefundResponse);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(request))
            .ReturnsAsync(bookingResponse);
        CancellationResponse response = new CancellationResponse()
        {
            BookingReference = bookingResponse.BookingReference,
        };

        _bookingCancellationRefundOptionService.Setup(i => i.GetRefundOption(It.IsAny<BookingResponse>(),
                It.IsAny<BookingCancellationRefundBreakdown>(),
                It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(BookingCancellationRefundOption.OriginalPayment);
        _bookingBlockChecker.Setup(x => x.CheckIfBookingIsBlocked(It.IsAny<BookingResponse>())).ReturnsAsync(false);

        // Act & Assert
        await _sut.Invoking(s =>
                s.CancelBooking(request, BookingCancellationReason.CustomerLed, null, false, false, CancellationToken.None))
            .Should().NotThrowAsync();
    }

    [Fact]
    public async Task CancelBooking_WhenBookingIsBlocked_ShouldThrowApiExceptionWithBookingBlockedCode()
    {
        // Arrange
        var request = new BookingCancellationRequest
        {
            RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
            BookingBreakdownValidationHash = 123
        };
        var bookingResponse = new BookingResponse();
        var refundBreakdown = new BookingCancellationRefundBreakdown() { OriginalBookingValue = 1000 };
        _bookingRepositoryMock.Setup(x => x.GetBooking(request)).ReturnsAsync(bookingResponse);
        _bookingCancellationRefundBreakdownServiceMock.Setup(x =>
            x.GetBookingCancellationRefundBreakdown(bookingResponse, It.IsAny<BookingCancellationReason>(),
                It.IsAny<decimal?>(), It.IsAny<CancellationToken>())).ReturnsAsync(refundBreakdown);
        _bookingCancellationRefundOptionService
            .Setup(x => x.GetRefundOption(bookingResponse, refundBreakdown, It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(BookingCancellationRefundOption.OriginalPayment);
        _bookingBlockChecker.Setup(x => x.CheckIfBookingIsBlocked(It.IsAny<BookingResponse>())).ReturnsAsync(true);

        // Act
        var ex = await Record.ExceptionAsync(() =>
            _sut.CancelBooking(request, BookingCancellationReason.CustomerLed, null, false, false, CancellationToken.None));

        // Assert
        ex.Should().BeOfType<ApiException>();
        var apiEx = ex as ApiException;
        apiEx!.Code.Should().Be(ApiExceptionCodes.BookingBlocked);
        apiEx.Message.Should().Contain("Booking is blocked due to failed cancellations.");

        _metricsService.Verify(m => m.IncrementCounter(
                CancellationMetricConstants.AttemptTotal,
                1,
                It.Is<KeyValuePair<string, object>[]>(labels => HasExpectedLabels(labels,
                    "reason", BookingCancellationReason.CustomerLed.ToString(),
                    "channel", "website"))),
            Times.Once);

        _metricsService.Verify(m => m.IncrementCounter(
                CancellationMetricConstants.FailureTotal,
                1,
                It.Is<KeyValuePair<string, object>[]>(labels => HasExpectedLabels(labels,
                    "reason", BookingCancellationReason.CustomerLed.ToString(),
                    "channel", "website",
                    "error_code", ApiExceptionCodes.BookingBlocked.ToString()))),
            Times.Once);

        _metricsService.Verify(m => m.IncrementCounter(
                CancellationMetricConstants.SuccessTotal,
                1,
                It.IsAny<KeyValuePair<string, object>[]>()),
            Times.Never);
    }

    [Fact]
    public async Task CancelBooking_WhenSuccessful_ShouldEmitAttemptAndSuccessMetrics()
    {
        decimal? feeToOverride = null;
        var reason = BookingCancellationReason.CustomerLed;
        var cancellationToken = CancellationToken.None;

        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            Currency = Currency.GBP,
            Guests =
            [
                new PersonWithDetails { FirstName = "First", LastName = "Last", IsLead = true }
            ],
            LeadPassenger = new LeadPassenger { Email = "email@email.com" },
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route { DepDate = DateTimeOffset.UtcNow.AddDays(100), Direction = Direction.Outbound }
                    ]
                }
            },
            PaymentInfo = new PriceInfo
            {
                TotalPrice = 100,
                PaymentHistory = new List<PaymentHistoryItem>().ToArray()
            }
        };

        var refundBreakdown = new BookingCancellationRefundBreakdown { OriginalBookingValue = 1000 };
        var request = new BookingCancellationRequest
        {
            RefundOption = BookingCancellationRequestRefundOption.OriginalPayment,
            BookingBreakdownValidationHash = refundBreakdown.GetHashCode()
        };

        _bookingRepositoryMock.Setup(x => x.GetBooking(request)).ReturnsAsync(bookingResponse);
        _bookingCancellationRefundBreakdownServiceMock
            .Setup(x => x.GetBookingCancellationRefundBreakdown(bookingResponse, reason, feeToOverride, cancellationToken))
            .ReturnsAsync(refundBreakdown);
        _bookingCancellationRefundOptionService
            .Setup(i => i.GetRefundOption(It.IsAny<BookingResponse>(), It.IsAny<BookingCancellationRefundBreakdown>(), It.IsAny<BookingCancellationReason>()))
            .ReturnsAsync(BookingCancellationRefundOption.OriginalPayment);

        await _sut.CancelBooking(request, reason, feeToOverride, false, false, cancellationToken);

        _metricsService.Verify(m => m.IncrementCounter(
                CancellationMetricConstants.AttemptTotal,
                1,
                It.Is<KeyValuePair<string, object>[]>(labels => HasExpectedLabels(labels,
                    "reason", reason.ToString(),
                    "channel", "website"))),
            Times.Once);

        _metricsService.Verify(m => m.IncrementCounter(
                CancellationMetricConstants.SuccessTotal,
                1,
                It.Is<KeyValuePair<string, object>[]>(labels => HasExpectedLabels(labels,
                    "reason", reason.ToString(),
                    "channel", "website",
                    "refund_option", BookingCancellationRequestRefundOption.OriginalPayment.ToString()))),
            Times.Once);

        _metricsService.Verify(m => m.IncrementCounter(
                CancellationMetricConstants.FailureTotal,
                1,
                It.IsAny<KeyValuePair<string, object>[]>()),
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
                string.Equals(label.Value?.ToString(), value, StringComparison.Ordinal));

            if (!hasLabel)
            {
                return false;
            }
        }

        return true;
    }
}


