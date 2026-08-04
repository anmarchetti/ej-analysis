using easyJet.Foundation.Voucherify.Extensions;
using FluentAssertions;
using Xunit;
using VoucherRedemption = Voucherify.DataModel.Contexts.VoucherRedemption;

namespace easyJet.Foundation.Voucherify.Tests.Extenstions
{
    public class VoucherRedemptionExtenstionsTests
    {
        [Fact]
        public void VoucherRedemptionWithQuantity_ShouldBeUnlimited_IfRedemptionIsNull()
        {
            // Arrange
            var voucherRedemtion = new VoucherRedemption();
            int? redemtion = null;

            // Act
            var actual = voucherRedemtion.VoucherRedemptionWithQuantity(redemtion);

            // Assert
            actual.Quantity.Should().BeNull();
        }

        [Fact]
        public void VoucherRedemptionWithQuantity_ShouldBeWithQuantity_IfRedemptionHasValue()
        {
            // Arrange
            var voucherRedemtion = new VoucherRedemption();
            int? redemtion = 5;

            // Act
            var actual = voucherRedemtion.VoucherRedemptionWithQuantity(redemtion);

            // Assert
            actual.Quantity.Should().Be(redemtion);
        }
    }
}
