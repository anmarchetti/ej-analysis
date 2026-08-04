using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class BoardsComputedFieldTests
    {
        private readonly BoardsComputedField boardsComputedField;
        private readonly Fixture fixture;
        private readonly Db db;

        public BoardsComputedFieldTests()
        {
            // Arrange
            boardsComputedField = new BoardsComputedField();
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Theory]
        [AutoData]
        public void MapReference_FieldsDataShoudBeEquelToPassedData(
            string name,
            string itemName,
            string code,
            string content,
            string description)
        {
            // Arrange
            var referenceTypeItemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var referenceItemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var boardGroupItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            boardGroupItem.Fields.Add(Constants.Fields.DatasourceItem.Name, name);
            boardGroupItem.Fields.Add(Constants.Fields.DatasourceItem.Code, code);

            referenceTypeItemDb.Name = itemName;
            referenceTypeItemDb.Fields.Add(Constants.Fields.DatasourceItem.Name, name);
            referenceTypeItemDb.Fields.Add(Constants.Fields.DatasourceItem.Code, code);
            referenceTypeItemDb.Fields.Add(Constants.Fields.BoardTypeItem.BoardGroup, boardGroupItem.ID.ToString());
            referenceItemDb.Fields.Add(Constants.Fields.AccommodationReferenceItem.Content, content);
            referenceItemDb.Fields.Add(Constants.Fields.AccommodationReferenceItem.Description, description);

            db.Add(boardGroupItem);
            db.Add(referenceTypeItemDb);
            db.Add(referenceItemDb);

            // Act
            var actual = boardsComputedField.MapReference(
                db.GetItem(referenceTypeItemDb.ID),
                db.GetItem(referenceItemDb.ID)) as HotelBoard;

            // Assert
            actual.Name.Should().BeEquivalentTo(name);
            actual.ItemName.Should().BeEquivalentTo(itemName);
            actual.Code.Should().BeEquivalentTo(code);
            actual.Content.Should().BeEquivalentTo(content);
            actual.Description.Should().BeEquivalentTo(description);
            actual.IconUrl.Should().BeNull();
            actual.BoardGroup.Name.Should().BeEquivalentTo(name);
            actual.BoardGroup.Code.Should().BeEquivalentTo(code);
        }
    }
}
