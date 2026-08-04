using AutoFixture;
using easyJet.Foundation.Atcom.Services;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.Destinations.Repositories;
using FluentAssertions;
using NSubstitute;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Atcom.Tests.Services
{
    public class RegionRestrictionServiceTest
    {
        private readonly ISearchDatasourceRepository searchDatasource;
        private readonly RegionRestrictionService sut;
        private readonly Fixture fixture;
        private readonly Db db;

        public RegionRestrictionServiceTest()
        {
            // Arrange
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            searchDatasource = Substitute.For<ISearchDatasourceRepository>();
            sut = new RegionRestrictionService(searchDatasource);
        }

        [Fact]
        public void GetSettingsItem_ShouldBeNull()
        {
            // Act
            var actual = sut.GetSettingsItem("null");

            // Assert
            Assert.Null(actual);
        }

        [Fact]
        public void GetSettingsItem_ShouldNotBeNull()
        {
            // Act
            var settingDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(settingDbItem);
            var actual = sut.GetSettingsItem(settingDbItem.FullPath);

            // Assert
            Assert.NotNull(actual);
            Assert.Equal(settingDbItem.ID, actual.ID);
        }

        [Fact]
        public void GetRegionRestrictionItems_ShouldBeEmpty()
        {
            var settingDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(settingDbItem);
            var settingsItem = db.GetItem(settingDbItem.FullPath);

            // Act
            var actual = sut.GetRegionRestrictionItems(settingsItem);

            // Assert
            actual.Should().BeEmpty();
        }

        [Fact]
        public void GetRegionRestrictionItems_ShouldNotBeEmpty()
        {
            var settingDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var regionDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            settingDbItem.Fields.Add(Constants.Atcom.Fields.RoomTypeFacilitiesSyncRegionRestriction, regionDbItem.ID.ToString());
            db.Add(settingDbItem);

            regionDbItem.TemplateID = Constants.TemplateIds.RegionPage;
            regionDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, "code");
            db.Add(regionDbItem);

            var regionItem = db.GetItem(regionDbItem.FullPath);
            var settingsItem = db.GetItem(settingDbItem.FullPath);
            searchDatasource.GetItemByCode("code", Constants.TemplateIds.RegionPage, false).Returns(regionItem);

            // Act
            var actual = sut.GetRegionRestrictionItems(settingsItem).Count;

            // Assert
            actual.Should().Be(1);
        }
    }
}