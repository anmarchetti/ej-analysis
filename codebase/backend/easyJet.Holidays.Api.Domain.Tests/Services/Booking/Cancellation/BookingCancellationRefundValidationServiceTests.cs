using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Diagnostics.CodeAnalysis;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation;

[ExcludeFromCodeCoverage]
public class BookingCancellationRefundValidationServiceTests
{
    private readonly Mock<IAuthenticationService> _authenticationServiceMock;
    private readonly IOptions<ApiSettings> _apiSettingsOptionsMock;
    private readonly BookingCancellationRefundValidationService _service;
    private readonly Mock<ISettingsService> _settingsServiceMock;
    private readonly Mock<IReferenceDataService> _referenceDataService = new();

    public BookingCancellationRefundValidationServiceTests()
    {
        _authenticationServiceMock = new Mock<IAuthenticationService>();
        _settingsServiceMock = new();
        Mock<ILogger<BookingCancellationRefundValidationService>> loggerMock = new();
        _apiSettingsOptionsMock = Options.Create(new ApiSettings
        {
            Vouchers = new VoucherSettings
            {
                IsActive = true,
                BookingIsEligibleForBeingCredited = new BookingIsEligibleForBeingCreditedSettings
                {
                    IsActive = true,
                    BookingStatuses = ["ACTIVE"],
                    AllowFullyPaidToBeConverted = true,
                    AllowDepositOnlyToBeConverted = true,
                    AllowPartiallyPaidToBeConverted = true
                }
            }
        });

        _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(
            new CreditAndCashRefundSettings() { EnableOneTimeUseCredit = true });
        
        _service = new BookingCancellationRefundValidationService(
            _apiSettingsOptionsMock,
            _authenticationServiceMock.Object,
            _settingsServiceMock.Object,
            _referenceDataService.Object,
            loggerMock.Object
        );
    }

    // Test 1: Refund not enabled - Vouchers disabled
    [Fact]
    public async Task IsRefundEnabled_ShouldReturnFalse_WhenVouchersAreDisabled()
    {
        // Arrange
        _apiSettingsOptionsMock.Value.Vouchers.IsActive = false;

        var bookingResponse = new BookingResponse { BookingReference = "BR123" };

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, false, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.False(result);
    }

    // Test 2: Refund not enabled - Credit disabled
    [Fact]
    public async Task IsRefundEnabled_ShouldReturnFalse_WhenCreditIsDisabled()
    {
        // Arrange
        _apiSettingsOptionsMock.Value.Vouchers.BookingIsEligibleForBeingCredited.IsActive = false;

        var bookingResponse = new BookingResponse { BookingReference = "BR123" };

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, false, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.False(result);
    }

    // Test 3: Refund not enabled - Null booking response
    [Fact]
    public async Task IsRefundEnabled_ShouldReturnFalse_WhenBookingResponseIsNull()
    {
        // Arrange
        BookingResponse bookingResponse = null;

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, false, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.False(result);
    }

