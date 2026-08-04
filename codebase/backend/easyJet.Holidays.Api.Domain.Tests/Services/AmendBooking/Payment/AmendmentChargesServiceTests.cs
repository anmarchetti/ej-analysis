using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.Payment;

public class AmendmentPaymentCalculatorTests
{
    private readonly Mock<ILogger<AmendmentChargesService>> _loggerMock = new Mock<ILogger<AmendmentChargesService>>();
    private readonly IOptions<ApiSettings> _apiSettings;
    private readonly AmendmentChargesService _sut;

    public AmendmentPaymentCalculatorTests()
    {
        _apiSettings = Options.Create(new ApiSettings { Vouchers = new VoucherSettings { IsActive = true } });
        _sut = new AmendmentChargesService(_loggerMock.Object, _apiSettings);
    }

    public static IEnumerable<object[]> TestData()
    {
        yield return new object[]
        {
            Array.Empty<decimal>(),
            new[] { 20m, 30m },
            100m,
            100m,
            200m,
            150m,
            100m,
            50m,
            50m,
            new[]
            {
                new FeesPerPersonItem
                {
                    FeesCount = 1, FeesPerPersonAmount = 20m
                },
                new FeesPerPersonItem
                {
                    FeesCount = 1, FeesPerPersonAmount = 30m
                }
            }
        };

        yield return new object[]
        {
            Array.Empty<decimal>(),
            new[] { 20m, 30m },
            200m,
            200m,
            250m,
            200m,
            50m,
            0m,
            50m,
            new[]
            {
                new FeesPerPersonItem
                {
                    FeesCount = 1, FeesPerPersonAmount = 20m
                },
                new FeesPerPersonItem
                {
                    FeesCount = 1, FeesPerPersonAmount = 30m
                }
            }
        };

        yield return new object[]
        {
            Array.Empty<decimal>(),
            new[] { 20m, 30m },
            200m,
            200m,
            150m,
            100m,
            -50m,
            -100m,
            50m,
            new[]
            {
                new FeesPerPersonItem
                {
                    FeesCount = 1, FeesPerPersonAmount = 20m
                },
                new FeesPerPersonItem
                {
                    FeesCount = 1, FeesPerPersonAmount = 30m
                }
            }
        };

        yield return new object[]
        {
            Array.Empty<decimal>(),
            Array.Empty<decimal>(),
            200m,
            200m,
            250m,
            250m,
            50m,
            50m,
            0m,
            Array.Empty<FeesPerPersonItem>()
        };
    }

