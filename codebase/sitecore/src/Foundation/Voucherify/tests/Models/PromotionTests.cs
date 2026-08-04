using easyJet.Foundation.Voucherify.Models.Domain;
using FluentAssertions;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.Models
{
    public class PromotionTests
    {
        [Fact]
        public void InitPromotionWithPromotionCodes_Success()
        {
            // Arrange
            var child1 = new FakeItem()
                .WithTemplate(Templates.PromotionCodeConfiguration.Id)
                .WithField(Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode, "test1")
                .WithField(Sitecore.FieldIDs.Sortorder, "10");

            var child2 = new FakeItem()
                .WithTemplate(Templates.PromotionCodeConfiguration.Id)
                .WithField(Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode, "test2")
                .WithField(Sitecore.FieldIDs.Sortorder, "20");

            var child3 = new FakeItem()
                .WithTemplate(Templates.PromotionCodeConfiguration.Id)
                .WithField(Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode, "test3")
                .WithField(Sitecore.FieldIDs.Sortorder, "30");

            var promotionItem = new FakeItem()
                .WithTemplate(Templates.Promotion.Id)
                .WithField(Templates.Promotion.Fields.CustomerPromoCode, "customerPromoCode")
                .WithChild(child1)
                .WithChild(child2)
                .WithChild(child3)
                .ToSitecoreItem();

            // Act
            var result = new Promotion(promotionItem);

            // Assert
            result.Should().NotBeNull();
            result.PromotionCodes.Should().NotBeEmpty();
            result.PromotionCodes.Should().HaveCount(3);
            result.PromotionCodes[0].AtcomPromoCode.Should().Be("test1");
            result.PromotionCodes[1].AtcomPromoCode.Should().Be("test2");
            result.PromotionCodes[2].AtcomPromoCode.Should().Be("test3");
        }

        [Fact]
        public void InitPromotionWithPromotionCodes_Success_PassRequestAtcomCode()
        {
            // Arrange
            var child1 = new FakeItem()
                .WithTemplate(Templates.PromotionCodeConfiguration.Id)
                .WithField(Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode, "test1")
                .WithField(Sitecore.FieldIDs.Sortorder, "10");

            var child2 = new FakeItem()
                .WithTemplate(Templates.PromotionCodeConfiguration.Id)
                .WithField(Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode, "test2")
                .WithField(Sitecore.FieldIDs.Sortorder, "20");

            var child3 = new FakeItem()
                .WithTemplate(Templates.PromotionCodeConfiguration.Id)
                .WithField(Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode, "test3")
                .WithField(Sitecore.FieldIDs.Sortorder, "30");

            var promotionItem = new FakeItem()
                .WithTemplate(Templates.Promotion.Id)
                .WithField(Templates.Promotion.Fields.CustomerPromoCode, "customerPromoCode")
                .WithChild(child1)
                .WithChild(child2)
                .WithChild(child3)
                .ToSitecoreItem();

            // Act
            var result = new Promotion(promotionItem, "test1", false);

            // Assert
            result.Should().NotBeNull();
            result.PromotionCodes.Should().NotBeEmpty();
            result.PromotionCodes.Should().HaveCount(1);
            result.PromotionCodes[0].AtcomPromoCode.Should().Be("test1");
        }
    }
}