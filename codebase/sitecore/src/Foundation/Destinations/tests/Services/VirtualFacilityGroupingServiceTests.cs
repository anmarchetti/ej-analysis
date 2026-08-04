using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.Multisite;
using FluentAssertions;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class VirtualFacilityGroupingServiceTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly FakeSiteContext fakeSite;
        private SitecoreIndexableItem indexableItem;
        private VirtualFacilityGroupingService service;

        public VirtualFacilityGroupingServiceTests()
        {
            // Arrange
            service = new VirtualFacilityGroupingService();
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            fakeSite = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "Holidays" },
                    { "database", "master" },
                    { "rootPath", @"/sitecore/content/EasyJet/Holidays" }
                });

            Init();
        }

        [Theory]
        [AutoData]
        public void MapFacilities_ShouldMapFacilityCorrectly(Db db)
        {
            var foodTab = new FakeItem();
            foodTab.WithTemplate(Constants.TemplateIds.FoodAndDrinkFacilityRichTextTab);
            foodTab.WithField(Constants.Fields.FacilityRichTextTab.Description, "test");

            var fakeItem = new FakeItem();
            fakeItem.WithTemplate(Constants.TemplateIds.FoodAndDrinkFacilityVirtualGrouping);
            fakeItem.WithField(Constants.Fields.AccommodationItem.OverviewDescription, "test");
            fakeItem.WithChild(foodTab);

            var sitecoreItem = fakeItem.ToSitecoreItem();
            // Act
            var actual = service.MapFacilities(VirtualFacilityGroupingServiceData.VirtualGroups, VirtualFacilityGroupingServiceData.HotelFacility, sitecoreItem);

            // Assert
            actual.Should().HaveCount(2);
            actual[0].Items.Should().HaveCount(2); // accommodation
            actual[1].Items.Should().HaveCount(1); // food
        }

        [Fact]
        public void GetAllVirtualFacilities_ShouldBeNotEmpty_IfHasFacilityVirtualGroup()
        {
            using (new FakeSiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = service.GetAllVirtualFacilities(indexableItem);

                // Assert
                actual.Should().NotBeEmpty();
            }
        }

        [Fact]
        public void GetAllVirtualFacilities_ShouldBeEmpty_IfHasNoFacilityVirtualGroup()
        {
            // Arrange
            Db db = new Db();

            var itemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(itemDb);

            using (new FakeSiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = service.GetAllVirtualFacilities(db.GetItem(itemDb.ID));

                // Assert
                actual.Should().BeEmpty();
            }
        }

        private void Init()
        {
            var accomadation = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var easyJet = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            easyJet.Name = "easyJet";

            var holidays = new DbItem("Holidays");
            easyJet.Add(holidays);

            var data = new DbItem("Data", ID.NewID, Templates.Data.Id);
            holidays.Add(data);

            var virtualFolder = fixture.Build<DbItem>().Create();
            virtualFolder.TemplateID = Constants.TemplateIds.FacilityVirtualGroupingFolder;
            data.Add(virtualFolder);
            data.Add(accomadation);

            var virtualGroup = fixture.Build<DbItem>().Create();
            virtualGroup.TemplateID = Constants.TemplateIds.FacilityVirtualGroupingFolder;

            virtualGroup.Fields.Add(Constants.Fields.DatasourceItem.Name);
            virtualGroup.Fields.Add(Constants.Fields.AccommodationReferenceItem.Icon);

            virtualFolder.Add(virtualGroup);

            db.Add(easyJet);

            indexableItem = new SitecoreIndexableItem(db.GetItem(accomadation.ID));
        }
    }
}
