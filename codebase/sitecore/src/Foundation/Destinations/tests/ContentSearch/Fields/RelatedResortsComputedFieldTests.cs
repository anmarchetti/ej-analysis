using AutoFixture;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using FluentAssertions;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class RelatedResortsComputedFieldTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly RelatedResortsComputedField computedField;

        public RelatedResortsComputedFieldTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            computedField = new RelatedResortsComputedField();
        }

        [Fact]
        public void IsValid_ShouldReturnTrue_IfItemHasVirtualResortTemplate()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.VirtualResort;

            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.IsValid(indexableItem);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void IsValid_ShouldReturnFalse_IfItemHasNonVirtualResortTemplate()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.Resort;

            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.IsValid(indexableItem);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void IsValid_ShouldReturnFalse_IfItemHasRandomTemplate()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = ID.NewID;

            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.IsValid(indexableItem);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void ComputeField_ShouldReturnResortCodes_IfVirtualResortHasRelatedResorts()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.VirtualResort;

            var resort = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var resortCodeField = new DbField(Constants.Fields.DatasourceItem.Code)
            {
                Value = "RESORT_CODE_1"
            };

            resort.Fields.Add(resortCodeField);

            var resortsField = new DbField(Constants.Fields.VirtualDestination.Resorts)
            {
                Value = resort.ID.ToString()
            };

            item.Fields.Add(resortsField);

            db.Add(resort);
            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem) as string[];

            // Assert
            actual.Should().NotBeNull();
            actual.Should().HaveCount(1);
            actual[0].Should().Be("RESORT_CODE_1");
        }

        [Fact]
        public void ComputeField_ShouldReturnMultipleCodes_IfVirtualResortHasMultipleRelatedResorts()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.VirtualResort;

            var resort1 = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            resort1.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = "RESORT_CODE_1" });

            var resort2 = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            resort2.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = "RESORT_CODE_2" });

            var resort3 = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            resort3.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = "RESORT_CODE_3" });

            var resortsField = new DbField(Constants.Fields.VirtualDestination.Resorts)
            {
                Value = $"{resort1.ID}|{resort2.ID}|{resort3.ID}"
            };

            item.Fields.Add(resortsField);

            db.Add(resort1);
            db.Add(resort2);
            db.Add(resort3);
            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem) as string[];

            // Assert
            actual.Should().NotBeNull();
            actual.Should().HaveCount(3);
            actual.Should().Contain("RESORT_CODE_1");
            actual.Should().Contain("RESORT_CODE_2");
            actual.Should().Contain("RESORT_CODE_3");
        }

        [Fact]
        public void ComputeField_ShouldReturnNull_IfItemDoesNotHaveRelatedResortsField()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.VirtualResort;

            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ComputeField_ShouldReturnEmptyArray_IfRelatedResortsFieldIsEmpty()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.VirtualResort;

            var resortsField = new DbField(Constants.Fields.VirtualDestination.Resorts)
            {
                Value = string.Empty
            };

            item.Fields.Add(resortsField);

            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem) as string[];

            // Assert
            actual.Should().BeEmpty();
        }

        [Fact]
        public void ComputeField_ShouldHandleResortWithoutCodeField()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.VirtualResort;

            var resort = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var resortsField = new DbField(Constants.Fields.VirtualDestination.Resorts)
            {
                Value = resort.ID.ToString()
            };

            item.Fields.Add(resortsField);

            db.Add(resort);
            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem) as string[];

            // Assert
            actual.Should().NotBeNull();
            actual.Should().HaveCount(1);
            actual[0].Should().BeNullOrEmpty();
        }

        [Fact]
        public void ComputeField_ShouldHandleMixOfResortsWithAndWithoutCodes()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.VirtualResort;

            var resortWithCode = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            resortWithCode.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = "RESORT_WITH_CODE" });

            var resortWithoutCode = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var resortWithEmptyCode = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            resortWithEmptyCode.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = string.Empty });

            var resortsField = new DbField(Constants.Fields.VirtualDestination.Resorts)
            {
                Value = $"{resortWithCode.ID}|{resortWithoutCode.ID}|{resortWithEmptyCode.ID}"
            };

            item.Fields.Add(resortsField);

            db.Add(resortWithCode);
            db.Add(resortWithoutCode);
            db.Add(resortWithEmptyCode);
            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem) as string[];

            // Assert
            actual.Should().NotBeNull();
            actual.Should().HaveCount(3);
            actual.Should().Contain("RESORT_WITH_CODE");
        }
    }
}
