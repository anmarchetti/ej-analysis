using easyJet.Foundation.Voucherify.ContentSearch.Fields;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.ContentSearch.Fields
{
    public class PromotionCodesComputedFieldTests
    {
        private PromotionCodesComputedField computedField = new PromotionCodesComputedField();

        [Fact]
        public void SerializePromotionCodes_ResultIsNotEmpty()
        {
            // Arrange
            var child1 = new FakeItem()
                .WithTemplate(Templates.PromotionCodeConfiguration.Id)
                .WithField(Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode, "test1");

            var child2 = new FakeItem()
                .WithTemplate(Templates.PromotionCodeConfiguration.Id)
                .WithField(Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode, "test2");

            var child3 = new FakeItem()
                .WithTemplate(Templates.PromotionCodeConfiguration.Id)
                .WithField(Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode, "test3");

            var promotionItem = new FakeItem()
                .WithTemplate(Templates.Promotion.Id)
                .WithChild(child1)
                .WithChild(child2)
                .WithChild(child3)
                .ToSitecoreItem();

            // Act
            var result = (string[])computedField.ComputeField(promotionItem);

            // Assert
            Assert.NotNull(result);
            result.Length.Should().Be(3);
            result[0].Should().Be("test1");
            result[1].Should().Be("test2");
            result[2].Should().Be("test3");
        }

        [Fact]
        public void SerializePromotionCodes_ResultIsEmpty_IfNoChildren()
        {
            // Arrange
            var promotionItem = new FakeItem()
                .WithTemplate(Templates.Promotion.Id)
                .ToSitecoreItem();

            // Act
            var result = (string[])computedField.ComputeField(promotionItem);

            // Assert
            result.Should().BeEmpty();
            result.Length.Should().Be(0);
        }

        [Fact]
        public void IsValid_ItemValid()
        {
            // Arrange
            var promotionItem = new FakeItem()
                .WithTemplate(Templates.Promotion.Id)
                .ToSitecoreItem();

            // Act
            var result = computedField.IsValid(promotionItem);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void IsValid_ItemNotValid_DifferentTemplate()
        {
            // Arrange
            var promotionItem = new FakeItem()
                .WithTemplate(ID.NewID)
                .ToSitecoreItem();

            // Act
            var result = computedField.IsValid(promotionItem);

            // Assert
            result.Should().BeFalse();
        }
    }
}