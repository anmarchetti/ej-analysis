using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.Memos;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.Memos.RepCodeStrategies;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation.Memos;

public class BookingCancellationRepCodeServiceTests
{
    [Theory]
    [InlineData(BookingCancellationReason.CustomerLed, 24, 250.0, 0.0, "REP7")]
    [InlineData(BookingCancellationReason.EasyJetLed, 25, 250.0, 0.0, "REP3")]
    [InlineData(BookingCancellationReason.CustomerLed, 26, 249.0, 1.0, "REP6")]
    [InlineData(BookingCancellationReason.EasyJetLed, 23, 249.0, 1.0, "REP4")]
    [InlineData(BookingCancellationReason.CustomerLed, 22, 1.0, 249.0, "REP6")]
    [InlineData(BookingCancellationReason.EasyJetLed, 21, 1.0, 249.0, "REP4")]
    [InlineData(BookingCancellationReason.CustomerLed, 61, 0.0, 1.0, "REP5")]
    [InlineData(BookingCancellationReason.EasyJetLed, 59, 0.0, 1.0, "REP5")]
    [InlineData(BookingCancellationReason.TradeLed, 58, 0.0, 1.0, "REP5")]
    [InlineData(BookingCancellationReason.TradeLed, 58, null, null, "REP5")]
    [InlineData(BookingCancellationReason.CustomerLed, 22, 0.0, 250.0, "REP5")]
    [InlineData(BookingCancellationReason.EasyJetLed, 21, 0.0, 250.0, "REP5")]
    [InlineData(BookingCancellationReason.TradeLed, 20, 0.0, 250.0, "REP5")]
    [InlineData(BookingCancellationReason.TradeLed, 20, null, null, "REP5")]
    [InlineData(BookingCancellationReason.CustomerLed, 61, 0.0, 250.0, "REP5")]
    [InlineData(BookingCancellationReason.EasyJetLed, 59, 0.0, 250.0, "REP5")]
    [InlineData(BookingCancellationReason.TradeLed, 28, 0.0, 250.0, "REP5")]
    [InlineData(BookingCancellationReason.TradeLed, 28, null, null, "REP5")]
    [InlineData(BookingCancellationReason.CustomerLed, 28, 0.0, 1000.0, "REP5")]
    [InlineData(BookingCancellationReason.EasyJetLed, 28, 0.0, 1000.0, "REP5")]
    [InlineData(BookingCancellationReason.TradeLed, 28, 0.0, 1000.0, "REP5")]
    [InlineData(BookingCancellationReason.CustomerLed, 28, 250.0, 1.0, "REP4")]
    [InlineData(BookingCancellationReason.EasyJetLed, 28, 250.0, 1.0, "REP4")]
    [InlineData(BookingCancellationReason.CustomerLed, 28, 1.0, 250.0, "REP4")]
    [InlineData(BookingCancellationReason.EasyJetLed, 28, 1.0, 250.0, "REP4")]
    [InlineData(BookingCancellationReason.CustomerLed, 28, 249.0, 2.0, "REP4")]
    [InlineData(BookingCancellationReason.EasyJetLed, 28, 249.0, 2.0, "REP4")]
    [InlineData(BookingCancellationReason.CustomerLed, 28, 2.0, 249.0, "REP4")]
    [InlineData(BookingCancellationReason.EasyJetLed, 28, 2.0, 249.0, "REP4")]
    [InlineData(BookingCancellationReason.CustomerLed, 28, 1000.0, 0.0, "REP3")]
    [InlineData(BookingCancellationReason.EasyJetLed, 28, 1000.0, 0.0, "REP3")]
    [InlineData(BookingCancellationReason.CustomerLed, 28, 251.0, 0.0, "REP3")]
    [InlineData(BookingCancellationReason.EasyJetLed, 28, 251.0, 0.0, "REP3")]
    [InlineData(BookingCancellationReason.CustomerLed, 28, 249.0, 0.0, "REP3")]
    [InlineData(BookingCancellationReason.EasyJetLed, 28, 249.0, 0.0, "REP3")]
    public void GetRepCode_ShouldReturnCorrectRepCode_WhenSingleStrategyApplies(
        BookingCancellationReason bookingCancellationReason, double daysBeforeDeparture, double? creditRefundAmount,
        double? cashRefundAmount, string expectedRepCode)
    {
        // Arrange
        var service = new BookingCancellationRepCodeService(BookingCancellationRepCodeStrategies,
            Mock.Of<ILogger<BookingCancellationRepCodeService>>());

        // Act
        var repCode = service.GetRepCode(
            bookingCancellationReason,
            daysBeforeDeparture,
            (decimal?)creditRefundAmount,
            (decimal?)cashRefundAmount);

        // Assert
        repCode.Should().Be(expectedRepCode);
    }

