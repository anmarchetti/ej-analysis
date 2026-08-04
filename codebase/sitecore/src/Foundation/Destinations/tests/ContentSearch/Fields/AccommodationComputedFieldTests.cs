using AutoFixture;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class AccommodationComputedFieldTests
    {
        private readonly AccommodationComputedField accommodationComputedField;
        private readonly Fixture fixture;
        private readonly Db db;

        public AccommodationComputedFieldTests()
        {
            // Arrange
            accommodationComputedField = Substitute.ForPartsOf<AccommodationComputedField>();
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void IsValid_ShouldBeTrue_IfValidTemplate()
        {
            // Asert
            var itemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            itemDb.TemplateID = Constants.TemplateIds.Accommodation;
            db.Add(itemDb);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(itemDb.ID));

            // Act
            var actual = accommodationComputedField.IsValid(indexableItem);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void IsValid_ShouldBeFalse_IfNotValidTemplate()
        {
            // Asert
            var itemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            itemDb.TemplateID = Constants.TemplateIds.AccommodationBoard;
            db.Add(itemDb);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(itemDb.ID));

            // Act
            var actual = accommodationComputedField.IsValid(indexableItem);

            // Assert
            actual.Should().BeFalse();
        }
    }
}
