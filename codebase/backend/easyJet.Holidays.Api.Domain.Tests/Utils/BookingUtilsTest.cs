using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Utils;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Utils
{
    public class BookingUtilsTest
    {

        private static DateTimeOffset GetPartDate()
        {
            return new DateTimeOffset(2020, 1, 1, 1, 1, 1, new TimeSpan());
        }

        private static DateTimeOffset GetFeatureDate()
        {
            return new DateTimeOffset(3020, 1, 1, 1, 1, 1, new TimeSpan());
        }

        [Theory]
        [MemberData(nameof(BookingUtilsData))]
        public void AllowPayOutstandingBalanceDays_Tests(BookingResponse booking, int allowPayOutstandingBalanceInDays, DateTimeOffset res, bool canPay)
        {
            // Act
            BookingUtils.EnrichAllowPayBalanceDueDate(booking, allowPayOutstandingBalanceInDays);

            // Assert
            booking?.PaymentInfo?.AllowPayOutstandingBalanceDays.Should().Be(allowPayOutstandingBalanceInDays);
        }

        [Theory]
        [MemberData(nameof(BookingUtilsData))]
        public void EnrichAllowPayBalanceDueDate_Tests(BookingResponse booking, int allowPayOutstandingBalanceInDays, DateTimeOffset res, bool canPay)
        {
            // Act
            BookingUtils.EnrichAllowPayBalanceDueDate(booking, allowPayOutstandingBalanceInDays);

            // Assert
            booking?.PaymentInfo?.AllowPayBalanceDueDate.Should().Be(res);
        }

        [Theory]
        [MemberData(nameof(BookingUtilsData))]
        public void DateOnly_TestData_ShouldFormat(BookingResponse booking, int allowPayOutstandingBalanceInDays, DateTimeOffset res, bool canPay)
        {
            // Act
            var actual = BookingUtils.CanPayOutstandingBalance(booking, allowPayOutstandingBalanceInDays);

            // Assert
            actual.Should().Be(canPay);
        }

        public static readonly List<object[]> BookingUtilsData = new List<object[]> {
            new object[] { null, 30, null, false},
            new object[] {
                new BookingResponse() {
                    PaymentInfo = new PriceInfo()
                    {
                        BalanceDueDate = GetPartDate()
                    }
                }, 30, GetPartDate(), false},
            new object[] {
                new BookingResponse() {
                    Package = new BookingPackage()
                    {
                        Transport = new()
                        {
                            Routes =
                            [
                                new()
                                {
                                    Direction = Direction.Outbound, DepDate = GetPartDate(),
                                }
                            ]
                        }
                    },
                    PaymentInfo = new PriceInfo()
                    {
                        BalanceDueDate = GetPartDate()
                    }
                }, 30, GetPartDate().AddDays(-30), false},
            new object[] {
                new BookingResponse() {
                    Package = new BookingPackage()
                    {
                        Transport = new()
                        {
                            Routes =
                            [
                                new()
                                {
                                    Direction = Direction.Outbound, DepDate = GetFeatureDate(),
                                }
                            ]
                        }
                    },
                    PaymentInfo = new PriceInfo()
                    {
                        BalanceDueDate = GetFeatureDate()
                    }
                }, 30, GetFeatureDate().AddDays(-30), false},
            };

        #region BookingValue
        [Fact]
        public void BookingValue_Null_ReturnsNull()
        {
            // Act
            var actual = BookingUtils.BookingValue(null);

            // Assert
            actual.Should().Be(0);
        }

        [Fact]
        public void BookingValue_NoPaymentHistory_ReturnsNull()
        {
            // Act
            var actual = BookingUtils.BookingValue(new BookingResponse
            {
                PaymentInfo = new PriceInfo()
            });

            // Assert
            actual.Should().Be(0);
        }

        [Fact]
        public void BookingValue_ReturnsSum()
        {
            // Act
            var actual = BookingUtils.BookingValue(new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    TotalPrice = 100,
                    PaymentHistory = new[] {
                        new PaymentHistoryItem{ Amount = 100},
                        new PaymentHistoryItem{ Amount = -90.12m},
                        new PaymentHistoryItem{ Amount = 20},
                        new PaymentHistoryItem{ Amount = -15.34m},
                    }
                }
            });

            // Assert
            actual.Should().Be(14.54m);
        }


        [Fact]
        public void BookingValue_PaidMoreThanTotalPrice_ReturnsBookingPrice()
        {
            // Act
            var actual = BookingUtils.BookingValue(new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    TotalPrice = 5,
                    PaymentHistory = new[] {
                        new PaymentHistoryItem{ Amount = 100},
                        new PaymentHistoryItem{ Amount = -90.12m},
                        new PaymentHistoryItem{ Amount = 20},
                        new PaymentHistoryItem{ Amount = -15.34m},
                    }
                }
            });

            // Assert
            actual.Should().Be(5);
        }
        #endregion

        #region CreditAmount
        [Fact]
        public void CreditAmount_ShouldThrowArgumentNullException_WhenBookingIsNull()
        {
            // Act
            Action act = () => BookingUtils.CreditAmount(null);

            // Assert
            act.Should().Throw<ArgumentNullException>(); 
        }

        [Fact]
        public void CreditAmount_ShouldThrowArgumentNullException_WhenPaymentHistoryIsNull()
        {
            // Arrange
            var booking = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = null
                }
            };

            // Act
            Action act = () => BookingUtils.CreditAmount(booking);

            // Assert
            act.Should().Throw<ArgumentNullException>(); 
        }

        [Fact]
        public void CreditAmount_ShouldReturnZero_WhenNoCreditsInPaymentHistory()
        {
            // Arrange
            var booking = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new List<PaymentHistoryItem>
                    {
                        new PaymentHistoryItem { IsCredit = false, Amount = 100 },
                        new PaymentHistoryItem { IsCredit = false, Amount = 200 }
                    }.ToArray()
                }
            };

            // Act
            var result = BookingUtils.CreditAmount(booking);

            // Assert
            result.Should().Be(0); 
        }

        [Fact]
        public void CreditAmount_ShouldReturnCorrectSum_WhenCreditsInPaymentHistory()
        {
            // Arrange
            var booking = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new List<PaymentHistoryItem>
                    {
                        new PaymentHistoryItem { IsCredit = true, Amount = 100 },
                        new PaymentHistoryItem { IsCredit = true, Amount = 200 },
                        new PaymentHistoryItem { IsCredit = false, Amount = 300 }
                    }.ToArray()
                }
            };

            // Act
            var result = BookingUtils.CreditAmount(booking);

            // Assert
            result.Should().Be(300);
        }

        [Fact]
        public void CreditAmount_ShouldReturnZero_WhenPaymentHistoryIsEmpty()
        {
            // Arrange
            var booking = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new List<PaymentHistoryItem>().ToArray()
                }
            };

            // Act
            var result = BookingUtils.CreditAmount(booking);

            // Assert
            result.Should().Be(0);
        }

        [Fact]
        public void CreditAmount_ShouldReturnCorrectSum_WhenMixedCreditsAndDebitsInPaymentHistory()
        {
            // Arrange
            var booking = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    PaymentHistory = new List<PaymentHistoryItem>
                    {
                        new PaymentHistoryItem { IsCredit = true, Amount = 150 },
                        new PaymentHistoryItem { IsCredit = false, Amount = 100 },
                        new PaymentHistoryItem { IsCredit = true, Amount = 200 }
                    }.ToArray()
                }
            };

            // Act
            var result = BookingUtils.CreditAmount(booking);

            // Assert
            result.Should().Be(350); 
        }
        #endregion CreditAmount

        #region DaysToDeparture
        [Fact]
        public void DaysToDeparture_Null_ThrowException()
        {
            // Act
            Func<double> f = () => BookingUtils.DaysToDeparture(null);

            // Assert
            f.Should().Throw<InvalidOperationException>();
        }

        [Fact]
        public void DaysToDeparture_20DaysIntoTheFuture_ShouldBe20Days()
        {
            // Arrange
            var bookingResponse = new BookingResponse
            {
                Package = new BookingPackage
                {
                    Transport = new()
                    {
                        Routes =
                        [
                            new ()
                            {
                                DepDate = new DateTimeOffset(DateTime.UtcNow).AddDays(20)
                            }
                        ]
                    }
                }
            };

            // Act
            var daysToDeparture = BookingUtils.DaysToDeparture(bookingResponse);

            // Assert
            Math.Round(daysToDeparture).Should().Be(20);
        }
        #endregion DaysToDeparture

        #region IsFlightAndHotelBooking
        [Fact]
        public void IsFlightAndHotelBooking_NullBooking_ThrowsArgumentNullException()
        {
            // Act
            Action act = () => BookingUtils.IsFlightAndHotelBooking(null);

            // Assert
            act.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void IsFlightAndHotelBooking_ContainsFlightPlusHotelCollection_ReturnsTrue()
        {
            // Arrange
            var bookingResponse = new BookingResponse
            {
                PromotionCollections = ["fph"]
            };

            // Act
            var result = BookingUtils.IsFlightAndHotelBooking(bookingResponse);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void IsFlightAndHotelBooking_ContainsFlightPlusHotelCollectionInDifferentCasing_ReturnsTrue()
        {
            // Arrange
            var bookingResponse = new BookingResponse
            {
                PromotionCollections = ["FPH"]
            };

            // Act
            var result = BookingUtils.IsFlightAndHotelBooking(bookingResponse);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void IsFlightAndHotelBooking_NoFlightPlusHotelCollection_ReturnsFalse()
        {
            // Arrange
            var bookingResponse = new BookingResponse
            {
                PromotionCollections = ["lux"]
            };

            // Act
            var result = BookingUtils.IsFlightAndHotelBooking(bookingResponse);

            // Assert
            result.Should().BeFalse();
        }
        #endregion IsFlightAndHotelBooking
    }
}
