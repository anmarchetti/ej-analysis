using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Tests.Infrastructures;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Newtonsoft.Json;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class ChildrenComputedFieldTest
    {
        private readonly ChildrenComputedField computedField;

        public ChildrenComputedFieldTest()
        {
            // Arrange
            computedField = new ChildrenComputedField();
        }

        [Theory]
        [AutoDbData]
        public void IsValid_ShouldBeTrue_IfValidTemplate(Item item)
        {
            // Arrange
            using (new EditContext(item))
            {
                item.TemplateID = Constants.TemplateIds.Country;
            }

            // Act
            var actual = computedField.IsValid(new SitecoreIndexableItem(item));

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoDbData]
        public void IsValid_ShouldBeFalse_IfNoValidTemplate(Item item)
        {
            // Act
            var actual = computedField.IsValid(new SitecoreIndexableItem(item));

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoDbData]
        public void ComputeField_ShouldNotBeNotNull_IfParentHasValidTemplate(Item country, LocationTemplate template)
        {
            // Arrange
            country.Add("child", new TemplateID(template.ID));

            var countryIndexableItem = new SitecoreIndexableItem(country);

            // Act
            var actual = computedField.ComputeField(countryIndexableItem) as List<string>;

            // Assert
            actual.Should().NotBeEmpty();
        }

        [Fact]
        public void ComputeField_ShouldExcludeNonDestinationItems()
        {
            using (var db = new Db())
            {
                var parent = new DbItem("Country", ID.NewID, Constants.TemplateIds.Country);
                var resortChild = new DbItem("Resort", ID.NewID, Constants.TemplateIds.Resort)
                {
                    ParentID = parent.ID
                };
                resortChild.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = "RES1" });
                resortChild.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Name) { Value = "Resort 1" });
                var nonDestinationChild = new DbItem("RandomItem", ID.NewID, ID.NewID) { ParentID = parent.ID };

                db.Add(parent);
                db.Add(resortChild);
                db.Add(nonDestinationChild);

                var actual = computedField.ComputeField(new SitecoreIndexableItem(db.GetItem(parent.ID))) as List<string>;

                actual.Should().HaveCount(1); // Only resort should be included
            }
        }

        [Fact]
        public void ComputeField_ShouldSetRelatedRegions_ForVirtualRegionChild()
        {
            using (var db = new Db())
            {
                var parent = new DbItem("Country", ID.NewID, Constants.TemplateIds.Country);
                var relatedRegion = new DbItem("Region1", ID.NewID, Constants.TemplateIds.Location);
                relatedRegion.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = "REG1" });

                var virtualRegionChild = new DbItem("VirtualRegion", ID.NewID, Constants.TemplateIds.VirtualRegion)
                {
                    ParentID = parent.ID
                };
                virtualRegionChild.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = "VR1" });
                virtualRegionChild.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Name) { Value = "Virtual Region 1" });
                virtualRegionChild.Fields.Add(new DbField(Constants.Fields.VirtualDestination.Regions) { Value = relatedRegion.ID.ToString() });

                db.Add(relatedRegion);
                db.Add(parent);
                db.Add(virtualRegionChild);

                var actual = computedField.ComputeField(new SitecoreIndexableItem(db.GetItem(parent.ID))) as List<string>;
                var destination = JsonConvert.DeserializeObject<Destination>(actual[0]);

                destination.RelatedRegions.Should().Contain("REG1");
            }
        }

        [Fact]
        public void ComputeField_ShouldSetRelatedResorts_ForVirtualResortChild()
        {
            using (var db = new Db())
            {
                var parent = new DbItem("Country", ID.NewID, Constants.TemplateIds.Country);
                var relatedResort = new DbItem("Resort1", ID.NewID, Constants.TemplateIds.Resort);
                relatedResort.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = "RES1" });

                var virtualResortChild = new DbItem("VirtualResort", ID.NewID, Constants.TemplateIds.VirtualResort)
                {
                    ParentID = parent.ID
                };
                virtualResortChild.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = "VRS1" });
                virtualResortChild.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Name) { Value = "Virtual Resort 1" });
                virtualResortChild.Fields.Add(new DbField(Constants.Fields.VirtualDestination.Resorts) { Value = relatedResort.ID.ToString() });

                db.Add(relatedResort);
                db.Add(parent);
                db.Add(virtualResortChild);

                var actual = computedField.ComputeField(new SitecoreIndexableItem(db.GetItem(parent.ID))) as List<string>;
                var destination = JsonConvert.DeserializeObject<Destination>(actual[0]);

                destination.RelatedResorts.Should().Contain("RES1");
            }
        }

        [Fact]
        public void ComputeField_ShouldSortChildrenByDisplayName_ForCountryTemplate()
        {
            using (var db = new Db())
            {
                var parent = new DbItem("Country", ID.NewID, Constants.TemplateIds.Country);
                var child1 = new DbItem("Beach Resort", ID.NewID, Constants.TemplateIds.Resort)
                {
                    ParentID = parent.ID
                };
                child1.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = "BEACH" });
                child1.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Name) { Value = "Beach Resort" });
                child1.Fields.Add(new DbField("__Display name") { Value = "Beach Resort" });

                var child2 = new DbItem("Alpine Resort", ID.NewID, Constants.TemplateIds.Resort)
                {
                    ParentID = parent.ID
                };
                child2.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = "ALPINE" });
                child2.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Name) { Value = "Alpine Resort" });
                child2.Fields.Add(new DbField("__Display name") { Value = "Alpine Resort" });

                db.Add(parent);
                db.Add(child1);
                db.Add(child2);

                var actual = computedField.ComputeField(new SitecoreIndexableItem(db.GetItem(parent.ID))) as List<string>;
                var destinations = actual.Select(x => JsonConvert.DeserializeObject<Destination>(x)).ToList();

                destinations[0].Code.Should().Be("ALPINE"); // Sorted alphabetically
                destinations[1].Code.Should().Be("BEACH");
            }
        }
    }
}