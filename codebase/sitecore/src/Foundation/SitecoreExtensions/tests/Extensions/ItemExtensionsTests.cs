using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using FluentAssertions;
using NSubstitute;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb.Sites;
using Sitecore.NSubstituteUtils;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Extensions
{
    public class ItemExtensionsTests
    {
        [Fact]
        public void GetItemUrl_ShouldNotBeNullOrEmpty()
        {
            // Arrange
            var item = new FakeItem().ToSitecoreItem();
            var fakeSite = new FakeSiteContext(new StringDictionary
            {
                { "name", "website" }, { "database", "web" }
            });

            // Act
            using (new SiteContextSwitcher(fakeSite))
            {
                item.GetItemUrl().Should().NotBeNullOrEmpty();
            }
        }

        [Fact]
        public void HasBaseTemplate_ShouldBeFalse_IfItemIsNull()
        {
            // Act & Assert
            ((Item)null).HasBaseTemplate(new TemplateID()).Should().BeFalse();
        }

        [Fact]
        public void HasBaseTemplate_ShouldBeFalse_IfNotInheritsFromTemplate()
        {
            // Arrange
            var item = new FakeItem().WithTemplate(ID.NewID).ToSitecoreItem();

            // Act & Assert
            item.HasBaseTemplate(new TemplateID()).Should().BeFalse();
        }

        [Fact]
        public void HasBaseTemplate_ShouldBeTrue_IfTemplateMatches()
        {
            // Arrange
            var templateId = ID.NewID;
            var item = new FakeItem().WithTemplate(templateId).ToSitecoreItem();

            // Act & Assert
            item.HasBaseTemplate(new TemplateID(templateId)).Should().BeTrue();
        }

        [Fact]
        public void MergeMultiFields_ShouldBeEmpty_IfArgsAreNotValid()
        {
            // Act & Assert
            ((Item)null).MergeMultiFields(null, null).Should().BeEmpty();
            ((Item)null).MergeMultiFields(null, string.Empty).Should().BeEmpty();
        }

        [Fact]
        public void MergeMultiFields_ShouldMergeFields()
        {
            // Arrange
            var expectedValue = "{5881A41C-C587-4BDE-9D93-3C006314783C}|{3881A41C-C587-4BDE-9D93-3C006314783C}|{555555-C587-4BDE-9D93-3C006314783C}";
            var ids = new[] { "{5881A41C-C587-4BDE-9D93-3C006314783C}" };
            var fieldName = "TestField";
            var item = new FakeItem()
                .WithField(fieldName, "{3881A41C-C587-4BDE-9D93-3C006314783C}|{555555-C587-4BDE-9D93-3C006314783C}|")
                .ToSitecoreItem();

            // Act
            var actual = item.MergeMultiFields(ids, fieldName);

            // Assert
            actual.Should().Be(expectedValue);
        }

        [Fact]
        public void MergeMultiFields_ShouldReturnValueFromMultiField_IfIdsIsNull()
        {
            // Arrange
            var expectedValue = "{3881A41C-C587-4BDE-9D93-3C006314783C}|{555555-C587-4BDE-9D93-3C006314783C}";
            var fieldName = "TestField";
            var item = new FakeItem()
                .WithField(fieldName, expectedValue)
                .ToSitecoreItem();

            // Act
            var actual = item.MergeMultiFields(null, fieldName);

            // Assert
            actual.Should().Be(expectedValue);
        }

        [Fact]
        public void GetParentOfTemplate_ShouldBeNull_IfNoTemplateInDB()
        {
            // Arrange
            var item = new FakeItem().WithTemplate(ID.NewID).ToSitecoreItem();

            // Act& Assert
            item.GetParentOfTemplate(ID.NewID).Should().BeNull();
        }

        [Fact]
        public void GetParentOfTemplate_ShouldNotBeNull_IfItemHasParentOfTemplate()
        {
            // Arrange
            var templateId = ID.NewID;
            var item = new FakeItem()
                .WithTemplate(templateId)
                .ToSitecoreItem();

            // Act & Assert
            item.GetParentOfTemplate(templateId).Should().NotBeNull();
        }

        [Fact]
        public void IsLatestVersion_ShouldBeTrue_IfItemVersionIsLatest()
        {
            // Arrange
            var item = new FakeItem().WithItemVersions().ToSitecoreItem();

            // Act & Assert
            item.IsLatestVersion().Should().BeTrue();
        }

        [Fact]
        public void GetDescendantByField_ShouldFindDescendant_IfDescendantFieldExists()
        {
            // Arrange
            var fieldName = "fakeField";
            var fieldValue = "field-value";
            var descendant = new FakeItem()
                .WithItemAxes()
                .WithField(fieldName, fieldValue);
            var parent = new FakeItem()
                .WithChild(descendant)
                .WithItemAxes()
                .ToSitecoreItem();

            parent.Axes.SelectSingleItem(Arg.Any<string>()).Returns(descendant);

            // Act
            var actual = parent.GetDescendantByField(fieldName, fieldValue).Fields[fieldName].Value;

            // Assert
            actual.Should().BeEquivalentTo(fieldValue);
        }

        [Fact]
        public void HasTemplate_ShouldReturnTrue_IfItemIsInheritFromProvidedTemplate()
        {
            // Arrange
            var templateId = ID.NewID;
            ID[] templateCandidates = { templateId };
            var item = new FakeItem()
                .WithTemplate(templateId)
                .ToSitecoreItem();

            // Act
            var actual = item.HasTemplate(templateCandidates);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void HasTemplate_ShouldReturnFalse_IfTemplateCandidatesAreEmpty()
        {
            // Arrange
            var item = new FakeItem()
                .ToSitecoreItem();

            // Act
            var actual = item.HasTemplate(null);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void MergeMultiFields_ShouldExtendExistingMultiFieldList()
        {
            // Arrange
            IEnumerable<string> ids = new[] { ID.NewID.ToString() };
            var item = new FakeItem()
                .WithField(ID.NewID, "TestField", "{7A46355C-6F86-4C33-B157-1A6DDB524FA0}")
                .ToSitecoreItem();

            // Act
            var actual = item.MergeMultiFields(ids, "TestField");

            // Assert
            actual.Should().BeEquivalentTo(ids.FirstOrDefault() + "|{7A46355C-6F86-4C33-B157-1A6DDB524FA0}");
        }

        [Fact]
        public void MergeMultiFields_ShouldReturnMultiFieldValue_IfIdsNull()
        {
            // Arrange
            var testId = "{7A46355C-6F86-4C33-B157-1A6DDB524FA0}";
            var item = new FakeItem()
                .WithField(ID.NewID, "TestField", testId)
                .ToSitecoreItem();

            // Act
            var actual = item.MergeMultiFields(null, "TestField");

            // Assert
            actual.Should().BeEquivalentTo(testId);
        }

        [Fact]
        public void MergeMultiFields_ShouldReturnEmptyString_IfItemNull()
        {
            // Act
            var actual = ItemExtensions.MergeMultiFields(null, null, "anyString");
            // Assert
            actual.Should().BeEquivalentTo(string.Empty);
        }

        [Fact]
        public void LinkFieldUrl_ShouldReturnEmptyString_IfItemIsNull()
        {
            // Act
            var actual = ItemExtensions.LinkFieldUrl(null, "field");

            // Assert
            actual.Should().BeEquivalentTo(string.Empty);
        }

        [Fact]
        public void LinkFieldUrl_ShouldReturnEmptyString_IfFieldNameIsEmpty()
        {
            // Arrange
            var item = new FakeItem().ToSitecoreItem();

            // Act
            var actual = item.LinkFieldUrl(string.Empty);

            // Assert
            actual.Should().BeEquivalentTo(string.Empty);
        }

        [Fact]
        public void IsItemCloned_ShouldReturnFalse_IfItemIsNull()
        {
            // Act
            var actual = ItemExtensions.IsItemCloned(null);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void OriginalItem_ShouldReturnNull_IfItemIsNull()
        {
            // Act
            var actual = ItemExtensions.OriginalItem(null);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void GetItemsByTemplatesRecursive_ShouldReturnNull_IfItemIsNull()
        {
            // Act
            var actual = ItemExtensions.OriginalItem(null);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void CheckVersion_ShouldReturnNull_IfItemIsNull()
        {
            // Act
            var actual = ((IEnumerable<Item>)null).CheckVersion(null);

            // Assert
            actual.Should().BeEquivalentTo(Enumerable.Empty<Item>());
        }

        [Fact]
        public void BulkUpdate_ShouldReturnFalse_IfItemIsNull()
        {
            // Act/Assert
            ItemExtensions.BulkUpdate(null, null).Should().BeFalse();
        }

        [Fact]
        public void BulkUpdate_ShouldReturnFalse_IfChangesAreEmpty()
        {
            // Arrange
            var item = new FakeItem().ToSitecoreItem();

            // Act
            var actual = item.BulkUpdate(new Dictionary<string, string>());

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void BulkUpdate_ShouldReturnTrue_IfItemWasUpdated()
        {
            // Arrange
            var field = "FieldName";
            var fieldValue = "FieldValue";
            var item = new FakeItem().WithField(field, string.Empty).WithItemEditing().ToSitecoreItem();
            var changes = new Dictionary<string, string>
            {
                { field, fieldValue }
            };

            // Act
            var actual = item.BulkUpdate(changes);

            // Assert
            actual.Should().BeTrue();
            item.Fields[field].Value.Should().Be(fieldValue);
        }

        [Fact]
        public void BulkUpdate_ShouldReturnTrue_IfItemWasUpdated2()
        {
            // Arrange
            var field = "FieldName";
            var fieldValue = "FieldValue";
            var item = new FakeItem().WithField(field, string.Empty).WithItemEditing().ToSitecoreItem();

            // Act
            var actual = item.BulkUpdate(field, fieldValue);

            // Assert
            actual.Should().BeTrue();
            item.Fields[field].Value.Should().Be(fieldValue);
        }

        [Fact]
        public void BulkUpdate_ShouldReturnFalse_IfEmptyValuesAreNotAllowed()
        {
            // Arrange
            var field = "FieldName";
            var fieldValue = "FieldValue";
            var item = new FakeItem().WithField(field, fieldValue).WithItemEditing().ToSitecoreItem();
            var changes = new Dictionary<string, string>
            {
                { field, string.Empty }
            };

            // Act
            var actual = item.BulkUpdate(changes, false);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void BulkUpdate_ShouldReturnTrue_IfEmptyValuesAreAllowed()
        {
            // Arrange
            var field = "FieldName";
            var fieldValue = "FieldValue";
            var item = new FakeItem().WithField(field, fieldValue).WithItemEditing().ToSitecoreItem();
            var changes = new Dictionary<string, string>
            {
                { field, string.Empty }
            };

            // Act
            var actual = item.BulkUpdate(changes);

            // Assert
            actual.Should().BeTrue();
            item.Fields[field].Value.Should().Be(string.Empty);
        }

        [Fact]
        public void BulkUpdate_ShouldAddVersion()
        {
            // Arrange
            var field = "FieldName";
            var fieldValue = "FieldValue";
            var fakeItem = new FakeItem().WithField(field, fieldValue).WithItemEditing().WithItemVersions();
            var item = fakeItem.ToSitecoreItem();
            item.Versions.AddVersion().Returns(item);

            var changes = new Dictionary<string, string>
            {
                { field, string.Empty }
            };

            // Act
            var actual = item.BulkUpdate(changes, true, true);

            // Assert
            actual.Should().BeTrue();
            item.Versions.Received(1).AddVersion();
        }

        [Fact]
        public void HasValue_ShouldReturnTrue_IfFieldIsNotFound()
        {
            // Arrange
            var field = "UnknownField";
            var fieldValue = "FieldValue";
            var fakeItem = new FakeItem().WithField("test", string.Empty);
            var item = fakeItem.ToSitecoreItem();

            // Act
            var actual = item.HasValue(field, fieldValue, true);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void HasValue_ShouldReturnFalse_IfFieldIsFound()
        {
            // Arrange
            var field = "KnownField";
            var fieldValue = "FieldValue";
            var fakeItem = new FakeItem().WithField(field, string.Empty);
            var item = fakeItem.ToSitecoreItem();

            // Act
            var actual = item.HasValue(field, fieldValue, true);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void HasValue_ShouldReturnFalse_IfEmptyValuesAreAllowed()
        {
            // Arrange
            var field = "KnownField";
            var fieldValue = "FieldValue";
            var fakeItem = new FakeItem().WithField(field, fieldValue);
            var item = fakeItem.ToSitecoreItem();

            // Act
            var actual = item.HasValue(field, string.Empty, true);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void HasValue_ShouldReturnTrue_IfEmptyValuesAreNotAllowed()
        {
            // Arrange
            var field = "KnownField";
            var fieldValue = "FieldValue";
            var fakeItem = new FakeItem().WithField(field, fieldValue);
            var item = fakeItem.ToSitecoreItem();

            // Act
            var actual = item.HasValue(field, string.Empty, false);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void GetDecimal_ShouldReturnValue()
        {
            // Arrange
            string ToCultureString(decimal value) => value.ToString(CultureInfo.CurrentCulture);
            var field = "DecimalField";
            var fieldValue = 10.5m;
            var fakeItem = new FakeItem().WithField(field, ToCultureString(fieldValue));
            var item = fakeItem.ToSitecoreItem();

            // Act
            var actual = item.GetDecimal(field);

            // Assert
            actual.Should().NotBeNull();
            actual.Should().Be(fieldValue);
        }

        [Fact]
        public void GetDecimal_ShouldReturnNull_IfValueIsEmpty()
        {
            // Arrange
            var fakeItem = new FakeItem().WithField("test", string.Empty);
            var item = fakeItem.ToSitecoreItem();

            // Act
            var actual = item.GetDecimal("test");

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void GetDecimal_ShouldReturnNull_IfValueIsNull()
        {
            // Arrange
            var fakeItem = new FakeItem().WithField("test", null);
            var item = fakeItem.ToSitecoreItem();

            // Act
            var actual = item.GetDecimal("test");

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void GetInteger_ShouldReturnValue()
        {
            // Arrange
            var field = "IntegerField";
            var fieldValue = 10;
            var fakeItem = new FakeItem().WithField(field, fieldValue.ToString(CultureInfo.InvariantCulture));
            var item = fakeItem.ToSitecoreItem();

            // Act
            var actual = item.GetInteger(field);

            // Assert
            actual.Should().NotBeNull();
            actual.Should().Be(fieldValue);
        }

        [Fact]
        public void GetInteger_ShouldReturnNull_IfValueIsEmpty()
        {
            // Arrange
            var fakeItem = new FakeItem().WithField("test", string.Empty);
            var item = fakeItem.ToSitecoreItem();

            // Act
            var actual = item.GetInteger("test");

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void GetInteger_ShouldReturnNull_IfValueIsNull()
        {
            // Arrange
            var fakeItem = new FakeItem().WithField("test", null);
            var item = fakeItem.ToSitecoreItem();

            // Act
            var actual = item.GetInteger("test");

            // Assert
            actual.Should().BeNull();
        }
    }
}