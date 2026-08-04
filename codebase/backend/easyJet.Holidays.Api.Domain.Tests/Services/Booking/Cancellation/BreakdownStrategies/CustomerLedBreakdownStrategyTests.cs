using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.BreakdownStrategies;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation.BreakdownStrategies;

public class CustomerLedBreakdownStrategyTests : BaseBreakdownStrategyTests
{
    private readonly CustomerLedBreakdownStrategy _testee;
    private readonly Mock<IInfoCancellationService> _infoCancellationServiceMock = new Mock<IInfoCancellationService>();
    private readonly Mock<ISettingsService> _settingsServiceMock = new Mock<ISettingsService>();

    public CustomerLedBreakdownStrategyTests()
    {
        Mock<IBookingCancellationCreditRulesEngine> bookingCancellationRulesEngineMock = new();

        _settingsServiceMock.Setup(x => x.GetCancelCreditSettings())
            .ReturnsAsync(new CreditAndCashRefundSettings()
            {
                ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture = 60,
                ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture = 27,
                EnableAmendmentFee = true,
                EnableOneTimeUseCredit = true
            });
        Mock<IFeeCalculator> feeCalculatorMock = new ();
        
        _testee = new CustomerLedBreakdownStrategy(_infoCancellationServiceMock.Object, _settingsServiceMock.Object,
            bookingCancellationRulesEngineMock.Object, feeCalculatorMock.Object);
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
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { CashPayment(paymentAmount) }.ToArray()
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
            OneTimeUseCreditRefundAmount = depositAmount,
            TotalRefundAmount = paymentAmount,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = paymentAmount - depositAmount,
            CashRefundAmount = paymentAmount - depositAmount,
            CreditRefundAmount = depositAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 61,
            OriginalBookingValue = paymentAmount,
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Theory]
    [InlineData(1000, 1, 25)]
    [InlineData(120, 2, 0)]
    [InlineData(1000, 4, 120)]
    public async Task
    GetCancellationRefundBreakdown_WhenMoreThen60DaysBeforeDepartureAndAmendmentFee_ShouldReturnFullAmountFeeWithOneTimeCredit(
        decimal paymentAmount, int guestsAmount, int amendmentFeeAmount)
    {
        // Arrange
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
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
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory = new List<PaymentHistoryItem>() { CashPayment(paymentAmount) }.ToArray(),
                AmendmentFeesItems =
                [
                    new FeeItem
                    {
                        Amount = amendmentFeeAmount
                    }
                ]
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
            AmendmentFeeAmount = amendmentFeeAmount,
            OneTimeUseCreditRefundAmount = depositAmount,
            TotalRefundAmount = paymentAmount - amendmentFeeAmount,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = paymentAmount - depositAmount - amendmentFeeAmount,
            CashRefundAmount = paymentAmount - depositAmount - amendmentFeeAmount,
            CreditRefundAmount = depositAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 61,
            OriginalBookingValue = paymentAmount,
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_WhenMoreThen60DaysBeforeDepartureAndAmendmentFeeMoreFeeThanPaid_ShouldReturnFullAmountFeeWithOneTimeCredit()
    {
        // Arrange
        var amendmentFeeAmount = 150;
        var paymentAmount = 120;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
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
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory = new List<PaymentHistoryItem>() { CashPayment(paymentAmount) }.ToArray(),
                AmendmentFeesItems =
                [
                    new FeeItem
                    {
                        Amount = amendmentFeeAmount
                    }
                ]
            },
            Guests = new List<PersonWithDetails>()
        };

        var guestsAmount = 2;
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

