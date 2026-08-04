using System.Collections.Generic;
using AutoFixture;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using FluentAssertions;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class TrackingIdComputedFieldTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly TrackingIdComputedField computedField;

        public TrackingIdComputedFieldTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            computedField = new TrackingIdComputedField();
        }

        [Theory]
        [MemberData(nameof(ValidTemplates))]
        public void IsValid_ShouldReturnTrue_IfItemHasValidTemplate(ID templateId)
        {
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = templateId;
            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            var actual = computedField.IsValid(indexableItem);

            actual.Should().BeTrue();
        }

        [Fact]
        public void IsValid_ShouldReturnFalse_IfItemHasUnknownTemplate()
        {
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = ID.NewID;
            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            var actual = computedField.IsValid(indexableItem);

            actual.Should().BeFalse();
        }

        [Fact]
        public void ComputeField_ShouldReturnItemName_AsEnglishTrackingId_WhenSingleLanguage()
        {
            var expectedName = "TrackingItemName";
            var item = new DbItem(expectedName, ID.NewID, Constants.TemplateIds.Resort)
            {
                new DbField(Constants.Fields.DatasourceItem.Code) { Value = "TFS" }
            };
            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            var actual = computedField.ComputeField(indexableItem);

            actual.Should().Be(expectedName);
        }

        public static IEnumerable<object[]> ValidTemplates => new[]
        {
            new object[] { Constants.TemplateIds.Country },
            new object[] { Constants.TemplateIds.Location },
            new object[] { Constants.TemplateIds.LocationCity },
            new object[] { Constants.TemplateIds.Resort },
            new object[] { Constants.TemplateIds.Accommodation },
            new object[] { Constants.TemplateIds.VirtualCountry },
            new object[] { Constants.TemplateIds.VirtualRegion },
            new object[] { Constants.TemplateIds.VirtualResort },
            new object[] { Constants.TemplateIds.AirportsGroup },
            new object[] { Constants.TemplateIds.Airport },
        };
    }
}
