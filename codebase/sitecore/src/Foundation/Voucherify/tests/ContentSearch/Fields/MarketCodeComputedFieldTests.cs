using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Voucherify.ContentSearch.Fields;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.ContentSearch;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.ContentSearch.Fields
{
    public class MarketCodeComputedFieldTests
    {
        private readonly MarketCodeComputedField computedField;

        public MarketCodeComputedFieldTests()
        {
            computedField = Substitute.ForPartsOf<MarketCodeComputedField>();
        }

        [Fact]
        public void IsValid_ShouldBeTrue_IfItemIsPromotion()
        {
            // Arrange
            var item = new FakeItem();
            item.WithTemplate(Templates.Promotion.Id);

            var indexableItem = new SitecoreIndexableItem(item);

            // Act
            var actual = computedField.IsValid(indexableItem);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void ComputeField_ShouldReturnNull_IfParentIsNotMarkerFolderItem()
        {
            // Arrange
            var parent = new FakeItem();
            var item = new FakeItem();
            item.WithParent(parent);
            item.WithTemplate(Templates.Promotion.Id);

            var indexableItem = new SitecoreIndexableItem(item);

            // Act
            var actual = computedField.ComputeField(indexableItem);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void ComputeField_ShouldReturnMarketCode_IfMarketIsSet(string marketCode)
        {
            // Arrange
            var marketItem = new FakeItem();
            marketItem.WithField(Multisite.Templates.Market.Fields.Code, marketCode);

            var parent = new FakeItem();
            parent.WithTemplate(Templates.PromotionMarketFolder.Id);
            var item = new FakeItem();
            item.WithParent(parent);
            item.WithTemplate(Templates.Promotion.Id);

            computedField.Configure().When(substitute => substitute.GetMultilistTargetItemFromUtils(Arg.Any<Item>())).DoNotCallBase();
            computedField.Configure().GetMultilistTargetItemFromUtils(Arg.Any<Item>()).ReturnsForAnyArgs(new[] { marketItem.ToSitecoreItem() });

            var indexableItem = new SitecoreIndexableItem(item);

            // Act
            var actual = computedField.ComputeField(indexableItem);

            // Assert
            actual.Should().NotBeNull();
            var actualArray = actual as IEnumerable<string>;
            actualArray.Should().NotBeNull();
            actualArray.Count().Should().Be(1);
            actualArray.ElementAt(0).Should().Be(marketCode);
        }
    }
}
