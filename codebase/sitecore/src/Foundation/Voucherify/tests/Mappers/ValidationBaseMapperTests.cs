using System.Collections.Generic;
using AutoFixture;
using easyJet.Foundation.Destinations.Models.Domain;
using easyjet.Foundation.Testing.Attributes;
using easyJet.Foundation.Voucherify.Mappers;
using easyJet.Foundation.Voucherify.Models.Domain.Validation;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Web.UI.XslControls;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.Mappers
{
    public class ValidationBaseMapperTests
    {
        private class ValidationBaseWithParentMapperMock : ValidationBaseMapper
        {
            public ValidationRule<List<DatasourceObject>> ParentValidationRule { get; set; }

            public ValidationBaseWithParentMapperMock(Item item, string placeholder)
            {
                ParentValidationRule = GetWithParentValidationRule(
                    BuildDatasourceItem(item, "FakeField"),
                    item,
                    "FakeField",
                    item["errorCode"],
                    placeholder);
            }
        }

        [Fact]
        public void GetWithParentValidationRule_Success()
        {
            // Arrange
            var fixture = new Fixture();
            var db = fixture.Freeze<Db>();
            var fieldId = ID.NewID;
            var dbItem = new DbItem("Fake");
            dbItem.Fields.Add(new DbField("FakeField", fieldId));
            dbItem.Fields.Add(new DbField("testField"));
            dbItem.Fields.Add(new DbField("errorCode"));

            var item1 = new DbItem("item1");
            item1.Fields.Add(new DbField("test") { Value = "item1" });

            var item2 = new DbItem("item2");
            item1.Fields.Add(new DbField("test") { Value = "item2" });

            var item3 = new DbItem("item3");
            item1.Fields.Add(new DbField("test") { Value = "item3" });

            db.Add(dbItem);
            db.Add(item1);
            db.Add(item2);
            db.Add(item3);

            var item = db.GetItem(dbItem.ID);

            var value = $"{item1.ID.Guid.ToString()}|{item2.ID.Guid.ToString()}|{item3.ID.Guid.ToString()}";
            item.Editing.BeginEdit();
            MultilistField multilistField = new MultilistField(item.Fields["FakeField"]) { Value = value };
            item.Fields["errorCode"].Value = "errorCode";
            item.Fields["testField"].Value = "test";
            item.Editing.EndEdit();

            // Act
            var result = new ValidationBaseWithParentMapperMock(item, "error");

            // Assert
            result.Should().NotBeNull();
            result.ParentValidationRule.Should().NotBeNull();
            result.ParentValidationRule.Criteria.Should().NotBeEmpty();
            result.ParentValidationRule.Criteria.Count.Should().Be(3);
            result.ParentValidationRule.Criteria[0].ItemName.Should().Be("item1");
            result.ParentValidationRule.Criteria[1].ItemName.Should().Be("item2");
            result.ParentValidationRule.Criteria[2].ItemName.Should().Be("item3");
        }

        [Fact]
        public void GetWithParentValidationRule_ValidationRulesNull()
        {
            // Arrange
            var fixture = new Fixture();
            var db = fixture.Freeze<Db>();
            var fieldId = ID.NewID;
            var dbItem = new DbItem("Fake");
            dbItem.Fields.Add(new DbField("FakeField", fieldId));
            dbItem.Fields.Add(new DbField("testField"));
            dbItem.Fields.Add(new DbField("errorCode"));

            db.Add(dbItem);

            var item = db.GetItem(dbItem.ID);

            var value = string.Empty;
            item.Editing.BeginEdit();
            MultilistField multilistField = new MultilistField(item.Fields["FakeField"]) { Value = value };
            item.Fields["errorCode"].Value = "errorCode";
            item.Fields["testField"].Value = "test";
            item.Editing.EndEdit();

            // Act
            var result = new ValidationBaseWithParentMapperMock(item, "error");

            // Assert
            result.Should().NotBeNull();
            result.ParentValidationRule.Should().BeNull();
        }

        [Fact]
        public void GetWithParentValidationRule_ValidationRulesNotNull_PlaceholderIsEmpty()
        {
            // Arrange
            var fixture = new Fixture();
            var db = fixture.Freeze<Db>();
            var fieldId = ID.NewID;
            var dbItem = new DbItem("Fake");
            dbItem.Fields.Add(new DbField("FakeField", fieldId));
            dbItem.Fields.Add(new DbField("testField"));
            dbItem.Fields.Add(new DbField("errorCode"));

            var item1 = new DbItem("item1");
            item1.Fields.Add(new DbField("test") { Value = "item1" });

            var item2 = new DbItem("item2");
            item1.Fields.Add(new DbField("test") { Value = "item2" });

            var item3 = new DbItem("item3");
            item1.Fields.Add(new DbField("test") { Value = "item3" });

            db.Add(dbItem);
            db.Add(item1);
            db.Add(item2);
            db.Add(item3);

            var item = db.GetItem(dbItem.ID);

            var value = $"{item1.ID.Guid.ToString()}|{item2.ID.Guid.ToString()}|{item3.ID.Guid.ToString()}";
            item.Editing.BeginEdit();
            var multilistField = new MultilistField(item.Fields["FakeField"]) { Value = value };
            item.Fields["errorCode"].Value = "errorCode";
            item.Fields["testField"].Value = "test";
            item.Editing.EndEdit();

            // Act
            var result = new ValidationBaseWithParentMapperMock(item, string.Empty);
            var resultMessage = result.ParentValidationRule.ValidationResult.Message;

            // Assert
            result.Should().NotBeNull();
            result.ParentValidationRule.Should().NotBeNull();
            resultMessage.Should().NotBeEmpty();
            resultMessage.Should().Contain(".errorCode");
        }
    }
}