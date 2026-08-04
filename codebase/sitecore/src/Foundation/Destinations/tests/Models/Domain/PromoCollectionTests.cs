using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Models.Domain
{
    public class PromoCollectionTests
    {
        [Fact]
        public void PromoCollection_DefaultConstructor_Success()
        {
            var result = new PromoCollection();

            result.Should().NotBeNull();
        }

        [Fact]
        public void PromoCollection_SitecoreItem_Success()
        {
            var item = new FakeItem()
                .WithField(Constants.Fields.PromotionCollectionItem.Key, "key")
                .WithField(Constants.Fields.PromotionCollectionItem.PromotionCodes, "prom,code")
                .WithField(Constants.Fields.PromotionCollectionItem.Title, "title");

            var result = new PromoCollection(item.ToSitecoreItem());

            result.Should().NotBeNull();
            result.Key.Should().Be("key");
            result.Name.Should().Be("title");
            result.PromotionCodes.Should().Be("prom,code");
        }

        [Fact]
        public void PromoCollection_WhenTitleIsNull_FallbackToItemName()
        {
            var item = new FakeItem()
                .WithName("name");

            var result = new PromoCollection(item.ToSitecoreItem());

            result.Should().NotBeNull();
            result.Name.Should().Be("name");
        }

        [Fact]
        public void PromoCollection_WhenPromCodesIsNull_FallbackToEmptyString()
        {
            var item = new FakeItem();

            var result = new PromoCollection(item.ToSitecoreItem());

            result.Should().NotBeNull();
            result.PromotionCodes.Should().Be(string.Empty);
        }

        [Fact]
        public void PromoCollection_ToString_ReturnsName()
        {
            var promCollection = new PromoCollection
            {
                Name = "Expected"
            };

            Assert.Equal("Expected", promCollection.ToString());
        }
    }
}