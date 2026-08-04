using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Data.Vouchers.Helpers;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Extensions
{
    public class CreditItemExtensionsTests
    {
        [Fact]
        public void GetBookingReferenceFromMeta_ValidCreditItem_ReturnsBookingReference()
        {
            // Arrange
            var bookingReference = "123";
            var sut = new CreditItem { Metadata = [new () { Key = VoucherifyMetaKeys.BookingRef, Value = bookingReference }] };

            // Act
            var result = sut.GetBookingRefFromMeta();

            // Assert
            result.Should().BeEquivalentTo(bookingReference);
        }

        [Theory]
        [MemberData(nameof(CreditItemData))]
        public void GetBookingReferenceFromMeta_CreditItemIsNull_ReturnsNull(CreditItem creditItem)
        {
            // Arrange
            CreditItem item = null;
            // Act
            var result = item.GetBookingRefFromMeta();

            // Assert
            result.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(CreditItemData))]
        public void GetBookingReferenceFromMeta_InValidCreditItem_ReturnsNull(CreditItem creditItem)
        {
            // Arrange
            // Act
            var result = creditItem.GetBookingRefFromMeta();

            // Assert
            result.Should().BeNull();
        }

        public static IEnumerable<object[]> CreditItemData()
        {
            yield return new object[] {
                new CreditItem { Metadata = [new (){ Key = VoucherifyMetaKeys.BookingRef }] }
            };
            yield return new object[] {
                new CreditItem { Metadata = [new ()] }
            };
            yield return new object[] {
                new CreditItem { Metadata = [] }
            };
            yield return new object[] {
                new CreditItem()
            };
        }
    }
}
