using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Newtonsoft.Json;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class BoardGroupComputedFieldTests
    {
        private readonly BoardGroupComputedField boardGroupComputedField;
        private readonly Fixture fixture;
        private readonly Db db;

        public BoardGroupComputedFieldTests()
        {
            boardGroupComputedField = new BoardGroupComputedField();
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void IsValid_ShouldReturnTrue_IfIndexableItemHasValidTemplate()
        {
            // Arrange
            var boardItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            boardItem.TemplateID = Constants.TemplateIds.BoardType;

            db.Add(boardItem);

            // Act
            var actual = boardGroupComputedField.IsValid(db.GetItem(boardItem.ID));

            // Assert
            actual.Should().Be(true);
        }

        [Fact]
        public void IsValid_ShouldReturnFalse_IfIndexableItemHasNotValidTemplate()
        {
            // Arrange
            var boardItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            db.Add(boardItem);

            // Act
            var actual = boardGroupComputedField.IsValid(db.GetItem(boardItem.ID));

            // Assert
            actual.Should().Be(false);
        }

        [Fact]
        public void ComputeField_ShouldReturnNull_IfGroupItemNotSetted()
        {
            // Arrange
            var boardItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(boardItem);

            // Act
            var actual = boardGroupComputedField.ComputeField(db.GetItem(boardItem.ID));

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void ComputeField_ShouldRightData_IfGroupItemIsSetted(string boardName, string boardCode)
        {
            // Arrange
            var boardItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var boardGroupItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var boardGroupNameField = CreateDbField(Constants.Fields.DatasourceItem.Name, boardName);
            var boardGroupCodeField = CreateDbField(Constants.Fields.DatasourceItem.Code, boardCode);

            boardGroupItem.Fields.Add(boardGroupNameField);
            boardGroupItem.Fields.Add(boardGroupCodeField);

            var boardGroupField = new DbField(Constants.Fields.BoardTypeItem.BoardGroup)
            {
                Type = "Lookup",
                Value = boardGroupItem.ID.ToString()
            };

            boardItem.Fields.Add(boardGroupField);

            db.Add(boardItem);
            db.Add(boardGroupItem);

            // Act
            var actual = JsonConvert.DeserializeObject<DatasourceObject>(boardGroupComputedField.ComputeField(db.GetItem(boardItem.ID)).ToString());

            // Assert
            actual.Name.Should().Be(boardName);
            actual.Code.Should().Be(boardCode);
        }

        private DbField CreateDbField(string fieldName, string fieldValue)
        {
            return new DbField(fieldName)
            {
                Value = fieldValue
            };
        }
    }
}
