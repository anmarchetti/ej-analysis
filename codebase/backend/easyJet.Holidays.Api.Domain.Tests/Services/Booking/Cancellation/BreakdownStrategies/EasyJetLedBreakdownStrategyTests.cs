using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.BreakdownStrategies;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation.BreakdownStrategies;

public class EasyJetLedBreakdownStrategyTests : BaseBreakdownStrategyTests
{
    private readonly EasyJetLedBreakdownStrategy _testee;
    private readonly Mock<IInfoCancellationService> _infoCancellationServiceMock = new Mock<IInfoCancellationService>();

    public EasyJetLedBreakdownStrategyTests()
    {
        Mock<IFeeCalculator> feeCalculatorMock = new ();
        Mock<IOptions<AtcomSettings>> atcomSettings = new();
        atcomSettings.SetupGet(x => x.Value).Returns(new AtcomSettings()
        {
            BookingStatus = new BookingStatus() { Booking = "BOOKING", Canceled = "CANCELED" }
        });

        _testee = new EasyJetLedBreakdownStrategy(_infoCancellationServiceMock.Object, feeCalculatorMock.Object, atcomSettings.Object);
    }


    [Theory]
    [InlineData(1000, 1)]
    [InlineData(120, 2)]
    [InlineData(1000, 4)]
    public async Task
        GetCancellationRefundBreakdown_WhenMoreThen60DaysBeforeDeparture_ShouldReturnFullAmountFeeWithOneTimeCredit(
            decimal paymentAmount, int guestsAmount)
    {
        // Arrange
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(61).AddHours(1),
                            Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory = new List<PaymentHistoryItem>() { CashPayment(paymentAmount) }.ToArray()
            },
            Guests = new List<PersonWithDetails>()
        };

        for (int i = 0; i < guestsAmount; i++)
        {
            request.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        decimal depositAmount = guestsAmount * 60M;
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = paymentAmount,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = paymentAmount,
            CashRefundAmount = paymentAmount,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 61,
            OriginalBookingValue = 1000,
        };
        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = depositAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(request))
            .ReturnsAsync(infoCancellationResponse);

        // Act
#if DEBUG
        Log(request, response, this);
#endif
        var result = await _testee.GetCancellationRefundBreakdown(request, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(response);
    }

    [Theory]
    [InlineData(15, 15, 970, 1)]
    [InlineData(25, 25, 10, 1)]
    [InlineData(30, 30, 0, 1)]
    [InlineData(90, 30, 0, 2)]
    [InlineData(90, 30, 120, 2)]
    [InlineData(90, 30, 240, 2)]
    [InlineData(290, 30, 240, 2)]
    [InlineData(120, 120, 240, 4)]
    [InlineData(120, 120, 480, 4)]
    [InlineData(240, 240, 480, 4)]
    public async Task
        GetCancellationRefundBreakdown_WhenMoreThen60DaysBeforeDepartureAndTwoOneCreditWereUsed_ShouldRetainCalculateProperBreakdown(
            decimal firstOneUseTimeCreditPayment, decimal secondOneTimeUseCreditPayment,
            decimal nonOneTimeUseCreditPayment,
            int guestsAmount)
    {
        // Arrange
        var oneTimeCreditPayment = firstOneUseTimeCreditPayment + secondOneTimeUseCreditPayment;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(61).AddHours(1),
                            Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory = new List<PaymentHistoryItem>()
                {
                    CashPayment(nonOneTimeUseCreditPayment),
                    OneTimeUseCreditPayment(firstOneUseTimeCreditPayment),
                    OneTimeUseCreditPayment(secondOneTimeUseCreditPayment)
                }.ToArray()
            },
            Guests = new List<PersonWithDetails>()
        };

        for (int i = 0; i < guestsAmount; i++)
        {
            request.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        decimal paid = request.PaymentInfo.PaymentHistory.Sum(x => x.Amount);

        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = oneTimeCreditPayment,
            TotalRefundAmount = paid,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = paid - oneTimeCreditPayment,
            CashRefundAmount = paid - oneTimeCreditPayment,
            CreditRefundAmount = oneTimeCreditPayment,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 61,
            OneTimeUseCreditTotalPaidAmount = oneTimeCreditPayment,
            OriginalBookingValue = 1000,
        };
        CancellationToken cancellationToken = new CancellationToken();

        // Act
#if DEBUG
        Log(request, response, this);
