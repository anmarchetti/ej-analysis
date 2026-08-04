using System.Collections.Generic;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class AccommodationReferenceComputedFieldTests
    {
        private readonly AccommodationReferenceComputedField computedField;

        public AccommodationReferenceComputedFieldTests()
        {
            // Arrange
            computedField = Substitute.ForPartsOf<AccommodationReferenceComputedField>();
        }

        [Theory]
        [AutoDbData]
        public void ComputeReference_ShouldBeNull_IfNotValidTemplate(Db db, KeyValuePair<ID, ID> templateId)
        {
            // Arrange
            var child = GetDbItem(templateId.Value);
            var parent = GetDbItem(templateId.Key);
            parent.Children.Add(child);
            db.Add(parent);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(parent.ID));

            // Act
            var actual = computedField.ComputeReference(indexableItem, new KeyValuePair<ID, ID>(ID.NewID, ID.NewID), null) as List<string>;
            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void ComputeReference_ShouldBeEmpty_IfReferenceTypeIsNotValid(Db db, string fieldName, KeyValuePair<ID, ID> templateId)
        {
            // Arrange
            var folder = GetDbItem(ID.NewID);
            var parent = GetDbItem(templateId.Key);
            var child = GetDbItem(templateId.Value);
            child.Fields.Add(fieldName, string.Empty);
            parent.Children.Add(child);
            folder.Children.Add(parent);
            db.Add(folder);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(folder.ID));

            // Act
            var actual = computedField.ComputeReference(indexableItem, templateId, fieldName) as List<string>;

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoDbData]
        public void ComputeReference_ShouldBeNotEmpty_IfReferenceTypeIsValid(Db db, string fieldName, KeyValuePair<ID, ID> templateId)
        {
            // Arrange
            var folder = GetDbItem(ID.NewID);
            var parent = GetDbItem(templateId.Key);
            var child = GetDbItem(templateId.Value);
            child.Fields.Add(GetLookupField(db, fieldName));
            parent.Children.Add(child);
            folder.Children.Add(parent);
            db.Add(folder);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(folder.ID));

            // Act
            var actual = computedField.ComputeReference(indexableItem, templateId, fieldName) as List<string>;

            // Assert
            actual.Should().NotBeEmpty();
        }

        [Theory]
        [AutoData]

        public void GetMediaUrl_ShouldBeNull_IfMediaItemNull(Db db, string fieldName)
        {
            // Arrange
            var item = new DbItem("Item");
            item.Fields.Add(fieldName, string.Empty);
            db.Add(item);

            // Act
            var actual = db.GetItem(item.ID).GetMediaUrl(fieldName);

            // Assert
            actual.Should().BeNull();
        }

        public DbItem GetDbItem(ID templateId)
        {
            var itemDb = new DbItem("item")
            {
                TemplateID = templateId
            };
            return itemDb;
        }

        public DbField GetLookupField(Db db, string lookupFieldname)
        {
            var referenceDbItem = new DbItem("item");
            var referenceDbField = new DbField(lookupFieldname)
            {
                Type = "Lookup",
                Value = referenceDbItem.ID.ToString()
            };

            db.Add(referenceDbItem);
            return referenceDbField;
        }
    }
}