    private static List<IBookingCancellationRepCodeStrategy> BookingCancellationRepCodeStrategies
    {
        get
        {
            var strategies = new List<IBookingCancellationRepCodeStrategy>
            {
                new Rep3CodeStrategy(),
                new Rep4CodeStrategy(),
                new Rep5CodeStrategy(),
                new Rep6CodeStrategy(),
                new Rep7CodeStrategy()
            };
            return strategies;
        }
    }

    [Fact]
    public void GetRepCode_ShouldReturnNullRepoCode_WhenNoStrategyApplies()
    {
        // Arrange
        var service = new BookingCancellationRepCodeService(new List<IBookingCancellationRepCodeStrategy>(),
            Mock.Of<ILogger<BookingCancellationRepCodeService>>());

        // Act
        var repCode = service.GetRepCode(
            BookingCancellationReason.CustomerLed,
            61,
            250m,
            750m);
        
        // Assert
        repCode.Should().BeNull();
    }

    [Fact]
    public void GetRepCode_ShouldReturnNullRepoCode_WhenCashAndCredit0AndNoStrategyApplies()
    {
        // Arrange
        var service = new BookingCancellationRepCodeService(BookingCancellationRepCodeStrategies,
            Mock.Of<ILogger<BookingCancellationRepCodeService>>());

        // Act
        var repCode = service.GetRepCode(
            BookingCancellationReason.CustomerLed,
            61,
            0,
            0);

        // Assert
        repCode.Should().BeNull();
    }

    [Fact]
    public void GetRepCode_ShouldNotReturnRep7_WhenDestinationRulesApplied()
    {
        var service = new BookingCancellationRepCodeService(BookingCancellationRepCodeStrategies,
            Mock.Of<ILogger<BookingCancellationRepCodeService>>());

        var repCode = service.GetRepCode(
            BookingCancellationReason.CustomerLed,
            24,  
            250m, 
            0m,
            isDestinationRulesApplied: true);

        repCode.Should().NotBe("REP7");
        repCode.Should().Be("REP3"); 
    }

    [Fact]
    public void GetRepCode_ShouldReturnRep7_WhenDestinationRulesNotApplied()
    {
        var service = new BookingCancellationRepCodeService(BookingCancellationRepCodeStrategies,
            Mock.Of<ILogger<BookingCancellationRepCodeService>>());

        var repCode = service.GetRepCode(
            BookingCancellationReason.CustomerLed,
            24, 
            250m, 
            0m,
            isDestinationRulesApplied: false);

        repCode.Should().Be("REP7");
    }

    [Fact]
    public void GetRepCode_ShouldReturnRep7ByDefault_WhenDestinationRulesParameterOmitted()
    {
        var service = new BookingCancellationRepCodeService(BookingCancellationRepCodeStrategies,
            Mock.Of<ILogger<BookingCancellationRepCodeService>>());

        var repCode = service.GetRepCode(
            BookingCancellationReason.CustomerLed,
            24,  
            250m, 
            0m);
        
        repCode.Should().Be("REP7");
    }
}