#endif
        var result = await _testee.GetCancellationRefundBreakdown(request, null, cancellationToken);


        // Assert
        result.Should().BeEquivalentTo(response);
    }

    [Theory]
    [InlineData(1000, 0, 1, 59)]
    [InlineData(120, 0, 2, 61)]
    [InlineData(1000, 0, 4, 27)]
    [InlineData(1000, 0, 4, 28)]
    [InlineData(1000, 0, 4, 29)]
    [InlineData(1000, 0, 4, 1)]
    [InlineData(1000, 0, 4, 14)]
    [InlineData(1000, 0, 4, 13)]
    [InlineData(1000, 0, 4, 15)]
    [InlineData(1000, 0, 4, 16)]
    [InlineData(800, 200, 1, 59)]
    [InlineData(0, 120, 2, 61)]
    [InlineData(600, 400, 4, 27)]
    [InlineData(900, 100, 4, 28)]
    [InlineData(760, 240, 4, 29)]
    [InlineData(700, 300, 4, 1)]
    [InlineData(950, 50, 4, 14)]
    [InlineData(940, 60, 4, 13)]
    [InlineData(500, 500, 4, 15)]
    [InlineData(100, 900, 4, 16)]
    public async Task
        GetCancellationRefundBreakdown_WhenLessThen60DaysBeforeDeparture_ShouldReturnFullAmountFeeWithOneTimeCredit(
            decimal paymentAmount, decimal oneTimeUseCreditPayment, int guestsAmount, int daysBeforeDeparture)
    {
        // Arrange
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(daysBeforeDeparture).AddHours(1),
                            Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>()
                    {
                        CashPayment(paymentAmount), OneTimeUseCreditPayment(oneTimeUseCreditPayment),
                    }.ToArray()
            },
            Guests = new List<PersonWithDetails>()
        };

        for (int i = 0; i < guestsAmount; i++)
        {
            request.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        decimal depositAmount = guestsAmount * 60M;
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = oneTimeUseCreditPayment,
            TotalRefundAmount = paymentAmount + oneTimeUseCreditPayment,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = paymentAmount,
            CashRefundAmount = paymentAmount,
            CreditRefundAmount = oneTimeUseCreditPayment,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = daysBeforeDeparture,
            OneTimeUseCreditTotalPaidAmount = oneTimeUseCreditPayment,
            OriginalBookingValue = 1000,
        };
        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = depositAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(request))
            .ReturnsAsync(infoCancellationResponse);

        // Act
#if DEBUG
        Log(request, response, this);
#endif
        var result = await _testee.GetCancellationRefundBreakdown(request, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(response);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_WhenBookingIsATradeBooking_ShouldReturnFullAmount()
    {
        // Arrange
        var daysBeforeDeparture = 66;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(daysBeforeDeparture).AddHours(1),
                            Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 2000, PaymentReceived = 1000, PaymentHistory = [] //TradeBookings do not have a payment history
            },
            Guests = new List<PersonWithDetails>(),
            AgentData = new BookingAgentData() { AgentName = "TestAgentName", AgentNumber = "TestAgentNumber" },
            IsExternalAgency = true
        };

        for (int i = 0; i < 2; i++)
        {
            request.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        decimal depositAmount = request.Guests.Count * 60M;
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = request.PaymentInfo.PaymentReceived,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = request.PaymentInfo.PaymentReceived,
            CashRefundAmount = request.PaymentInfo.PaymentReceived,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = daysBeforeDeparture,
            OneTimeUseCreditTotalPaidAmount = 0,
            OriginalBookingValue = 1000,
        };
        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = depositAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(request))
            .ReturnsAsync(infoCancellationResponse);

        // Act
#if DEBUG
        Log(request, response, this);
#endif
        var result = await _testee.GetCancellationRefundBreakdown(request, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(response);
    }
    
    [Fact]
    public async Task GetCancellationRefundBreakdown_WhenBookingIsATradeBookingAndNoPaymentInfo_ShouldReturn0()
    {
        // Arrange
        var daysBeforeDeparture = 66;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new()
                {
                    Routes =
                    [
                        new ()
                        {
                            DepDate = DateTime.UtcNow.AddDays(daysBeforeDeparture).AddHours(1),
                            Direction = Direction.Outbound
                        }
                    ],
                }
            },
            Guests = new List<PersonWithDetails>(),
            AgentData = new BookingAgentData() { AgentName = "TestAgentName", AgentNumber = "TestAgentNumber" },
            IsExternalAgency = true
        };

        for (int i = 0; i < 2; i++)
        {
            request.Guests.Add(
                new PersonWithDetails()
                {
                    Age = 20 + i,
                    FirstName = $"TestFirstName{i}",
                    LastName = $"TestLastName{i}",
                    Type = PersonType.Adult
                });
        }

        decimal depositAmount = request.Guests.Count * 60M;
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            CashRefundAmount = 0,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = daysBeforeDeparture,
            OneTimeUseCreditTotalPaidAmount = 0,
            OriginalBookingValue = 1000,
        };
        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = depositAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(request))
            .ReturnsAsync(infoCancellationResponse);

        // Act
#if DEBUG
        Log(request, response, this);
#endif
        var result = await _testee.GetCancellationRefundBreakdown(request, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(response);
    }
}