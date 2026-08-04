using System.Linq;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.Destinations.Models.Domain;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class TransfersComputedFieldTests
    {
        private readonly TransfersComputedField computedField;
        private readonly Fixture fixture;
        private readonly Db db;

        public TransfersComputedFieldTests()
        {
            // Arrange
            computedField = new TransfersComputedField();
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void ComputeField_NotBeNull()
        {
            // Arrange
            var folder = new DbItem("folder", ID.NewID);
            var parent = new DbItem("parent", ID.NewID, Constants.AccommodationReferences.Transfers.Key);
            var child = new DbItem("child", ID.NewID, Constants.AccommodationReferences.Transfers.Value);
            parent.Children.Add(child);
            folder.Children.Add(parent);
            db.Add(folder);
            SitecoreIndexableItem indexableItem = new SitecoreIndexableItem(db.GetItem(folder.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem);

            // Assert
            actual.Should().NotBeNull();
        }

        [Theory]
        [AutoData]
        public void MapReference_FieldsDataShoudBeEquelToPassedData(
            string name,
            string code,
            string content,
            ContentByDate contentByDate)
        {
            // Arrange
            var referenceTypeItemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var referenceItemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var contentbyDateItemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            referenceTypeItemDb.Fields.Add(Constants.Fields.DatasourceItem.Name, name);
            referenceTypeItemDb.Fields.Add(Constants.Fields.DatasourceItem.Code, code);
            referenceItemDb.Fields.Add(Constants.Fields.AccommodationReferenceItem.Content, content);

            contentbyDateItemDb.Fields.Add(Constants.Fields.ContentByDateItem.StartDate, contentByDate.StartDate.ToString());
            contentbyDateItemDb.Fields.Add(Constants.Fields.ContentByDateItem.EndDate, contentByDate.EndDate.ToString());
            contentbyDateItemDb.Fields.Add(Constants.Fields.ContentByDateItem.Content, contentByDate.Content);

            referenceItemDb.Children.Add(contentbyDateItemDb);

            db.Add(referenceTypeItemDb);
            db.Add(referenceItemDb);

            // Act
            var actual = computedField.MapReference(db.GetItem(referenceTypeItemDb.ID), db.GetItem(referenceItemDb.ID)) as HotelTransfer;

            // Assert
            actual.Name.Should().BeEquivalentTo(name);
            actual.Code.Should().BeEquivalentTo(code);
            actual.Content.Should().BeEquivalentTo(content);
            actual.ContentByDate.ToList().Should().HaveCount(1);
        }
    }
}
