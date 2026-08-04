using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.BreakdownStrategies;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation.BreakdownStrategies;

public class FeeCalculatorTests: BaseCancellationTests
{
    private readonly FeeCalculator _testee;
    
    public FeeCalculatorTests()
    {
        var mockOptions = new Mock<IOptions<ApiSettings>>();
        mockOptions.Setup(o => o.Value).Returns(new ApiSettings()
        {
            Vouchers = new VoucherSettings()
            {
                DefaultDepositPerPerson = 60
            }
        });
        
        _testee = new FeeCalculator(mockOptions.Object);
    }
    
    [Theory]
    [InlineData(27, 2, 0, 1000, 120)]
    [InlineData(28, 2, 0, 2000, 120)]
    [InlineData(28, 4, 0, 2000, 240)]
    [InlineData(61, 2, 0, 1000, 120)]
    [InlineData(61, 4, 0, 2000, 240)]
    [InlineData(100, 2, 0, 1000, 120)]
    [InlineData(100, 4, 0, 2000, 240)]
    [InlineData(100, 2, 1, 1000, 60)]
    [InlineData(100, 4, 2, 2000, 120)]
    [InlineData(100, 4, 1, 2000, 180)]
    public void CalculateFee_ShouldReturn60PerPassenger_WhenDaysBeforeDepartureGreaterThan27(
        int daysBeforeDeparture, int guestAmount, int numberOfInfants, decimal totalPrice, decimal expectedFee)
    {
        // Arrange
        BookingResponse bookingResponse = CreateBookingResponse(daysBeforeDeparture, guestAmount, totalPrice, numberOfInfants);

        // Act
        var result = _testee.CalculateFee(bookingResponse);

        // Assert
        result.Should().Be(expectedFee); 
    }

    [Theory]
    [InlineData(26, 2, 1000, 750)]
    [InlineData(20, 2, 1000, 750)]
    [InlineData(20, 4, 1000, 750)]
    [InlineData(20, 4, 2000, 1500)]
    public void CalculateFee_ShouldReturn75PercentOfBookingValue_WhenDaysBeforeDepartureBetween20And27(
        int daysBeforeDeparture, int guestAmount, decimal totalPrice, decimal expectedFee)
    {
        // Arrange
        var bookingResponse = CreateBookingResponse(daysBeforeDeparture, guestAmount, totalPrice);

        // Act
        var result = _testee.CalculateFee(bookingResponse);

        // Assert
        result.Should().Be(expectedFee);
    }

    [Theory]
    [InlineData(10, 2, 1000, 1000)]
    [InlineData(19, 2, 1000, 1000)]
    [InlineData(19, 4, 1000, 1000)]
    [InlineData(19, 4, 2000, 2000)]
    public void CalculateFee_ShouldReturnFullBookingValue_WhenDaysBeforeDepartureLessThanOrEqualTo20(
        int daysBeforeDeparture, int guestAmount, decimal totalPrice, decimal expectedFee)
    {
        // Arrange
        var bookingResponse = CreateBookingResponse(daysBeforeDeparture, guestAmount, totalPrice);

        // Act
        var result = _testee.CalculateFee(bookingResponse);

        // Assert
        result.Should().Be(expectedFee);
    }
    
    [Fact]
    public void CalculateFee_ShouldReturn0_WhenPaymentInfoTotalIsNull()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            Currency = new Currency { Code = "GBP" },
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route
                        {
                            DepDate = DateTime.UtcNow.AddDays(11).AddHours(1),
                            Direction = Direction.Outbound
                        }
                    ]
                }
            },
            PaymentInfo = new PriceInfo
            {
                PaymentHistory = new List<PaymentHistoryItem>().ToArray()
            },
            Guests = new List<PersonWithDetails>(),
            IsExternalAgency = true
        };
        for (int i = 1; i <= 4; i++)
        {
            bookingResponse.Guests.Add(new PersonWithDetails
            {
                Age = 30 + i, FirstName = "John{i}", LastName = "Doe{i}", Type = PersonType.Adult
            });
        }

        // Act
        var result = _testee.CalculateFee(bookingResponse);

        // Assert
        result.Should().Be(0);
    }
    
    [Fact]
    public void CalculateFee_ShouldReturn0_WhenPaymentInfoIsNull()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            Currency = new Currency { Code = "GBP" },
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route
                        {
                            DepDate = DateTime.UtcNow.AddDays(11).AddHours(1),
                            Direction = Direction.Outbound
                        }
                    ]
                }
            },
            PaymentInfo = null,
            Guests = new List<PersonWithDetails>(),
            IsExternalAgency = true
        };
        for (int i = 1; i <= 4; i++)
        {
            bookingResponse.Guests.Add(new PersonWithDetails
            {
                Age = 30 + i, FirstName = "John{i}", LastName = "Doe{i}", Type = PersonType.Adult
            });
        }

        // Act
        var result = _testee.CalculateFee(bookingResponse);

        // Assert
        result.Should().Be(0);
    }

    private static BookingResponse CreateBookingResponse(int daysBeforeDeparture, int guestAmount, decimal totalPrice, int numberOfInfants = 0)
    {
        var booking = new BookingResponse
        {
            Currency = new Currency { Code = "GBP" },
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route
                        {
                            DepDate = DateTime.UtcNow.AddDays(daysBeforeDeparture).AddHours(1),
                            Direction = Direction.Outbound
                        }
                    ]
                }
            },
            PaymentInfo = new PriceInfo
            {
                TotalPrice = totalPrice, 
                PaymentHistory = new List<PaymentHistoryItem>().ToArray()
            },
            Guests = new List<PersonWithDetails>(),
            IsExternalAgency = true
        };
        for (int i = 1; i <= guestAmount; i++)
        {
            booking.Guests.Add(new PersonWithDetails
            {
                Age = 30 + i, FirstName = "John{i}", LastName = "Doe{i}", Type = i <= numberOfInfants ? PersonType.Infant : PersonType.Adult
            });
        }

        return booking;
    }
}