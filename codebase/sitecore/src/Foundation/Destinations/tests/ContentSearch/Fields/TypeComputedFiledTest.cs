using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.Destinations.Tests.Mocks;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Sitecore.ContentSearch;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class TypeComputedFiledTest
    {
        private readonly TypeComputedField computedField;

        public TypeComputedFiledTest()
        {
            computedField = new TypeComputedField();
        }

        [Theory]
        [AutoDbData]
        public void ComputeField_FieldsDataShoudNotBeEmpty_IfTypesItemsNotNull(Db db, TypeDbItem type1, TypeDbItem type2)
        {
            // Arrange
            var item = new DbItem("Item")
            {
                new DbField(Constants.Fields.AccommodationItem.Types)
                {
                   Value = $"{type1.ID}|{type2.ID}"
                }
            };

            db.Add(item);

            SitecoreIndexableItem indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem) as string[];

            // Assert
            actual.Should().HaveCount(2);
        }

        [Fact]
        public void ComputeField_FieldsDataShoudBeNull_IfHotelItemIsNull()
        {
            // Act
            var actual = computedField.ComputeField(null) as string[];

            // Assert
            actual.Should().BeNull();
        }
    }
}
