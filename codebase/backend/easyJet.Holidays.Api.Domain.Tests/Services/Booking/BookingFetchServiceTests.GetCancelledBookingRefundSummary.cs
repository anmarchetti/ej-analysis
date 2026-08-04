using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using System.Globalization;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking;

public partial class BookingFetchServiceTests
{
    [Fact]
    public void GetCancelledBookingRefundSummary_ExtraRefundBeforeCancellationNoCash_ReturnRefundAmount()
    {
        // Arrange
        var settings = Options.Create(new AtcomSettings
        {
            ChangeBooking = new ChangeBookingSettings
            {
                IsActive = true,
                ChangeAllowedExpirationDate = DateTimeOffset.Now.AddDays(15),
                UseChangeExpirationDate = true,
                AllowedStatuses = ["BOOKING"],
                Memo =new AtcomMemoSettings()
                {
                    BookingPrivacyCode = "BookingPrivacyCode"
                }
            },
            BookingStatus = new BookingStatus()
            {
                Booking = "BOOKING",
                Canceled = "CANCELED",
            },
            FraudCode = "FraudCode",
        });
        var booking = new BookingResponse
        {
            BookingStatus = "CANCELED",
            CancellationDate = new DateTime(2025, 4, 1, 12, 55, 5, DateTimeKind.Utc),
            BookingDate = new DateTime(2025, 3, 13, 9, 12, 44, DateTimeKind.Utc),
            PaymentInfo = new PriceInfo
            {
                BalanceDueAmount = 0,
                PaymentHistory = new PaymentHistoryItem[]
                {
                    new PaymentHistoryItem
                    {
                        Amount = 72.00m,
                        PaymentDate = DateTimeOffset.Parse("2025-03-13T09:12:44+00:00", CultureInfo.InvariantCulture),
                        IsCredit = false,
                        Card =
                            new PaymentCard()
                            {
                                Type = "CARD",
                                Code = "DL",
                                Number = "XXXXXXXXXXXX1111",
                                ExpDate = "03/30",
                                IsLoyaltyCard = false
                            }
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 48.00m,
                        PaymentDate = DateTimeOffset.Parse("2025-03-13T09:12:45+00:00", CultureInfo.InvariantCulture),
                        IsCredit = true,
                        Card = null
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 2545.92m,
                        PaymentDate = DateTimeOffset.Parse("2025-04-01T12:46:52+00:00", CultureInfo.InvariantCulture),
                        IsCredit = false,
                        Card =
                            new PaymentCard
                            {
                                Type = "CARD",
                                Code = "MC",
                                Number = "XXXXXXXXXXXX4444",
                                ExpDate = "03/30",
                                IsLoyaltyCard = false
                            }
                    },
                    new PaymentHistoryItem
                    {
                        Amount = -204.00m,
                        PaymentDate = DateTimeOffset.Parse("2025-04-01T12:52:15+00:00", CultureInfo.InvariantCulture),
                        IsCredit = false,
                        RefundAgainstId = "12",
                        Card = new PaymentCard
                        {
                            Type = "CARD",
                            Code = "MC",
                            Number = "XXXXXXXXXXXX4444",
                            ExpDate = "03/30",
                            IsLoyaltyCard = false
                        }
                    },
                    new PaymentHistoryItem
                    {
                        Amount = -72.00m,
                        PaymentDate = DateTimeOffset.Parse("2025-04-01T12:55:03+00:00", CultureInfo.InvariantCulture),
                        IsCredit = true,
                        Card = null
                    },
                    new PaymentHistoryItem
                    {
                        Amount = -2341.92m,
                        PaymentDate = DateTimeOffset.Parse("2025-04-01T12:55:04+00:00", CultureInfo.InvariantCulture),
                        IsCredit = true,
                        Card = null
                    }
                }
            },
            Currency = Currency.GBP,
            Memo =
            [
                new Memo() { Code = "Cred", Text = "Voucher created with ids: 1234, 2432, 323233, 2413.92 USD" }
            ]
        };

        var fixture = FixtureUtils.AutoMoqFixture();
        fixture.Inject(settings);

        var voucherServiceMock = fixture.Freeze<Mock<IVouchersService>>();
        voucherServiceMock.Setup(i => i.GetRefundAmountFromCreditRefundMemo(It.IsAny<BookingResponse>()))
            .Returns(2413.92m);
        var bookingRefundServiceMock = fixture.Freeze<Mock<IBookingRefundService>>();
        bookingRefundServiceMock.Setup(i => i.GetRefundAmountFromCashRefundMemo(It.IsAny<BookingResponse>()))
            .Returns((decimal?)null);

        var sut = fixture.Freeze<BookingFetchService>();

        // Act
        var summary = sut.GetCancelledBookingRefundSummary(booking);

        // Assert
        summary.Should().NotBeNull();
        summary.CashRefundAmount.Should().Be(0);
        summary.CreditRefundAmount.Should().Be(2413.92m);
        summary.TotalRefundAmount.Should().Be(2413.92m);
    }