    [Theory]
    [MemberData(nameof(TestData))]
    public void CalculateAmendmentPaymentInfo_OriginalBookingWithoutFees(
        decimal[] originalFeesAmounts,
        decimal[] validateFeesAmounts,
        decimal originalBookingPriceInc,
        decimal originalBookingPriceEx,
        decimal bookingPriceInc,
        decimal bookingPriceEx,
        decimal expectedAmendmentCharges,
        decimal expectedAmendmentChargesWithoutFees,
        decimal expectedTotalFeesAmount,
        FeesPerPersonItem[] feesPerPerson)
    {
        var originalBooking = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                AmendmentFeesItems = originalFeesAmounts.Select(amount => new FeeItem() { Amount = amount }).ToArray(),
                BookingPriceInc = originalBookingPriceInc,
                BookingPriceEx = originalBookingPriceEx
            }
        };

        var validateBookingResponse = new ValidateBookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                AmendmentFeesItems = validateFeesAmounts.Select(amount => new FeeItem { Amount = amount }).ToArray(),
                BookingPriceInc = bookingPriceInc,
                BookingPriceEx = bookingPriceEx
            }
        };

        var result = _sut.CalculateAmendmentPaymentInfo(originalBooking, validateBookingResponse);

        using (new AssertionScope())
        {
            result.PackagePriceWithFees.Should().Be(bookingPriceInc);
            result.PackagePriceWithoutFees.Should().Be(bookingPriceEx);
            result.AmendmentCharges.Should().Be(expectedAmendmentCharges);
            result.AmendmentChargesWithoutFees.Should().Be(expectedAmendmentChargesWithoutFees);
            result.TotalFeesAmount.Should().Be(expectedTotalFeesAmount);
            result.FeesPerPersons.Should().BeEquivalentTo(feesPerPerson);
        }
    }

    [Fact]
    public void CalculateAmendmentPaymentInfo_OriginalBookingWithFees()
    {
        var originalBooking = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                AmendmentFeesItems = new[]
                {
                    new FeeItem
                        {Amount = 30, Code = "AF1", Date = new DateTime(1991, 1, 1), PaxId = 1, Type = "TestType"}
                },
                BookingPriceInc = 200,
                BookingPriceEx = 170
            }
        };

        var validateBookingResponse = new ValidateBookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                AmendmentFeesItems = new[]
                {
                    new FeeItem
                        {Amount = 30, Code = "AF1", Date = new DateTime(1991, 1, 1), PaxId = 1, Type = "TestType"},
                    new FeeItem
                        {Amount = 30, Code = "AF1", Date = new DateTime(1991, 1, 2), PaxId = 1, Type = "TestType"}
                },
                BookingPriceInc = 260,
                BookingPriceEx = 200
            }
        };

        var result = _sut.CalculateAmendmentPaymentInfo(originalBooking, validateBookingResponse);

        using (new AssertionScope())
        {
            result.PackagePriceWithFees.Should().Be(260);
            result.PackagePriceWithoutFees.Should().Be(200);
            result.AmendmentCharges.Should().Be(60);
            result.AmendmentChargesWithoutFees.Should().Be(30);
            result.TotalFeesAmount.Should().Be(30);
            result.FeesPerPersons.Should().BeEquivalentTo(new[] { new FeesPerPersonItem { FeesCount = 1, FeesPerPersonAmount = 30m } });
        }
    }

    [Theory]
    [MemberData(nameof(ValidateAmendCommitPayment_PositiveTestsData))]
    public void ValidateAmendCommitPayment_PositiveTests(AmendBookingRequest amendRequest, BookingResponse bookingResponse,
        ValidateAmendBookingResponse validateAmendResponse)
    {
        // Act
        var func = () => _sut.ValidateAmendCommitPayment(amendRequest, bookingResponse, validateAmendResponse);

        // Assert
        func.Should().NotThrow();
    }

    public static TheoryData<AmendBookingRequest, BookingResponse, ValidateAmendBookingResponse> ValidateAmendCommitPayment_PositiveTestsData()
    {
        var partiallyPaidBookingWithoutAmends = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                AllowPayBalanceDueDate = DateTime.Now.AddMonths(3),
                AmendmentFeesItems = [],
                BalanceDueAmount = 1530,
                BookingPriceEx = 1650,
                BookingPriceInc = 1650,
                DepositPrice = 120,
                TotalPrice = 1650,
            }
        };

        var fullyPaidBookingWithoutAmends = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                AmendmentFeesItems = [],
                BalanceDueAmount = 0,
                BookingPriceEx = 1400,
                BookingPriceInc = 1400,
                DepositPrice = 120,
                TotalPrice = 1400
            }
        };

        var testCases = new TheoryData<AmendBookingRequest, BookingResponse, ValidateAmendBookingResponse>
        {
            // https://easyjet.atlassian.net/browse/MAN-540
            // scenario 1.1 - partially paid booking, amendment price > 0, change fee, pay change fee only
            { CreateAmendRequest(50), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, 60, 50) },
            // scenario 1.1 - partially paid booking, amendment price > 0, change fee, pay change fee and amend price
            { CreateAmendRequest(110), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, 60, 50) },
            // scenario 1.2 - partially paid booking, amenment price > 0, no change fee
            { CreateAmendRequest(0), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, 20) },
            // scenario 1.3 - partially paid booking, amendment price < 0, change fee < Math.Abs(amendment price)
            { CreateAmendRequest(0, -50, ConvertType.CREDIT), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, -100, 50) },
            // scenario 1.4 - partially paid booking, amendment price < 0, no change fee
            { CreateAmendRequest(0, -50, ConvertType.CREDIT), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, -50) },
            // scenario 1.5 - partially paid booking, amendment price < 0, change fee > Math.Abs(amendment price)
            { CreateAmendRequest(20), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, -30, 50) },
            // scenario 2.1 - fully paid booking, amendment price > 0, change fee, pay change fee only
            { CreateAmendRequest(50), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 20, 50 ) },
            { CreateAmendRequest(0, 50), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 20, 50 ) },
            { CreateAmendRequest(20, 30), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 20, 50 ) },
            // scenario 2.1 - fully paid booking, amendment price > 0, change fee, pay change fee and amend price
            { CreateAmendRequest(70), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 20, 50 ) },
            { CreateAmendRequest(0, 70), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 20, 50 ) },
            { CreateAmendRequest(40, 30), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 20, 50 ) },
            // scenario 2.2 - fully paid booking, amendment price > 0, no change fee, pay amend price later
            { CreateAmendRequest(0), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 30) },
            // scenario 2.2 - fully paid booking, amendment price > 0, no change fee, pay amend price now
            { CreateAmendRequest(30), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 30) },
            // scenario 2.3 - fully paid booking, amendment price < 0, change fee > Math.Abs(amendment price)
            { CreateAmendRequest(20), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -30, 50) },
            // scenario 2.4 - fully paid booking, amendment price < 0, change fee < Math.Abs(amendment price)
            { CreateAmendRequest(-30, 0, ConvertType.REFUND), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -80, 50) },
            { CreateAmendRequest(0, -30, ConvertType.CREDIT), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -80, 50) },
            { CreateAmendRequest(-20, -10, ConvertType.REFUND), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -80, 50) },
            // scenario 2.5 - fully paid booking, amendment price < 0, no change fee
            { CreateAmendRequest(-40, 0, ConvertType.REFUND), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -40) },
            { CreateAmendRequest(0, -40, ConvertType.CREDIT), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -40) },
            { CreateAmendRequest(-10, -30, ConvertType.REFUND), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -40) },
            // scenario 2.6 - fully paid booking, amendment price = 0, change fee
            { CreateAmendRequest(50), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 0, 50) },
            // scenario 2.7 - fully paid booking, amendment price = 0, no change fee
            { CreateAmendRequest(0), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 0, 0) },
        };

        return testCases;
    }

    [Theory]
    [MemberData(nameof(ValidateAmendCommitPayment_NegativeTestsData))]
    public void ValidateAmendCommitPayment_NegativeTests(AmendBookingRequest amendRequest, BookingResponse bookingResponse,
        ValidateAmendBookingResponse validateAmendResponse)
    {
        // Act
        var func = () => _sut.ValidateAmendCommitPayment(amendRequest, bookingResponse, validateAmendResponse);

        // Assert
        func.Should().Throw<ApiException>();
    }

    public static TheoryData<AmendBookingRequest, BookingResponse, ValidateAmendBookingResponse> ValidateAmendCommitPayment_NegativeTestsData()
    {
        var partiallyPaidBookingWithoutAmends = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                AllowPayBalanceDueDate = DateTime.Now.AddMonths(3),
                AmendmentFeesItems = [],
                BalanceDueAmount = 1530,
                BookingPriceEx = 1650,
                BookingPriceInc = 1650,
                DepositPrice = 120,
                TotalPrice = 1650,
            }
        };

        var fullyPaidBookingWithoutAmends = new BookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                AmendmentFeesItems = [],
                BalanceDueAmount = 0,
                BookingPriceEx = 1400,
                BookingPriceInc = 1400,
                DepositPrice = 120,
                TotalPrice = 1400
            }
        };

        var testCases = new TheoryData<AmendBookingRequest, BookingResponse, ValidateAmendBookingResponse>
        {
            // pay invalid amount for partially paid booking with amend price > 0 and change fee
            { CreateAmendRequest(-30, 0, ConvertType.REFUND), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, 60, 50) },
            { CreateAmendRequest(0, -30, ConvertType.CREDIT), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, 60, 50) },
            { CreateAmendRequest(-20), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, 60, 50) },
            { CreateAmendRequest(20), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, 60, 50) },
            { CreateAmendRequest(80), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, 60, 50) },
            { CreateAmendRequest(120), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, 60, 50) },
            // pay invalid amount for partially paid booking with amend price > 0 and no change fee
            { CreateAmendRequest(-30, 0, ConvertType.REFUND), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, 20) },
            { CreateAmendRequest(0, -30, ConvertType.CREDIT), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, 20) },
            { CreateAmendRequest(-10), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, 20) },
            { CreateAmendRequest(10), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, 20) },
            { CreateAmendRequest(30), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, 20) },
            // pay invalid amount for partially paid booking with amend price < 0 and change fee
            { CreateAmendRequest(-70, 0, ConvertType.REFUND), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, -100, 50) },
            { CreateAmendRequest(0, -70, ConvertType.CREDIT), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, -100, 50) },
            { CreateAmendRequest(-20, 0, ConvertType.REFUND), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, -100, 50) },
            { CreateAmendRequest(0, -20, ConvertType.CREDIT), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, -100, 50) },
            { CreateAmendRequest(-20), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, -100, 50) },
            { CreateAmendRequest(10), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, -100, 50) },
            // pay invalid amount for partially paid booking with amend price < 0 and no change fee
            { CreateAmendRequest(-70, 0, ConvertType.REFUND), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, -100) },
            { CreateAmendRequest(0, -70, ConvertType.CREDIT), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, -100) },
            { CreateAmendRequest(-20, 0, ConvertType.REFUND), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, -100) },
            { CreateAmendRequest(0, -20, ConvertType.CREDIT), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, -100) },
            { CreateAmendRequest(-20), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, -100) },
            { CreateAmendRequest(10), partiallyPaidBookingWithoutAmends, CreatePartiallyPaidAmendedBooking(1650, -100) },
            // pay invalid amount for fully paid booking with amend price > 0 and change fee
            { CreateAmendRequest(-30, 0, ConvertType.REFUND), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 20, 50 ) },
            { CreateAmendRequest(0, -30, ConvertType.CREDIT), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 20, 50 ) },
            { CreateAmendRequest(-20), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 20, 50 )},
            { CreateAmendRequest(20), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 20, 50 )},
            { CreateAmendRequest(80), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 20, 50 )},
            { CreateAmendRequest(30, 50), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 20, 50 )},
            // pay invalid amount for fully paid booking with amend price > 0 and no change fee
            { CreateAmendRequest(-30, 0, ConvertType.REFUND), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 20 ) },
            { CreateAmendRequest(0, -30, ConvertType.CREDIT), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 20 ) },
            { CreateAmendRequest(-20), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 20 )},
            { CreateAmendRequest(10), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 20 )},
            { CreateAmendRequest(30), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 20 )},
            { CreateAmendRequest(20, 40), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, 20 )},
            // pay invalid amount for fully paid booking with amend price < 0 and change fee, change fee < Math.Abs(amendment price)
            { CreateAmendRequest(-40, 0, ConvertType.REFUND), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -80, 50)},
            { CreateAmendRequest(0, -40, ConvertType.CREDIT), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -80, 50)},
            { CreateAmendRequest(-20, 0, ConvertType.REFUND), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -80, 50)},
            { CreateAmendRequest(0, -20, ConvertType.CREDIT), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -80, 50)},
            { CreateAmendRequest(10), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -80, 50)},
            // pay invalid amount for fully paid booking with amend price < 0 and change fee, change fee > Math.Abs(amendment price)
            { CreateAmendRequest(-20, 0, ConvertType.REFUND), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -30, 50)},
            { CreateAmendRequest(0, -20, ConvertType.CREDIT), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -30, 50)},
            { CreateAmendRequest(10), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -30, 50)},
            { CreateAmendRequest(40), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -30, 50)},
            // pay invalid amount for fully paid booking with amend price > 0 and no change fee
            { CreateAmendRequest(-50, 0, ConvertType.REFUND), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -40)},
            { CreateAmendRequest(0, -50, ConvertType.CREDIT), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -40)},
            { CreateAmendRequest(-30, 0, ConvertType.REFUND), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -40)},
            { CreateAmendRequest(0, -30, ConvertType.CREDIT), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -40)},
            { CreateAmendRequest(20), fullyPaidBookingWithoutAmends, CreateFullyPaidAmendedBooking(1400, -40)},
        };

        return testCases;
    }

    private static AmendBookingRequest CreateAmendRequest(decimal cashAmount, decimal creditAmount = 0, ConvertType? convertType = null)
    {
        return new AmendBookingRequest
        {
            ConvertType = convertType,
            PaymentInfo = new Domain.Data.Payment.CardPaymentInfo
            {
                Amount = cashAmount,
                CreditAmount = creditAmount,
            }
        };
    }

    private static ValidateAmendBookingResponse CreatePartiallyPaidAmendedBooking(decimal priceBeforeAmend, decimal amendPrice, decimal amendFee = 0)
    {
        return new ValidateAmendBookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                AmendmentCharges = amendPrice + amendFee,
                AmendmentFeesItems = [new FeeItem { Amount = amendFee }],
                BalanceDueAmount = priceBeforeAmend + amendPrice + amendFee - 120,
                BookingPriceEx = priceBeforeAmend + amendPrice,
                BookingPriceInc = priceBeforeAmend + amendPrice + amendFee,
                DepositPrice = 120,
                TotalPrice = priceBeforeAmend + amendPrice + amendFee,
            }
        };
    }

    private static ValidateAmendBookingResponse CreateFullyPaidAmendedBooking(decimal priceBeforeAmend, decimal amendPrice, decimal amendFee = 0)
    {
        return new ValidateAmendBookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                AmendmentCharges = amendPrice + amendFee,
                AmendmentFeesItems = [new FeeItem { Amount = amendFee }],
                BalanceDueAmount = amendPrice + amendFee,
                BookingPriceEx = priceBeforeAmend + amendPrice,
                BookingPriceInc = priceBeforeAmend + amendPrice + amendFee,
                DepositPrice = 120,
                TotalPrice = priceBeforeAmend + amendPrice + amendFee,
            }
        };
    }
}