        decimal depositAmount = guestsAmount * 60M; //120
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            AmendmentFeeAmount = 0,
            OneTimeUseCreditRefundAmount = 120,
            TotalRefundAmount = 120,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            CashRefundAmount = 0,
            CreditRefundAmount = 120,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 61,
            OriginalBookingValue = paymentAmount,
            OriginalCancelFeeAmount = depositAmount,
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_WhenMoreThen60DaysBeforeDepartureAmendmentFeeIsDisabled_ShouldReturnFullAmountFeeWithOneTimeCredit()
    {
        // Arrange
        var amendmentFeeAmount = 150;
        var paymentAmount = 220;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
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
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory = new List<PaymentHistoryItem>() { CashPayment(paymentAmount) }.ToArray(),
                AmendmentFeesItems =
                [
                    new FeeItem
                    {
                        Amount = amendmentFeeAmount
                    }
                ]
            },
            Guests = new List<PersonWithDetails>()
        };

        var guestsAmount = 2;
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

        decimal depositAmount = guestsAmount * 60M; //120
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditKeptAmount = 0,
            AmendmentFeeAmount = 0,
            OneTimeUseCreditRefundAmount = 120,
            TotalRefundAmount = 220,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 100,
            CashRefundAmount = 100,
            CreditRefundAmount = 120,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 61,
            OriginalBookingValue = paymentAmount,
            OriginalCancelFeeAmount = depositAmount,
        };
        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = depositAmount }
        };
        _infoCancellationServiceMock
            .Setup(x => x.GetInfoCancellationAsync(request))
            .ReturnsAsync(infoCancellationResponse);

        _settingsServiceMock.Setup(x => x.GetCancelCreditSettings())
            .ReturnsAsync(new CreditAndCashRefundSettings()
            {
                ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture = 60,
                ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture = 27,
                EnableAmendmentFee = false,
                EnableOneTimeUseCredit = true
            });

        // Act
#if DEBUG
        Log(request, response, this);
