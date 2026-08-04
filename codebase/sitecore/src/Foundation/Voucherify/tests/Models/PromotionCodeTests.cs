using System.Globalization;
using easyJet.Foundation.Voucherify.Models.Domain;
using FluentAssertions;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.Models
{
    public class PromotionCodeTests
    {
        [Fact]
        public void InitPromotionWithPromotionCodes_Success_PassRequestAtcomCode()
        {
            // Arrange
            string ToCultureString(decimal value) => value.ToString(CultureInfo.CurrentCulture);

            var parentItem = new FakeItem();
            var item = new FakeItem()
                .WithTemplate(Templates.PromotionCodeConfiguration.Id)
                .WithField(Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode, "test1")
                .WithField(Templates.PromotionCodeConfiguration.Fields.MinimumSpend, ToCultureString(0.1M))
                .WithField(Templates.PromotionCodeConfiguration.Fields.MinimumSpendPerPerson, ToCultureString(0.2M))
                .WithField(Templates.PromotionCodeConfiguration.Fields.DiscountAmountPerBooking, ToCultureString(0.3M))
                .WithField(Templates.PromotionCodeConfiguration.Fields.PercentageDiscountPerBooking, ToCultureString(0.4M))
                .WithField(Templates.PromotionCodeConfiguration.Fields.AdultDiscountAmountPerPerson, ToCultureString(0.5M))
                .WithField(Templates.PromotionCodeConfiguration.Fields.AdultPercentageAmountPerPerson, ToCultureString(0.6M))
                .WithField(Templates.PromotionCodeConfiguration.Fields.ChildDiscountAmountPerPerson, ToCultureString(0.7M))
                .WithField(Templates.PromotionCodeConfiguration.Fields.ChildPercentageAmountPerPerson, ToCultureString(0.8M))
                .WithField(Templates.PromotionCodeConfiguration.Fields.HideOnPromoBanner, "1")
                .WithField(Sitecore.FieldIDs.Sortorder, "10")
                .WithParent(parentItem)
                .ToSitecoreItem();

            // Act
            var result = new PromotionCode(item, item.Parent);

            // Assert
            result.Should().NotBeNull();
            result.AtcomPromoCode.Should().Be("test1");
            result.MinimumSpend.Should().Be(0.1M);
            result.MinimumSpendPerPerson.Should().Be(0.2M);
            result.DiscountAmountPerBooking.Should().Be(0.3M);
            result.PercentageDiscountPerBooking.Should().Be(0.4M);
            result.AdultDiscountAmountPerPerson.Should().Be(0.5M);
            result.AdultPercentageAmountPerPerson.Should().Be(0.6M);
            result.ChildDiscountAmountPerPerson.Should().Be(0.7M);
            result.ChildPercentageAmountPerPerson.Should().Be(0.8M);
            result.HideOnPromoBanner.Should().BeTrue();
        }
    }
}