    [Fact]
    public void GetCancelledBookingRefundSummary_ExtraRefundBeforeCancellationWithCash_ReturnRefundAmount()
    {
        // Arrange
        var settings = Options.Create(new AtcomSettings
        {
            ChangeBooking = new ChangeBookingSettings
            {
                IsActive = true,
                ChangeAllowedExpirationDate = DateTimeOffset.Now.AddDays(15),
                UseChangeExpirationDate = true,
                AllowedStatuses = ["BOOKING"],
                Memo =new AtcomMemoSettings()
                {
                    BookingPrivacyCode = "BookingPrivacyCode"
                }
            },
            BookingStatus = new BookingStatus()
            {
                Booking = "BOOKING",
                Canceled = "CANCELED",
            },
            FraudCode = "FraudCode",
        });
        var booking = new BookingResponse
        {
            BookingStatus = "CANCELED",
            CancellationDate = new DateTime(2025, 4, 1, 12, 55, 5, DateTimeKind.Utc),
            BookingDate = new DateTime(2025, 3, 13, 9, 12, 44, DateTimeKind.Utc),
            PaymentInfo = new PriceInfo
            {
                BalanceDueAmount = 0,
                PaymentHistory = new PaymentHistoryItem[]
                {
                    new PaymentHistoryItem
                    {
                        Amount = 72.00m,
                        PaymentDate = DateTimeOffset.Parse("2025-03-13T09:12:44+00:00", CultureInfo.InvariantCulture),
                        IsCredit = false,
                        Card =
                            new PaymentCard()
                            {
                                Type = "CARD",
                                Code = "DL",
                                Number = "XXXXXXXXXXXX1111",
                                ExpDate = "03/30",
                                IsLoyaltyCard = false
                            }
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 48.00m,
                        PaymentDate = DateTimeOffset.Parse("2025-03-13T09:12:45+00:00", CultureInfo.InvariantCulture),
                        IsCredit = true,
                        Card = null
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 2545.92m,
                        PaymentDate = DateTimeOffset.Parse("2025-04-01T12:46:52+00:00", CultureInfo.InvariantCulture),
                        IsCredit = false,
                        Card =
                            new PaymentCard
                            {
                                Type = "CARD",
                                Code = "MC",
                                Number = "XXXXXXXXXXXX4444",
                                ExpDate = "03/30",
                                IsLoyaltyCard = false
                            }
                    },
                    new PaymentHistoryItem
                    {
                        Amount = -204.00m,
                        PaymentDate = DateTimeOffset.Parse("2025-04-01T12:52:15+00:00", CultureInfo.InvariantCulture),
                        IsCredit = false,
                        RefundAgainstId = "12",
                        Card = new PaymentCard
                        {
                            Type = "CARD",
                            Code = "MC",
                            Number = "XXXXXXXXXXXX4444",
                            ExpDate = "03/30",
                            IsLoyaltyCard = false
                        }
                    },
                    new PaymentHistoryItem
                    {
                        Amount = -2341.92m,
                        PaymentDate = DateTimeOffset.Parse("2025-04-01T12:55:04+00:00", CultureInfo.InvariantCulture),
                        IsCredit = true,
                        Card = null
                    }
                }
            },
            Currency = Currency.GBP,
            Memo =
            [
                new Memo() { Code = "Cred", Text = "Voucher created with ids: 1234, 2432, 323233, 2413.92 USD" },
                new Memo() { Code = "RF", Text = "Voucher created with ids: 1234, 2432, 323233, 72.00 USD" }
            ]
        };

        var fixture = FixtureUtils.AutoMoqFixture();
        fixture.Inject(settings);

        var voucherServiceMock = fixture.Freeze<Mock<IVouchersService>>();
        voucherServiceMock.Setup(i => i.GetRefundAmountFromCreditRefundMemo(It.IsAny<BookingResponse>()))
            .Returns(2341.92m);
        var bookingRefundServiceMock = fixture.Freeze<Mock<IBookingRefundService>>();
        bookingRefundServiceMock.Setup(i => i.GetRefundAmountFromCashRefundMemo(It.IsAny<BookingResponse>()))
            .Returns(72.00m);

        var sut = fixture.Freeze<BookingFetchService>();

        // Act
        var summary = sut.GetCancelledBookingRefundSummary(booking);

        // Assert
        summary.Should().NotBeNull();
        summary.CashRefundAmount.Should().Be(72.00m);
        summary.CreditRefundAmount.Should().Be(2341.92m);
        summary.TotalRefundAmount.Should().Be(2413.92m);
    }