#endif
        var result = await _testee.GetCancellationRefundBreakdown(request, null, cancellationToken);

        // Assert
        result.Should().BeEquivalentTo(response);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Theory]
    [InlineData(59, 1000, 2)]
    [InlineData(29, 1000, 2)]
    [InlineData(59, 120, 2)]
    [InlineData(29, 120, 2)]
    [InlineData(59, 60, 1)]
    [InlineData(29, 60, 1)]
    public async Task
        GetCancellationRefundBreakdown_WhenMoreThen28DaysButLessThenOrEqual60BeforeDeparture_ShouldReturnTotalAmountMinus60PerPassenger(
            int days, decimal paymentAmount, int guestsAmount)
    {
        // Arrange
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(days).AddHours(1), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { CashPayment(paymentAmount) }.ToArray()
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

        decimal fee = request.Guests.Count * 60M;
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = fee,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = paymentAmount - fee,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = paymentAmount - fee,
            CashRefundAmount = paymentAmount - fee,
            CreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = days,
            OriginalBookingValue = 1000,
        };
        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = fee, }
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Theory]
    [InlineData(75, 75)]
    [InlineData(150, 150)]
    [InlineData(500, 500)]
    [InlineData(1000, 880)]
    [InlineData(1500, 880)]
    public async Task GetCancellationRefundBreakdown_WhenMoreThen28DaysButLessThenOrEqual60BeforeDepartureWithAmendmentFee_ShouldReturnTotalAmountMinus60PerPassengerAndAmendmentFee(decimal amendmentFeeAmount, decimal expectedAmendmentFeeAmount)
    {
        // Arrange
        var days = 45;
        var cashAmount = 1000;
        var guestsAmount = 2;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(days).AddHours(1), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { CashPayment(cashAmount) }.ToArray(),
                AmendmentFeesItems = new FeeItem[]
                {
                    new FeeItem()
                    {
                        Amount = amendmentFeeAmount
                    }
                }
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

        decimal fee = request.Guests.Count * 60M;
        var refundAmount = Math.Max(cashAmount - fee - amendmentFeeAmount, 0);
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = fee,
            AmendmentFeeAmount = expectedAmendmentFeeAmount,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = refundAmount,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = refundAmount,
            CashRefundAmount = refundAmount,
            CreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = days,
            OriginalBookingValue = 1000,
        };
        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = fee, }
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Theory]
    [InlineData(1000, 110, 2)]
    [InlineData(1000, 120, 2)]
    [InlineData(1000, 130, 2)]
    [InlineData(120, 110, 2)]
    [InlineData(120, 120, 2)]
    [InlineData(60, 50, 1)]
    [InlineData(60, 60, 1)]
    [InlineData(1000, 240, 2)]
    [InlineData(240, 240, 2)]
    [InlineData(480, 240, 2)]
    [InlineData(120, 120, 1)]
    [InlineData(240, 120, 1)]
    public async Task
        GetCancellationRefundBreakdown_WhenMoreThen28DaysButLessThenOrEqual60BeforeDepartureAndOneTimeCreditWasUsedForPayment_ShouldReturnTotalAmountMinus60PerPassenger(
            decimal paymentAmount, decimal oneTimeUseCredit, int guestsAmount)
    {
        // Arrange
        var cashPayment = paymentAmount - oneTimeUseCredit;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(59).AddHours(1), Direction = Direction.Outbound
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
                        CashPayment(cashPayment), OneTimeUseCreditPayment(oneTimeUseCredit)
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

        decimal fee = request.Guests.Count * 60M;
        decimal oneTimeUseCreditKeptAmount = oneTimeUseCredit > fee ? fee : oneTimeUseCredit;
        decimal totalRefundAmount = paymentAmount - fee;
        decimal totalRefundAmountExceptOneTimeUseCreditRefundAmount =
            totalRefundAmount - (oneTimeUseCredit - oneTimeUseCreditKeptAmount);
        decimal cashRefundAmount =
            cashPayment < totalRefundAmountExceptOneTimeUseCreditRefundAmount
                ? cashPayment
                : totalRefundAmountExceptOneTimeUseCreditRefundAmount;
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = fee,
            OneTimeUseCreditKeptAmount = oneTimeUseCreditKeptAmount,
            OneTimeUseCreditRefundAmount = oneTimeUseCredit - oneTimeUseCreditKeptAmount,
            TotalRefundAmount = totalRefundAmount,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount =
                totalRefundAmountExceptOneTimeUseCreditRefundAmount,
            CashRefundAmount = cashRefundAmount,
            CreditRefundAmount = totalRefundAmount - cashRefundAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 59,
            OneTimeUseCreditTotalPaidAmount = oneTimeUseCredit,
            OriginalBookingValue = 1000,
        };
        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = fee, }
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Theory]
    [InlineData(28, 1000)]
    [InlineData(27, 1000)]
    [InlineData(26, 1000)]
    [InlineData(25, 1000)]
    [InlineData(24, 1000)]
    [InlineData(23, 1000)]
    [InlineData(22, 1000)]
    [InlineData(21, 1000)]
    [InlineData(20, 1000)]
    [InlineData(19, 1000)]
    [InlineData(18, 1000)]
    [InlineData(17, 1000)]
    [InlineData(16, 1000)]
    [InlineData(15, 1000)]
    public async Task
        GetCancellationRefundBreakdown_WhenMoreThen14DaysButLessThenOrEqual28BeforeDeparture_ShouldReturn25PercentOfTotalAmount(
            int days, decimal paymentAmount)
    {
        // Arrange
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(days).AddHours(1), Direction = Direction.Outbound
                        }
                    ],
                },
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { CashPayment(paymentAmount) }.ToArray()
            },
            Guests = [new(), new()]
        };
        decimal fee = paymentAmount * 0.75M;
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = fee,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = paymentAmount - fee,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = paymentAmount - fee,
            CashRefundAmount = paymentAmount - fee,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = days,
            OriginalBookingValue = 1000,
        };
        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = fee, }
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Theory]
    [InlineData(26, 1000, 750)]
    [InlineData(26, 1000, 250)]
    [InlineData(26, 1000, 120)]
    [InlineData(12, 1000, 120)]
    [InlineData(12, 1000, 250)]
    [InlineData(12, 1000, 750)]
    public async Task
        GetCancellationRefundBreakdown_WhenLessThenOrEqual28BeforeDepartureAndPaidLessThenFee_ShouldRefundAndConsumeAllAsFee(
            int days, decimal totalAmount, decimal paymentAmount)
    {
        // Arrange
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(days).AddHours(1), Direction = Direction.Outbound
                        }
                    ],
                },
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = totalAmount,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { CashPayment(paymentAmount) }.ToArray()
            },
            Guests = [new(), new()]
        };
        decimal fee = totalAmount * 0.75M;
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = paymentAmount,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            CashRefundAmount = 0,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = days,
            OriginalBookingValue = totalAmount,
        };
        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = fee, }
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Theory]
    [InlineData(29, 1000, 110)]
    [InlineData(29, 1000, 60)]
    [InlineData(29, 1000, 119)]
    [InlineData(62, 1000, 119)]
    [InlineData(62, 1000, 110)]
    [InlineData(62, 1000, 60)]
    public async Task
        GetCancellationRefundBreakdown_WhenOver28BeforeDepartureAndPaidLessThenFee_ShouldRefundAndConsumeAllAsFee(
            int days, decimal totalAmount, decimal paymentAmount)
    {
        // Arrange
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(days).AddHours(1), Direction = Direction.Outbound
                        }
                    ],
                },
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = totalAmount,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { CashPayment(paymentAmount) }.ToArray()
            },
            Guests = [new(), new()]
        };
        decimal fee = request.Guests.Count * 60;
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = paymentAmount,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            CashRefundAmount = 0,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = days,
            OriginalBookingValue = totalAmount,
        };
        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = fee, }
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Theory]
    [InlineData(1, 1000)]
    [InlineData(2, 1000)]
    [InlineData(3, 1000)]
    [InlineData(4, 1000)]
    [InlineData(5, 1000)]
    [InlineData(6, 1000)]
    [InlineData(7, 1000)]
    [InlineData(8, 1000)]
    [InlineData(9, 1000)]
    [InlineData(10, 1000)]
    [InlineData(11, 1000)]
    [InlineData(12, 1000)]
    [InlineData(13, 1000)]
    [InlineData(14, 1000)]
    public async Task
        GetCancellationRefundBreakdown_WhenMoreThen0DaysButLessThenOrEqual14BeforeDeparture_ShouldReturn0PercentOfTotalAmount(
            int days, decimal paymentAmount)
    {
        // Arrange
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(days).AddHours(1), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { CashPayment(paymentAmount) }.ToArray()
            },
            Guests = [new(), new()]
        };
        decimal fee = paymentAmount;
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = fee,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            CashRefundAmount = 0,
            CreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = days,
            OriginalBookingValue = 1000,
        };
        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = fee, }
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    public async Task
        GetCancellationRefundBreakdown_WhenMoreThen60DaysBeforeDepartureAndOnlyDepositWasPaidWithOneTimeCredit_ShouldRetainOneTimeCreditAndReturnRestButFeeWithOneTimeCredit(
            int guestsAmount)
    {
        // Arrange
        decimal paymentAmount = guestsAmount * 60M;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
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
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { OneTimeUseCreditPayment(paymentAmount) }
                        .ToArray()
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
        decimal depositAmount = guestsAmount * 60M;
        decimal paymentWithoutOneTimeCredit = paid - paymentAmount;
        decimal oneTimeUseCreditRefundAmount =
            paymentWithoutOneTimeCredit > depositAmount ? depositAmount : paymentWithoutOneTimeCredit;
        decimal totalRefundAmount = paymentWithoutOneTimeCredit - depositAmount > 0
            ? paymentWithoutOneTimeCredit - depositAmount
            : 0;
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditKeptAmount = paymentAmount,
            OneTimeUseCreditRefundAmount = oneTimeUseCreditRefundAmount,
            TotalRefundAmount = totalRefundAmount,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = totalRefundAmount - oneTimeUseCreditRefundAmount,
            CashRefundAmount = 0,
            CreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 61,
            OneTimeUseCreditTotalPaidAmount = paymentAmount,
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Theory]
    [InlineData(1000, 1)]
    [InlineData(120, 2)]
    [InlineData(1000, 4)]
    [InlineData(760, 4)]
    [InlineData(760, 2)]
    [InlineData(300, 5)]
    public async Task
        GetCancellationRefundBreakdown_WhenMoreThen60DaysBeforeDepartureAndMoreOrEqualThenDepositWasPaidWithOneTimeCredit_ShouldRetainOneTimeCreditAndReturnRestButFeeWithOneTimeCredit(
            decimal paymentAmount, int guestsAmount)
    {
        // Arrange

        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
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
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { OneTimeUseCreditPayment(paymentAmount) }
                        .ToArray()
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
        decimal paymentLeft = paymentAmount - depositAmount;
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditKeptAmount = depositAmount,
            OneTimeUseCreditRefundAmount = paymentLeft,
            TotalRefundAmount = paymentLeft,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            CashRefundAmount = 0,
            CreditRefundAmount = paymentLeft,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 61,
            OneTimeUseCreditTotalPaidAmount = paymentAmount,
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Theory]
    [InlineData(30, 970, 1)]
    [InlineData(50, 950, 1)]
    [InlineData(50, 10, 1)]
    [InlineData(30, 970, 2)]
    [InlineData(30, 90, 2)]
    [InlineData(110, 10, 2)]
    [InlineData(110, 120, 2)]
    [InlineData(110, 110, 2)]
    [InlineData(110, 130, 2)]
    [InlineData(119, 10, 2)]
    [InlineData(110, 890, 2)]
    [InlineData(10, 990, 4)]
    [InlineData(259, 741, 4)]
    [InlineData(250, 750, 4)]
    [InlineData(250, 10, 4)]
    [InlineData(250, 250, 4)]
    [InlineData(250, 260, 4)]
    [InlineData(30, 230, 4)]
    [InlineData(120, 120, 4)]
    [InlineData(120, 240, 4)]
    [InlineData(120, 250, 4)]
    public async Task
        GetCancellationRefundBreakdown_WhenMoreThen60DaysBeforeDepartureAndPartOfTheDepositWasPaidWithOneTimeCredit_ShouldRetainOneTimeCreditEqualToFeeAndReturnRestBuWithOneTimeCredit(
            decimal oneTimeUseCreditPayment, decimal nonOneTimeUseCreditPayment, int guestsAmount)
    {
        // Arrange

        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
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
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>()
                    {
                        CashPayment(nonOneTimeUseCreditPayment), OneTimeUseCreditPayment(oneTimeUseCreditPayment)
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
        decimal depositAmount = guestsAmount * 60M;
        decimal oneTimeUseCreditKeptAmount =
            oneTimeUseCreditPayment > depositAmount ? depositAmount : oneTimeUseCreditPayment;
        decimal oneTimeUserCreditRefundAmount = oneTimeUseCreditPayment > oneTimeUseCreditKeptAmount
            ? oneTimeUseCreditPayment - oneTimeUseCreditKeptAmount
            : depositAmount - oneTimeUseCreditKeptAmount;
        decimal totalRefund = paid - oneTimeUseCreditKeptAmount;
        decimal totalRefundAmountExceptOneTimeUseCreditRefundAmount =
            paid - oneTimeUseCreditKeptAmount - oneTimeUserCreditRefundAmount;
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditKeptAmount = oneTimeUseCreditKeptAmount,
            OneTimeUseCreditRefundAmount = oneTimeUserCreditRefundAmount,
            TotalRefundAmount = totalRefund,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = totalRefundAmountExceptOneTimeUseCreditRefundAmount,
            CashRefundAmount =
                nonOneTimeUseCreditPayment < totalRefundAmountExceptOneTimeUseCreditRefundAmount
                    ? nonOneTimeUseCreditPayment
                    : totalRefundAmountExceptOneTimeUseCreditRefundAmount,
            CreditRefundAmount = oneTimeUserCreditRefundAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 61,
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
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
            decimal firstOneTimeUseCreditPayment, decimal secondOneTimeUseCreditPayment,
            decimal nonOneTimeUseCreditPayment,
            int guestsAmount)
    {
        // Arrange
        var oneTimeCreditPayment = firstOneTimeUseCreditPayment + secondOneTimeUseCreditPayment;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
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
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory = new List<PaymentHistoryItem>()
                {
                    CashPayment(nonOneTimeUseCreditPayment),
                    OneTimeUseCreditPayment(firstOneTimeUseCreditPayment),
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
        decimal depositAmount = guestsAmount * 60M;
        decimal oneTimeUseCreditKeptAmount =
            oneTimeCreditPayment > depositAmount ? depositAmount : oneTimeCreditPayment;
        decimal oneTimeUserCreditRefundAmount = oneTimeCreditPayment > oneTimeUseCreditKeptAmount
            ? oneTimeCreditPayment - oneTimeUseCreditKeptAmount
            : depositAmount - oneTimeUseCreditKeptAmount;
        decimal totalRefundAmountExceptOneTimeUseCreditRefundAmount =
            paid - oneTimeUseCreditKeptAmount - oneTimeUserCreditRefundAmount;
        decimal cashRefundAmount =
            nonOneTimeUseCreditPayment < totalRefundAmountExceptOneTimeUseCreditRefundAmount
                ? nonOneTimeUseCreditPayment
                : totalRefundAmountExceptOneTimeUseCreditRefundAmount;

        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = 0,
            OneTimeUseCreditKeptAmount = oneTimeUseCreditKeptAmount,
            OneTimeUseCreditRefundAmount = oneTimeUserCreditRefundAmount,
            TotalRefundAmount = paid - oneTimeUseCreditKeptAmount,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount =
                totalRefundAmountExceptOneTimeUseCreditRefundAmount,
            CashRefundAmount = cashRefundAmount,
            CreditRefundAmount = paid - oneTimeUseCreditKeptAmount - cashRefundAmount,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 61,
            OneTimeUseCreditTotalPaidAmount = oneTimeCreditPayment,
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

#if DEBUG
        Log(request, response, this);
#endif
        var result = await _testee.GetCancellationRefundBreakdown(request, null, cancellationToken);


        // Assert
        result.Should().BeEquivalentTo(response);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_SER354Scenario1_DepositOnlyOTUCOnly()
    {
        // Arrange
        decimal paymentAmount = 120;
        int guestsAmount = 2;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
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
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { OneTimeUseCreditPayment(paymentAmount) }.ToArray()
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
            OneTimeUseCreditKeptAmount = 120,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            CashRefundAmount = 0,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 61,
            OneTimeUseCreditTotalPaidAmount = paymentAmount,
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_SER354Scenario2_DepositOnlyOTUCAndCashReturnToOTUC()
    {
        // Arrange
        int guestsAmount = 2;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
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
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { OneTimeUseCreditPayment(60), CashPayment(60) }.ToArray()
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
            OneTimeUseCreditKeptAmount = 60,
            OneTimeUseCreditRefundAmount = 60,
            TotalRefundAmount = 60,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            CashRefundAmount = 0,
            CreditRefundAmount = 60,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 61,
            OneTimeUseCreditTotalPaidAmount = 60,
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_SER354Scenario3_DepositOnlyOTUCAndCredit()
    {
        // Arrange
        int guestsAmount = 2;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
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
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { OneTimeUseCreditPayment(60), GoodWillPayment(60) }.ToArray()
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
            OneTimeUseCreditKeptAmount = 60,
            OneTimeUseCreditRefundAmount = 60,
            TotalRefundAmount = 60,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            CashRefundAmount = 0,
            CreditRefundAmount = 60,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 61,
            OneTimeUseCreditTotalPaidAmount = 60,
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_SER354Scenario4_BalancePaidOTUCCreditAndCash()
    {
        // Arrange
        int guestsAmount = 2;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
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
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>()
                    {
                        OneTimeUseCreditPayment(60), GoodWillPayment(60), CashPayment(500)
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
            OneTimeUseCreditKeptAmount = 60,
            OneTimeUseCreditRefundAmount = 60,
            TotalRefundAmount = 560,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 500,
            CashRefundAmount = 500,
            CreditRefundAmount = 60,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 61,
            OneTimeUseCreditTotalPaidAmount = 60,
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_SER354Scenario5_BalancePaidOTUCAndCredit()
    {
        // Arrange
        int guestsAmount = 2;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
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
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { OneTimeUseCreditPayment(120), GoodWillPayment(500) }.ToArray()
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
            OneTimeUseCreditKeptAmount = 120,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 500,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 500,
            CashRefundAmount = 0,
            CreditRefundAmount = 500,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 500,
            Currency = "GBP",
            DaysBeforeDeparture = 61,
            OneTimeUseCreditTotalPaidAmount = 120,
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_SER354Scenario6_BalancePaidOTUCGreaterThanDepositValue()
    {
        // Arrange
        int guestsAmount = 2;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
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
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>()
                    {
                        OneTimeUseCreditPayment(120), OneTimeUseCreditPayment(80), GoodWillPayment(500)
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
            OneTimeUseCreditKeptAmount = 120,
            OneTimeUseCreditRefundAmount = 80,
            TotalRefundAmount = 580,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 500,
            CashRefundAmount = 0,
            CreditRefundAmount = 580,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 500,
            Currency = "GBP",
            DaysBeforeDeparture = 61,
            OneTimeUseCreditTotalPaidAmount = 200,
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_SER349Scenario1_DepositOnlyOTUCOnly()
    {
        // Arrange
        decimal paymentAmount = 120;
        int guestsAmount = 2;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(59).AddHours(1), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { OneTimeUseCreditPayment(paymentAmount) }.ToArray()
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
            CancelFeeAmount = depositAmount,
            OneTimeUseCreditKeptAmount = 120,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            CashRefundAmount = 0,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 59,
            OneTimeUseCreditTotalPaidAmount = paymentAmount,
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
        result.Should().Be(response);
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_SER349Scenario2_DepositOnlyOTUCAndCashReturnToOMOP()
    {
        // Arrange
        int guestsAmount = 2;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(59).AddHours(1), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { OneTimeUseCreditPayment(60), CashPayment(60) }.ToArray()
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
            CancelFeeAmount = depositAmount,
            OneTimeUseCreditKeptAmount = 60,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            CashRefundAmount = 0,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 59,
            OneTimeUseCreditTotalPaidAmount = 60,
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_SER349Scenario3_DepositOnlyOTUCAndCredit()
    {
        // Arrange
        int guestsAmount = 2;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(59).AddHours(1), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { OneTimeUseCreditPayment(60), GoodWillPayment(60) }.ToArray()
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
            CancelFeeAmount = depositAmount,
            OneTimeUseCreditKeptAmount = 60,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            CashRefundAmount = 0,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 59,
            OneTimeUseCreditTotalPaidAmount = 60,
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_SER349Scenario4_BalancePaidOTUCAndCash()
    {
        // Arrange
        int guestsAmount = 2;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(59).AddHours(1), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { OneTimeUseCreditPayment(120), CashPayment(500) }.ToArray()
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
            CancelFeeAmount = depositAmount,
            OneTimeUseCreditKeptAmount = 120,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 500,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 500,
            CashRefundAmount = 500,
            CreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 59,
            OneTimeUseCreditTotalPaidAmount = 120,
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_SER349Scenario5_BalancePaidOTUCAndCredit()
    {
        // Arrange
        int guestsAmount = 2;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(59).AddHours(1), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { OneTimeUseCreditPayment(120), GoodWillPayment(500) }.ToArray()
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
            CancelFeeAmount = depositAmount,
            OneTimeUseCreditKeptAmount = 120,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 500,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 500,
            CashRefundAmount = 0,
            CreditRefundAmount = 500,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 500,
            Currency = "GBP",
            DaysBeforeDeparture = 59,
            OneTimeUseCreditTotalPaidAmount = 120,
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_SER349Scenario6_BalancePaidOTUCGreaterThanDepositValue()
    {
        // Arrange
        int guestsAmount = 2;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(59).AddHours(1), Direction = Direction.Outbound
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
                        OneTimeUseCreditPayment(120), OneTimeUseCreditPayment(80), GoodWillPayment(500)
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
            CancelFeeAmount = depositAmount,
            OneTimeUseCreditKeptAmount = 120,
            OneTimeUseCreditRefundAmount = 80,
            TotalRefundAmount = 580,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 500,
            CashRefundAmount = 0,
            CreditRefundAmount = 580,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 500,
            Currency = "GBP",
            DaysBeforeDeparture = 59,
            OneTimeUseCreditTotalPaidAmount = 200,
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_SER350Scenario1_OTUCValueUnder75PercentOfTheBookingValue()
    {
        // Arrange
        int guestsAmount = 2;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(25).AddHours(1), Direction = Direction.Outbound
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
                        OneTimeUseCreditPayment(120),
                        OneTimeUseCreditPayment(100),
                        GoodWillPayment(280),
                        CashPayment(500)
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

        decimal cancelFeeAmount = 750M;
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = cancelFeeAmount,
            CashRefundAmount = 250,
            CreditRefundAmount = 0,
            OneTimeUseCreditKeptAmount = 220,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 250,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 250,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 25,
            OneTimeUseCreditTotalPaidAmount = 220,
            OriginalBookingValue = 1000,
        };
        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = cancelFeeAmount }
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_SER350Scenario2_OTUCValueOver75PercentOfTheBookingValue()
    {
        // Arrange
        int guestsAmount = 2;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(26).AddHours(1), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { OneTimeUseCreditPayment(120), OneTimeUseCreditPayment(880) }
                        .ToArray()
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

        decimal cancelFeeAmount = 750M;
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = cancelFeeAmount,
            CashRefundAmount = 0,
            CreditRefundAmount = 250,
            OneTimeUseCreditKeptAmount = 750,
            OneTimeUseCreditRefundAmount = 250,
            TotalRefundAmount = 250,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 26,
            OneTimeUseCreditTotalPaidAmount = 1000,
            OriginalBookingValue = 1000,
        };
        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = cancelFeeAmount }
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_SER355Scenario1_OTUCAgainstBooking()
    {
        // Arrange
        int guestsAmount = 2;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(11).AddHours(1), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { OneTimeUseCreditPayment(120), OneTimeUseCreditPayment(880) }
                        .ToArray()
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

        decimal cancelFeeAmount = 1000M;
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = cancelFeeAmount,
            CashRefundAmount = 0,
            CreditRefundAmount = 0,
            OneTimeUseCreditKeptAmount = 1000,
            OneTimeUseCreditRefundAmount = 0,
            TotalRefundAmount = 0,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 11,
            OneTimeUseCreditTotalPaidAmount = 1000,
            OriginalBookingValue = 1000,
        };
        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = cancelFeeAmount }
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetCancellationRefundBreakdown_NoCancellationFeeFromAtcom_FullRefund()
    {
        // Arrange
        int guestsAmount = 2;
        BookingResponse request = new BookingResponse()
        {
            Currency = new Currency() { Code = "GBP" },
            Package = new BookingPackage()
            {
                Transport = new Transport()
                {
                    Routes =
                    [
                        new Route()
                        {
                            DepDate = DateTime.UtcNow.AddDays(11).AddHours(1), Direction = Direction.Outbound
                        }
                    ],
                }
            },
            PaymentInfo = new PriceInfo()
            {
                TotalPrice = 1000,
                PaymentHistory =
                    new List<PaymentHistoryItem>() { OneTimeUseCreditPayment(120), OneTimeUseCreditPayment(880) }
                        .ToArray()
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

        decimal cancelFeeAmount = 0;
        BookingCancellationRefundBreakdown response = new BookingCancellationRefundBreakdown()
        {
            CancelFeeAmount = cancelFeeAmount,
            CashRefundAmount = 0,
            CreditRefundAmount = 1000,
            OneTimeUseCreditKeptAmount = 0,
            OneTimeUseCreditRefundAmount = 1000,
            TotalRefundAmount = 1000,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 0,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 0,
            Currency = "GBP",
            DaysBeforeDeparture = 11,
            OneTimeUseCreditTotalPaidAmount = 1000,
            OriginalBookingValue = 1000,
        };
        CancellationToken cancellationToken = new CancellationToken();
        InfoCancellationResponse infoCancellationResponse = new InfoCancellationResponse()
        {
            CancellationFeeItem = new FeeItem() { Amount = cancelFeeAmount }
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
        _infoCancellationServiceMock.Verify(x => x.GetInfoCancellationAsync(request), Times.Once);
    }
}