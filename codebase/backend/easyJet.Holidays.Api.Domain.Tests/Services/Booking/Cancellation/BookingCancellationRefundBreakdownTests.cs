using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using System.Diagnostics.CodeAnalysis;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation;
[ExcludeFromCodeCoverage]
[SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
public class BookingCancellationRefundBreakdownTests
{
    [Fact]
    public void GetHashCode_SameValues_ShouldReturnSameHash()
    {
        // Arrange
        var bookingCancellationRefundBreakdown1 = new BookingCancellationRefundBreakdown
        {
            OneTimeUseCreditKeptAmount = 1.23m,
            CancelFeeAmount = 4.56m,
            OneTimeUseCreditRefundAmount = 7.89m,
            TotalRefundAmount = 10.11m,
            CashRefundAmount = 12.13m,
            CreditRefundAmount = 14.15m,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 16.17m,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 18.19m,
            TransferredCashPaymentToRefundCreditAmount = 20.21m,
            OneTimeUseCreditTotalPaidAmount = 22.23m,
            OriginalCancelFeeAmount = 25.54m,
            OriginalBookingValue = 1000
        };

        var bookingCancellationRefundBreakdown2 = new BookingCancellationRefundBreakdown
        {
            OneTimeUseCreditKeptAmount = 1.23m,
            CancelFeeAmount = 4.56m,
            OneTimeUseCreditRefundAmount = 7.89m,
            TotalRefundAmount = 10.11m,
            CashRefundAmount = 12.13m,
            CreditRefundAmount = 14.15m,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 16.17m,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 18.19m,
            TransferredCashPaymentToRefundCreditAmount = 20.21m,
            OneTimeUseCreditTotalPaidAmount = 22.23m,
            OriginalCancelFeeAmount = 25.54m,
            OriginalBookingValue = 1000
        };

        // Act
        int hash1 = bookingCancellationRefundBreakdown1.GetHashCode();
        int hash2 = bookingCancellationRefundBreakdown2.GetHashCode();

        // Assert
        Assert.Equal(hash1, hash2);
    }

    [Fact]
    public void GetHashCode_DifferentValues_ShouldReturnDifferentHash()
    {
        // Arrange
        var bookingCancellationRefundBreakdown1 = new BookingCancellationRefundBreakdown
        {
            OneTimeUseCreditKeptAmount = 1.23m,
            CancelFeeAmount = 4.56m,
            OneTimeUseCreditRefundAmount = 7.89m,
            TotalRefundAmount = 10.11m,
            CashRefundAmount = 12.13m,
            CreditRefundAmount = 14.15m,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 16.17m,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 18.19m,
            TransferredCashPaymentToRefundCreditAmount = 20.21m,
            OneTimeUseCreditTotalPaidAmount = 22.23m,
            OriginalCancelFeeAmount = 25.54m,
            OriginalBookingValue = 1000
        };

        var bookingCancellationRefundBreakdown2 = new BookingCancellationRefundBreakdown
        {
            OneTimeUseCreditKeptAmount = 1.24m,
            CancelFeeAmount = 4.56m,
            OneTimeUseCreditRefundAmount = 7.89m,
            TotalRefundAmount = 10.11m,
            CashRefundAmount = 12.13m,
            CreditRefundAmount = 14.15m,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 16.17m,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 18.19m,
            TransferredCashPaymentToRefundCreditAmount = 20.21m,
            OneTimeUseCreditTotalPaidAmount = 22.23m,
            OriginalCancelFeeAmount = 25.54m,
            OriginalBookingValue = 1000
        };

        // Act
        int hash1 = bookingCancellationRefundBreakdown1.GetHashCode();
        int hash2 = bookingCancellationRefundBreakdown2.GetHashCode();

        // Assert
        Assert.NotEqual(hash1, hash2);
    }

    [Fact]
    public void GetHashCode_MultipleCallsSameObject_ShouldReturnSameHash()
    {
        // Arrange
        var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown
        {
            OneTimeUseCreditKeptAmount = 1.23m,
            CancelFeeAmount = 4.56m,
            OneTimeUseCreditRefundAmount = 7.89m,
            TotalRefundAmount = 10.11m,
            CashRefundAmount = 12.13m,
            CreditRefundAmount = 14.15m,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = 16.17m,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 18.19m,
            TransferredCashPaymentToRefundCreditAmount = 20.21m,
            OneTimeUseCreditTotalPaidAmount = 22.23m,
            OriginalCancelFeeAmount = 25.54m,
            OriginalBookingValue = 1000
        };

        // Act
        int hash1 = bookingCancellationRefundBreakdown.GetHashCode();
        int hash2 = bookingCancellationRefundBreakdown.GetHashCode();
        int hash3 = bookingCancellationRefundBreakdown.GetHashCode();

        // Assert
        Assert.Equal(hash1, hash2);
        Assert.Equal(hash2, hash3);
    }

    [Theory]
    [InlineData(1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0)]
    [InlineData(0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2)]
    [InlineData(-1.0, -2.0, -3.0, -4.0, -5.0, -6.0, -7.0, -8.0, -9.0, -10.0, -11.0, -12.0)]
    [InlineData(1000000.99, 2000000.88, 3000000.77, 4000000.66, 5000000.55, 6000000.44, 7000000.33, 8000000.22, 9000000.11, 10000000.00, 11000000.01, 12000000.02)]
    public void GetHashCode_ParameterizedTest_ShouldBeConsistent(
        double p1, double p2, double p3, double p4, double p5,
        double p6, double p7, double p8, double p9, double p10, double p11, double p12)
    {
        // Arrange
        var bookingCancellationRefundBreakdown1 = new BookingCancellationRefundBreakdown
        {
            OneTimeUseCreditKeptAmount = (decimal)p1,
            CancelFeeAmount = (decimal)p2,
            OneTimeUseCreditRefundAmount = (decimal)p3,
            TotalRefundAmount = (decimal)p4,
            CashRefundAmount = (decimal)p5,
            CreditRefundAmount = (decimal)p6,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = (decimal)p7,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = (decimal)p8,
            TransferredCashPaymentToRefundCreditAmount = (decimal)p9,
            OneTimeUseCreditTotalPaidAmount = (decimal)p10,
            OriginalCancelFeeAmount = (decimal)p11,
            OriginalBookingValue = (decimal)p12
        };

        var bookingCancellationRefundBreakdown2 = new BookingCancellationRefundBreakdown
        {
            OneTimeUseCreditKeptAmount = (decimal)p1,
            CancelFeeAmount = (decimal)p2,
            OneTimeUseCreditRefundAmount = (decimal)p3,
            TotalRefundAmount = (decimal)p4,
            CashRefundAmount = (decimal)p5,
            CreditRefundAmount = (decimal)p6,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = (decimal)p7,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = (decimal)p8,
            TransferredCashPaymentToRefundCreditAmount = (decimal)p9,
            OneTimeUseCreditTotalPaidAmount = (decimal)p10,
            OriginalCancelFeeAmount = (decimal)p11,
            OriginalBookingValue = (decimal)p12
        };

        // Act & Assert
        Assert.Equal(bookingCancellationRefundBreakdown1.GetHashCode(), bookingCancellationRefundBreakdown2.GetHashCode());
    }

    [Fact]
    public void GetHashCode_MinMaxValues_ShouldWork()
    {
        // Arrange
        var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown
        {
            OneTimeUseCreditKeptAmount = decimal.MinValue,
            CancelFeeAmount = decimal.MaxValue,
            OneTimeUseCreditRefundAmount = 0m,
            TotalRefundAmount = 1m,
            CashRefundAmount = -1m,
            CreditRefundAmount = 0.0000000000000000001m,
            TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = -0.0000000000000000001m,
            TotalRefundAmountExceptOneTimeUseCreditRefundAmount = 79228162514264337593543950335m,
            TransferredCashPaymentToRefundCreditAmount = -79228162514264337593543950335m,
            OneTimeUseCreditTotalPaidAmount = 123.456789m,
            OriginalCancelFeeAmount = decimal.MaxValue,
            OriginalBookingValue = decimal.MinValue,
        };

        // Act
        var hash = bookingCancellationRefundBreakdown.GetHashCode();

        // Assert
        Assert.IsType<int>(hash);
    }

    [Fact]
    public void GetHashCode_DistributionTest_ShouldHaveReasonableDistribution()
    {
        // Arrange
        var hashes = new HashSet<int>();
        var random = new Random(42);

        for (int i = 0; i < 1000; i++)
        {
            var bookingCancellationRefundBreakdown = new BookingCancellationRefundBreakdown
            {
                OneTimeUseCreditKeptAmount = (decimal)(random.NextDouble() * 1000),
                CancelFeeAmount = (decimal)(random.NextDouble() * 1000),
                OneTimeUseCreditRefundAmount = (decimal)(random.NextDouble() * 1000),
                TotalRefundAmount = (decimal)(random.NextDouble() * 1000),
                CashRefundAmount = (decimal)(random.NextDouble() * 1000),
                CreditRefundAmount = (decimal)(random.NextDouble() * 1000),
                TotalRefundCreditAmountExceptOneTimeUseCreditRefundAmount = (decimal)(random.NextDouble() * 1000),
                TotalRefundAmountExceptOneTimeUseCreditRefundAmount = (decimal)(random.NextDouble() * 1000),
                TransferredCashPaymentToRefundCreditAmount = (decimal)(random.NextDouble() * 1000),
                OneTimeUseCreditTotalPaidAmount = (decimal)(random.NextDouble() * 1000),
                OriginalCancelFeeAmount = (decimal)(random.NextDouble() * 1000),
                OriginalBookingValue = (decimal)(random.NextDouble() * 1000),
            };

            hashes.Add(bookingCancellationRefundBreakdown.GetHashCode());
        }

        Assert.True(hashes.Count >= 900, $"Hash distribution too poor. Only {hashes.Count} unique hashes out of 1000");
    }
}