    [Fact]
    public void GetCancelledBookingRefundSummary_NotCancelledBooking_ReturnNull()
    {
        // Arrange
        var settings = Options.Create(new AtcomSettings
        {
            ChangeBooking = new ChangeBookingSettings
            {
                IsActive = true,
                ChangeAllowedExpirationDate = DateTimeOffset.Now.AddDays(15),
                UseChangeExpirationDate = true,
                AllowedStatuses = ["BOOKING"],
                Memo =new AtcomMemoSettings()
                {
                    BookingPrivacyCode = "BookingPrivacyCode"
                }
            },
            BookingStatus = new BookingStatus()
            {
                Booking = "BOOKING",
                Canceled = "CANCELED",
            },
            FraudCode = "FraudCode",
        });
        var fixture = FixtureUtils.AutoMoqFixture();
        fixture.Inject(settings);

        var booking = new BookingResponse
        {
            BookingStatus = "ACTIVE",
            CancellationDate = new DateTime(2025, 4, 1, 12, 55, 5, DateTimeKind.Utc),
            BookingDate = new DateTime(2025, 3, 13, 9, 12, 44, DateTimeKind.Utc),
            PaymentInfo = new PriceInfo
            {
                BalanceDueAmount = 0,
                PaymentHistory = new PaymentHistoryItem[]
                {
                    new PaymentHistoryItem
                    {
                        Amount = 72.00m,
                        PaymentDate = DateTimeOffset.Parse("2025-03-13T09:12:44+00:00", CultureInfo.InvariantCulture),
                        IsCredit = false,
                        Card =
                            new PaymentCard()
                            {
                                Type = "CARD",
                                Code = "DL",
                                Number = "XXXXXXXXXXXX1111",
                                ExpDate = "03/30",
                                IsLoyaltyCard = false
                            }
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 48.00m,
                        PaymentDate = DateTimeOffset.Parse("2025-03-13T09:12:45+00:00", CultureInfo.InvariantCulture),
                        IsCredit = true,
                        Card = null
                    },
                    new PaymentHistoryItem
                    {
                        Amount = 2545.92m,
                        PaymentDate = DateTimeOffset.Parse("2025-04-01T12:46:52+00:00", CultureInfo.InvariantCulture),
                        IsCredit = false,
                        Card =
                            new PaymentCard
                            {
                                Type = "CARD",
                                Code = "MC",
                                Number = "XXXXXXXXXXXX4444",
                                ExpDate = "03/30",
                                IsLoyaltyCard = false
                            }
                    },
                    new PaymentHistoryItem
                    {
                        Amount = -204.00m,
                        PaymentDate = DateTimeOffset.Parse("2025-04-01T12:52:15+00:00", CultureInfo.InvariantCulture),
                        IsCredit = false,
                        Card = new PaymentCard
                        {
                            Type = "CARD",
                            Code = "MC",
                            Number = "XXXXXXXXXXXX4444",
                            ExpDate = "03/30",
                            IsLoyaltyCard = false
                        }
                    },
                    new PaymentHistoryItem
                    {
                        Amount = -72.00m,
                        PaymentDate = DateTimeOffset.Parse("2025-04-01T12:55:03+00:00", CultureInfo.InvariantCulture),
                        IsCredit = true,
                        Card = null
                    },
                    new PaymentHistoryItem
                    {
                        Amount = -2341.92m,
                        PaymentDate = DateTimeOffset.Parse("2025-04-01T12:55:04+00:00", CultureInfo.InvariantCulture),
                        IsCredit = true,
                        Card = null,
                    }
                }
            },
            Currency = Currency.GBP,
            Memo =
            [
                new Memo() { Code = "Cred", Text = "Voucher created with ids: 1234, 2432, 323233, 2413.92 USD" }
            ]
        };

        var voucherServiceMock = fixture.Freeze<Mock<IVouchersService>>();
        voucherServiceMock.Setup(i => i.GetRefundAmountFromCreditRefundMemo(It.IsAny<BookingResponse>()))
            .Returns(2413.92m);

        var sut = fixture.Freeze<BookingFetchService>();

        // Act
        var summary = sut.GetCancelledBookingRefundSummary(booking);

        // Assert
        summary.Should().BeNull();
    }

