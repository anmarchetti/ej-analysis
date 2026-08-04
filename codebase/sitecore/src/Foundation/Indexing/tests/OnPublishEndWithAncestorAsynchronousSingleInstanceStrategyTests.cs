using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.ContentSearch;
using Sitecore.ContentSearch.Maintenance.Strategies.Models;
using Sitecore.Data;
using Sitecore.Data.Eventing.Remote;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.NSubstituteUtils;
using Xunit;
using Constants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Foundation.Indexing.Tests
{
    public class OnPublishEndWithAncestorAsynchronousSingleInstanceStrategyTests
    {
        private const string HotelTemplateId = "{28E5E169-8F72-4F90-A277-280A8302B607}";
        private const string DescendantsTemplateIds = "{5C397782-6810-460A-AB57-84E9AB67514C}|{803E75ED-804E-4900-97D6-7BCC046C8385}|{AA2B6E6C-AE94-4E48-AE95-D77DA154FE9B}|{B1E9284E-A714-45EE-84CB-0A1ADB630306}|{1762DFC8-B872-41A2-A7C1-A54B93DD6CCD}|{BA1EC5C3-14C7-40B3-8B69-D020590DA1F3}|{EA39971C-094D-4BEC-A479-9171279553C0}|{1EC134E4-4753-498E-9D1A-6DC67A8975BE}|{AF7DAAA8-8099-4F22-A607-F0E1FBA6AD0D}|{E4B3BB73-22AB-4843-A816-3AA32EDDC7DC}|{D91DEBBE-FF68-4C69-AA6E-2425451C2786}";
        private readonly OnPublishEndWithAncestorAsynchronousSingleInstanceStrategy sut;

        public OnPublishEndWithAncestorAsynchronousSingleInstanceStrategyTests()
        {
            sut = Substitute.ForPartsOf<OnPublishEndWithAncestorAsynchronousSingleInstanceStrategy>("master");
        }

        [Fact]
        public void IndexParentItem()
        {
            // Arrange
            var fakeDB = ArrangeDatabase(out var homeItem, out var hotelItem, out var accommodationFacilityFolderItem, out var accommodationFacilityItem, out var accommodationFacilityItem2, SetupAxes);
            var indexableInfoModels = GetIndexableInfoModels(accommodationFacilityItem, accommodationFacilityItem2);

            ArrangeSubstitute(fakeDB, HotelTemplateId, DescendantsTemplateIds);

            // Act
            sut.EnrichDataWithAncestorItems(indexableInfoModels);

            indexableInfoModels.Count.Should().Be(3);
            indexableInfoModels.Select(i => i.Key.ItemID).Should().Contain(hotelItem.ID);
        }

        [Fact]
        public void IndexParentItem_AncestorTemplateIdIsNotSet()
        {
            // Arrange
            var fakeDB = ArrangeDatabase(out var homeItem, out var hotelItem, out var accommodationFacilityFolderItem, out var accommodationFacilityItem, out var accommodationFacilityItem2, SetupAxes);
            var indexableInfoModels = GetIndexableInfoModels(accommodationFacilityItem, accommodationFacilityItem2);

            ArrangeSubstitute(fakeDB, null, DescendantsTemplateIds);

            // Act
            sut.EnrichDataWithAncestorItems(indexableInfoModels);

            indexableInfoModels.Count.Should().Be(2);
            indexableInfoModels.Select(i => i.Key.ItemID).Should().NotContain(hotelItem.ID);
        }

        [Fact]
        public void IndexParentItem_DescendantsTemplateIdsIsNotSet()
        {
            // Arrange
            var fakeDB = ArrangeDatabase(out var homeItem, out var hotelItem, out var accommodationFacilityFolderItem, out var accommodationFacilityItem, out var accommodationFacilityItem2, SetupAxes);
            var indexableInfoModels = GetIndexableInfoModels(accommodationFacilityItem, accommodationFacilityItem2);

            ArrangeSubstitute(fakeDB, HotelTemplateId, string.Empty);

            // Act
            sut.EnrichDataWithAncestorItems(indexableInfoModels);

            indexableInfoModels.Count.Should().Be(2);
            indexableInfoModels.Select(i => i.Key.ItemID).Should().NotContain(hotelItem.ID);
        }

        [Fact]
        public void IndexParentItem_AncestorsAreEmpty()
        {
            // Arrange
            var fakeDB = ArrangeDatabase(out var homeItem, out var hotelItem, out var accommodationFacilityFolderItem, out var accommodationFacilityItem, out var accommodationFacilityItem2, (item, items) => { SetupAxes(item, Array.Empty<Item>()); });
            var indexableInfoModels = GetIndexableInfoModels(accommodationFacilityItem, accommodationFacilityItem2);

            ArrangeSubstitute(fakeDB, HotelTemplateId, DescendantsTemplateIds);

            // Act
            sut.EnrichDataWithAncestorItems(indexableInfoModels);

            indexableInfoModels.Count.Should().Be(2);
            indexableInfoModels.Select(i => i.Key.ItemID).Should().NotContain(hotelItem.ID);
        }

        [Fact]
        public void IndexParentItem_IndexableInfoModel_ItemUriIsNotSet()
        {
            // Arrange
            var fakeDB = ArrangeDatabase(out var homeItem, out var hotelItem, out var accommodationFacilityFolderItem, out var accommodationFacilityItem, out var accommodationFacilityItem2, SetupAxes);

            var indexableInfoModels = new List<IndexableInfoModel>();
            var dataUri = new DataUri(accommodationFacilityItem.ID);
            var sitecoreItemUniqueId = new SitecoreItemUniqueId(string.Empty);
#pragma warning disable SA1121
            var indexableInfoModel = new IndexableInfoModel(dataUri, sitecoreItemUniqueId, new CreatedItemRemoteEvent(accommodationFacilityItem, accommodationFacilityItem), Int64.MaxValue);
#pragma warning restore SA1121

            indexableInfoModels.Add(indexableInfoModel);

            ArrangeSubstitute(fakeDB, HotelTemplateId, DescendantsTemplateIds);

            // Act
            sut.EnrichDataWithAncestorItems(indexableInfoModels);

            indexableInfoModels.Count.Should().Be(1);
            indexableInfoModels.Select(i => i.Key.ItemID).Should().NotContain(hotelItem.ID);
        }

        [Fact]
        public void IndexParentItem_IndexableInfoModel_RemoteEventIsDeletedItemRemoteEvent()
        {
            // Arrange
            var fakeDB = ArrangeDatabase(out var homeItem, out var hotelItem, out var accommodationFacilityFolderItem, out var accommodationFacilityItem, out var accommodationFacilityItem2, SetupAxes);

            var indexableInfoModels = new List<IndexableInfoModel>();
            var dataUri = new DataUri(accommodationFacilityItem.ID);
            var sitecoreItemUniqueId = new SitecoreItemUniqueId(((Item)accommodationFacilityItem).Uri);
#pragma warning disable SA1121
            var indexableInfoModel = new IndexableInfoModel(dataUri, sitecoreItemUniqueId, new DeletedItemRemoteEvent(accommodationFacilityItem, accommodationFacilityFolderItem.ID), Int64.MaxValue);
#pragma warning restore SA1121

            indexableInfoModels.Add(indexableInfoModel);

            ArrangeSubstitute(fakeDB, HotelTemplateId, DescendantsTemplateIds);

            // Act
            sut.EnrichDataWithAncestorItems(indexableInfoModels);

            indexableInfoModels.Count.Should().Be(2);
            indexableInfoModels.Select(i => i.Key.ItemID).Should().Contain(hotelItem.ID);
        }

        private static List<IndexableInfoModel> GetIndexableInfoModels(FakeItem accommodationFacilityItem, FakeItem accommodationFacilityItem2)
        {
            var indexableInfoModels = new List<IndexableInfoModel>();

            var dataUri = new DataUri(accommodationFacilityItem.ID);
            var sitecoreItemUniqueId = new SitecoreItemUniqueId(((Item)accommodationFacilityItem).Uri);
#pragma warning disable SA1121
            var indexableInfoModel = new IndexableInfoModel(dataUri, sitecoreItemUniqueId, new CreatedItemRemoteEvent(accommodationFacilityItem, accommodationFacilityItem), Int64.MaxValue);
#pragma warning restore SA1121

            var dataUri2 = new DataUri(accommodationFacilityItem2.ID);
            var sitecoreItemUniqueId2 = new SitecoreItemUniqueId(((Item)accommodationFacilityItem2).Uri);
#pragma warning disable SA1121
            var indexableInfoModel2 = new IndexableInfoModel(dataUri2, sitecoreItemUniqueId2, new CreatedItemRemoteEvent(accommodationFacilityItem2, accommodationFacilityItem2), Int64.MaxValue);
#pragma warning restore SA1121

            indexableInfoModels.Add(indexableInfoModel);
            indexableInfoModels.Add(indexableInfoModel2);
            return indexableInfoModels;
        }

        private static void SetupAxes(FakeItem item, Item[] ancestors)
        {
            var accommodationFacilityItem2Axes = Substitute.For<ItemAxes>(item.ToSitecoreItem());
            accommodationFacilityItem2Axes.Configure().GetAncestors().ReturnsForAnyArgs(ancestors);
            item.WithItemAxes(accommodationFacilityItem2Axes);
        }

        private Database ArrangeDatabase(out FakeItem homeItem, out FakeItem hotelItem, out FakeItem accommodationFacilityFolderItem, out FakeItem accommodationFacilityItem, out FakeItem accommodationFacilityItem2, Action<FakeItem, Item[]> setupAxes)
        {
            var englishLanguage = Language.Parse("en");
            var fakeDB = FakeUtil.FakeDatabase("master");

            homeItem = new FakeItem(database: fakeDB).WithName("homeItem").WithLanguage(englishLanguage);

            hotelItem = new FakeItem(database: fakeDB);
            hotelItem.WithTemplate(ID.Parse(HotelTemplateId));
            hotelItem.WithUri(new ItemUri(hotelItem.ID, englishLanguage, fakeDB));
            hotelItem.WithName("hotelItem");
            hotelItem.WithLanguage(englishLanguage);
            hotelItem.WithParent(homeItem);

            accommodationFacilityFolderItem = new FakeItem(database: fakeDB);
            accommodationFacilityFolderItem.WithName("accommodationFacilityFolderItem");
            accommodationFacilityFolderItem.WithTemplate(ID.Parse(Destinations.Constants.TemplateIds.AccommodationFacilitiesFolder));
            accommodationFacilityFolderItem.WithUri(new ItemUri(accommodationFacilityFolderItem.ID, englishLanguage, fakeDB));
            accommodationFacilityFolderItem.WithLanguage(englishLanguage);
            accommodationFacilityFolderItem.WithParent(hotelItem);
            setupAxes(accommodationFacilityFolderItem, new[] { homeItem.ToSitecoreItem(), hotelItem.ToSitecoreItem() }.ToArray());

            accommodationFacilityItem = new FakeItem(database: fakeDB);
            accommodationFacilityItem.WithName("accommodationFacilityItem");
            accommodationFacilityItem.WithTemplate(ID.Parse(Destinations.Constants.TemplateIds.AccommodationFacility));
            accommodationFacilityItem.WithUri(new ItemUri(accommodationFacilityItem.ID, englishLanguage, fakeDB));
            accommodationFacilityItem.WithLanguage(englishLanguage);
            accommodationFacilityItem.WithParent(accommodationFacilityFolderItem);
            setupAxes(accommodationFacilityItem, new[] { homeItem.ToSitecoreItem(), hotelItem.ToSitecoreItem(), accommodationFacilityFolderItem.ToSitecoreItem() }.ToArray());

            accommodationFacilityItem2 = new FakeItem(database: fakeDB);
            accommodationFacilityItem2.WithName("accommodationFacilityItem2");
            accommodationFacilityItem2.WithTemplate(ID.Parse(Destinations.Constants.TemplateIds.AccommodationFacility));
            accommodationFacilityItem2.WithUri(new ItemUri(accommodationFacilityItem.ID, englishLanguage, fakeDB));
            accommodationFacilityItem2.WithLanguage(englishLanguage);
            accommodationFacilityItem2.WithParent(accommodationFacilityFolderItem);
            setupAxes(accommodationFacilityItem2, new[] { homeItem.ToSitecoreItem(), hotelItem.ToSitecoreItem(), accommodationFacilityFolderItem.ToSitecoreItem() }.ToArray());

            hotelItem.WithChild(accommodationFacilityItem);
            return fakeDB;
        }

        private void ArrangeSubstitute(Database fakeDB, string hotelTemplateId, string descendantsTemplateIds)
        {
            sut.AncestorTemplateId = hotelTemplateId;
            sut.DescendantsTemplateIds = descendantsTemplateIds;
            sut.Configure().GetDatabase(string.Empty).ReturnsForAnyArgs(fakeDB);
        }
    }
}