    // Test 4: Refund not enabled - Invalid booking status
    [Fact]
    public async Task IsRefundEnabled_ShouldReturnFalse_WhenBookingStatusIsInvalid()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123", BookingStatus = "CANCELLED", PaymentInfo = new PriceInfo()
        };

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, false, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.False(result);
    }

    // Test 5: Refund not enabled - No outbound route
    [Fact]
    public async Task IsRefundEnabled_ShouldReturnFalse_WhenNoOutboundRoute()
    {
        // Arrange
        var bookingResponse = new BookingResponse { BookingReference = "BR123", Package = new BookingPackage() };

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, false, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.False(result);
    }

    // Test 6: Refund not enabled - Invalid payment type
    [Fact]
    public async Task IsRefundEnabled_ShouldReturnFalse_WhenPaymentTypeInvalid()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123", PaymentInfo = new PriceInfo { BalanceDueAmount = 100 }
        };

        _apiSettingsOptionsMock.Value.Vouchers.BookingIsEligibleForBeingCredited.AllowFullyPaidToBeConverted = false;

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, false, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.False(result);
    }

    // Test 7: Refund enabled - Valid case
    [Fact]
    public async Task IsRefundEnabled_ShouldReturnTrue_WhenValid()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123",
            PaymentInfo = new PriceInfo { BalanceDueAmount = 0 },
            BookingStatus = "ACTIVE",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route { Direction = Direction.Outbound, DepDate = DateTimeOffset.UtcNow.AddDays(1) }
                    ]
                }
            }
        };

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, false, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.True(result);
    }

    // Test 8: IsCurrentUserLeadPassenger - Different email
    [Fact]
    public async Task IsCurrentUserLeadPassenger_ShouldReturnFalse_WhenEmailsDifferent()
    {
        // Arrange
        _authenticationServiceMock.Setup(service => service.GetCustomerEmail()).ReturnsAsync("customer@example.com");

        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123", CustomerDetails = new CustomerDetails { Email = "other@example.com" }
        };

        // Act
        var result = await _service.IsCurrentUserLeadPassenger(bookingResponse);

        // Assert
        Assert.False(result);
    }

    // Test 9: IsCurrentUserLeadPassenger - Same email
    [Fact]
    public async Task IsCurrentUserLeadPassenger_ShouldReturnTrue_WhenEmailsMatch()
    {
        // Arrange
        _authenticationServiceMock.Setup(service => service.GetCustomerEmail()).ReturnsAsync("customer@example.com");

        var bookingResponse = new BookingResponse
        {
            BookingReference = "BR123", CustomerDetails = new CustomerDetails { Email = "customer@example.com" }
        };

        // Act
        var result = await _service.IsCurrentUserLeadPassenger(bookingResponse);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task IsRefundEnabled_ShouldReturnFalse_WhenBookingDoesntContainsInformationAboutTransport()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            BookingReference = "REF123",
            PaymentInfo = new PriceInfo() { BalanceDueAmount = 100, TotalPrice = 200 },
            BookingStatus = "ACTIVE",
            Package = new BookingPackage()
        };

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, false, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task IsRefundEnabled_ShouldReturnFalse_WhenBookingDoesntContainsInformationAboutOutbound()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            BookingReference = "REF123",
            PaymentInfo = new PriceInfo() { BalanceDueAmount = 100, TotalPrice = 200 },
            BookingStatus = "ACTIVE",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route { Direction = Direction.Inbound, DepDate = DateTimeOffset.UtcNow.AddDays(1) }
                    ]
                }
            }
        };

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, false, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task IsRefundEnabled_ShouldReturnFalse_WhenOutboundFlightDepDateIsNull()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            BookingReference = "REF123",
            PaymentInfo = new PriceInfo() { BalanceDueAmount = 100, TotalPrice = 200 },
            BookingStatus = "ACTIVE",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route { Direction = Direction.Outbound }
                    ]
                }
            }
        };

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, false, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task IsRefundEnabled_ShouldReturnFalse_WhenOutboundFlightDepDateIsFromPastOrNow()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            BookingReference = "REF123",
            PaymentInfo = new PriceInfo() { BalanceDueAmount = 100, TotalPrice = 200 },
            BookingStatus = "ACTIVE",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route { Direction = Direction.Outbound, DepDate = DateTimeOffset.UtcNow }
                    ]
                }
            }
        };

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, false, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task IsRefundEnabled_ShouldReturnTrue_WhenOutboundFlightDepDateIsFromPastOrNowButIsSharedServiceCallAndEasyJetLed()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            BookingReference = "REF123",
            PaymentInfo = new PriceInfo() { BalanceDueAmount = 100, TotalPrice = 200 },
            BookingStatus = "ACTIVE",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route { Direction = Direction.Outbound, DepDate = DateTimeOffset.UtcNow }
                    ]
                }
            }
        };

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, true, BookingCancellationReason.EasyJetLed);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task IsRefundEnabled_ShouldReturnFalse_WhenOutboundFlightDepDateIsFromPastOrNowButIsSharedServiceCallAndCustomerLed()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            BookingReference = "REF123",
            PaymentInfo = new PriceInfo() { BalanceDueAmount = 100, TotalPrice = 200 },
            BookingStatus = "ACTIVE",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route { Direction = Direction.Outbound, DepDate = DateTimeOffset.UtcNow }
                    ]
                }
            }
        };

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, true, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task IsRefundEnabled_ShouldReturnFalse_WhenNotAllowFullyPaidToBeConvertedAndItIsFullyPaid()
    {
        // Arrange
        _apiSettingsOptionsMock.Value.Vouchers.BookingIsEligibleForBeingCredited.AllowFullyPaidToBeConverted = false;

        var bookingResponse = new BookingResponse
        {
            BookingReference = "REF123",
            PaymentInfo = new PriceInfo() { BalanceDueAmount = 0, TotalPrice = 200 },
            BookingStatus = "ACTIVE",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route { Direction = Direction.Outbound, DepDate = DateTimeOffset.UtcNow.AddDays(100) }
                    ]
                }
            }
        };

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, false, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task IsRefundEnabled_ShouldReturnFalse_WhenNotAllowDepositOnlyToBeConvertedAndOnlyDepositIsPaid()
    {
        // Arrange
        _apiSettingsOptionsMock.Value.Vouchers.BookingIsEligibleForBeingCredited.AllowDepositOnlyToBeConverted = false;

        var bookingResponse = new BookingResponse
        {
            BookingReference = "REF123",
            PaymentInfo = new PriceInfo()
            {
                BalanceDueAmount = 140, 
                TotalPrice = 200,
                DepositPrice = 60
            },
            BookingStatus = "ACTIVE",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route { Direction = Direction.Outbound, DepDate = DateTimeOffset.UtcNow.AddDays(100) }
                    ]
                }
            }
        };

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, false, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task IsRefundEnabled_ShouldReturnFalse_WhenNotAllowPartiallyPaidToBeConvertedAndItIsOnlyPartiallyPaid()
    {
        // Arrange
        _apiSettingsOptionsMock.Value.Vouchers.BookingIsEligibleForBeingCredited.AllowPartiallyPaidToBeConverted = false;

        var bookingResponse = new BookingResponse
        {
            BookingReference = "REF123",
            PaymentInfo = new PriceInfo()
            {
                BalanceDueAmount = 100,
                TotalPrice = 200,
                DepositPrice = 60
            },
            BookingStatus = "ACTIVE",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route { Direction = Direction.Outbound, DepDate = DateTimeOffset.UtcNow.AddDays(100) }
                    ]
                }
            }
        };

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, false, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task IsRefundEnabled_ShouldReturnFalse_OneTimeUseCreditIsNotEnabled()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            BookingReference = "REF123",
            PaymentInfo = new PriceInfo()
            {
                BalanceDueAmount = 100,
                TotalPrice = 200,
                DepositPrice = 60
            },
            BookingStatus = "ACTIVE",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route { Direction = Direction.Outbound, DepDate = DateTimeOffset.UtcNow.AddDays(100) }
                    ]
                }
            }
        };

        _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings()
        {
            EnableOneTimeUseCredit = false
        });

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, false, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.False(result);
    }
    
    [Fact]
    public async Task IsRefundEnabled_ShouldReturnFalse_IsInExemptionList()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            BookingReference = "REF123",
            PaymentInfo = new PriceInfo()
            {
                BalanceDueAmount = 100,
                TotalPrice = 200,
                DepositPrice = 60
            },
            BookingStatus = "ACTIVE",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route { Direction = Direction.Outbound, DepDate = DateTimeOffset.UtcNow.AddDays(100) }
                    ]
                }
            }
        };

        _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings()
        {
            ExemptionList = new[] { bookingResponse.BookingReference },
            EnableOneTimeUseCredit = true
        });

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, false, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task IsRefundEnabled_ShouldReturnFalse_WhenBookingStatusIsInvalidAndIsSharedServiceCall()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            BookingReference = "REF123",
            PaymentInfo = new PriceInfo()
            {
                BalanceDueAmount = 100,
                TotalPrice = 200,
                DepositPrice = 60
            },
            BookingStatus = "CANCELLED",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route { Direction = Direction.Outbound, DepDate = DateTimeOffset.UtcNow.AddDays(100) }
                    ]
                }
            }
        };

        _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings()
        {
            EnableOneTimeUseCredit = true
        });

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, true, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task IsRefundEnabled_ShouldReturnTrue_WhenBookingDateIsInsideCancellationRestrictionHoursButIsSharedServiceCall()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            BookingReference = "REF123",
            PaymentInfo = new PriceInfo()
            {
                BalanceDueAmount = 100,
                TotalPrice = 200,
                DepositPrice = 60
            },
            BookingStatus = "ACTIVE",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route { Direction = Direction.Outbound, DepDate = DateTimeOffset.UtcNow.AddDays(100) }
                    ]
                }
            }
        };

        _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings()
        {
            EnableOneTimeUseCredit = true
        });

        _referenceDataService.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(new AmendBookingSetting()
        {
            CancellationRestrictionHours = 24
        });

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, true, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task IsRefundEnabled_ShouldReturnFalse_WhenBookingDateIsInsideCancellationRestrictionHoursAndIsNotSharedServiceCall()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            BookingReference = "REF123",
            PaymentInfo = new PriceInfo()
            {
                BalanceDueAmount = 100,
                TotalPrice = 200,
                DepositPrice = 60
            },
            BookingStatus = "CANCELLED",
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route { Direction = Direction.Outbound, DepDate = DateTimeOffset.UtcNow.AddDays(100) }
                    ]
                }
            }
        };

        _settingsServiceMock.Setup(x => x.GetCancelCreditSettings()).ReturnsAsync(new CreditAndCashRefundSettings()
        {
            EnableOneTimeUseCredit = true
        });

        _referenceDataService.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(new AmendBookingSetting()
        {
            CancellationRestrictionHours = 24
        });

        // Act
        var result = await _service.IsRefundEnabled(bookingResponse, false, BookingCancellationReason.CustomerLed);

        // Assert
        Assert.False(result);
    }
}