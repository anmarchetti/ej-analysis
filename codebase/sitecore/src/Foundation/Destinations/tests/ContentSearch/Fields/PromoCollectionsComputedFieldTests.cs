using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using FluentAssertions;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class PromoCollectionsComputedFieldTests
    {
        private readonly PromoCollectionsComputedField computedField = new PromoCollectionsComputedField();

        [Fact]
        public void ComputeField_ReturnsKey_WhenPromoCollectionExists()
        {
            // Arrange
            var promoKey1 = "promo-key-1";
            var promoKey2 = "promo-key-2";
            var id1 = ID.NewID;
            var id2 = ID.NewID;
            using (var db = new Db())
            {
                db.Add(new DbItem("PromoCollections1", id1, ID.NewID)
                {
                    { Constants.Fields.PromotionCollectionItem.Key, promoKey1 }
                });
                db.Add(new DbItem("PromoCollections2", id2, ID.NewID)
                {
                    { Constants.Fields.PromotionCollectionItem.Key, promoKey2 }
                });
                db.Add(new DbItem("Accommodation", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    { Constants.Fields.AccommodationItem.PromoCollections, $"{id1.ToString()}|{id2.ToString()}" }
                });
                var item = db.GetItem("/sitecore/content/Accommodation");
                var indexableItem = new SitecoreIndexableItem(item);

                // Act
                var result = computedField.ComputeField(indexableItem);

                // Assert
                result.Should().BeEquivalentTo(Enumerable.Empty<string>()
                    .Append(promoKey1)
                    .Append(promoKey2));
            }
        }

        [Fact]
        public void ComputeField_ReturnsNull_WhenPromoCollectionsEmpty()
        {
            // Arrange
            using (var db = new Db())
            {
                db.Add(new DbItem("Accommodation", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    { Constants.Fields.AccommodationItem.PromoCollections, string.Empty }
                });
                var item = db.GetItem("/sitecore/content/Accommodation");
                var indexableItem = new SitecoreIndexableItem(item);

                // Act
                var result = computedField.ComputeField(indexableItem);

                // Assert
                result.Should().BeNull();
            }
        }

        [Fact]
        public void ComputeField_ReturnsNull_WhenPromoCollectionsFieldMissing()
        {
            // Arrange
            using (var db = new Db())
            {
                db.Add(new DbItem("Accommodation", ID.NewID, Constants.TemplateIds.Accommodation));
                var item = db.GetItem("/sitecore/content/Accommodation");
                var indexableItem = new SitecoreIndexableItem(item);

                // Act
                var result = computedField.ComputeField(indexableItem);

                // Assert
                result.Should().BeNull();
            }
        }
    }
}