    [Fact]
    public void GetCancelledBookingRefundSummary_ForTradeBooking_ReturnRefundAmount()
    {
        // Arrange
        var settings = Options.Create(new AtcomSettings
        {
            ChangeBooking = new ChangeBookingSettings
            {
                IsActive = true,
                ChangeAllowedExpirationDate = DateTimeOffset.Now.AddDays(15),
                UseChangeExpirationDate = true,
                AllowedStatuses = ["BOOKING"],
                Memo =new AtcomMemoSettings()
                {
                    BookingPrivacyCode = "BookingPrivacyCode"
                }
            },
            BookingStatus = new BookingStatus()
            {
                Booking = "BOOKING",
                Canceled = "CANCELED",
            },
            FraudCode = "FraudCode",
        });
        var booking = new BookingResponse
        {
            BookingStatus = "CANCELED",
            CancellationDate = new DateTime(2025, 4, 1, 12, 55, 5, DateTimeKind.Utc),
            BookingDate = new DateTime(2025, 3, 13, 9, 12, 44, DateTimeKind.Utc),
            PaymentInfo = new PriceInfo { BalanceDueAmount = 0, PaymentHistory = [], PaymentReceived = 2134.79m },
            Currency = Currency.GBP,
            Memo =
            [
                new Memo() { Code = "RF", Text = "Refund cash amount is 2134.79 GBP" }
            ]
        };

        var fixture = FixtureUtils.AutoMoqFixture();
        fixture.Inject(settings);

        var voucherServiceMock = fixture.Freeze<Mock<IVouchersService>>();
        voucherServiceMock.Setup(i => i.GetRefundAmountFromCreditRefundMemo(It.IsAny<BookingResponse>()))
            .Returns((decimal?)null);
        var bookingRefundServiceMock = fixture.Freeze<Mock<IBookingRefundService>>();
        bookingRefundServiceMock.Setup(i => i.GetRefundAmountFromCashRefundMemo(It.IsAny<BookingResponse>()))
            .Returns(2134.79m);

        var sut = fixture.Freeze<BookingFetchService>();

        // Act
        var summary = sut.GetCancelledBookingRefundSummary(booking);

        // Assert
        summary.Should().NotBeNull();
        summary.CashRefundAmount.Should().Be(2134.79m);
        summary.CreditRefundAmount.Should().Be(0m);
        summary.TotalRefundAmount.Should().Be(2134.79m);
    }
}