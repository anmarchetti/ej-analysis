using System;
using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Feature.ChangeTracking.Models;
using easyJet.Feature.ChangeTracking.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.ChangeTracking.Tests.Services
{
    public class ChangeTrackingTabContentServiceTests
    {
        private readonly IChangeTrackingService changeTrackingService;
        private readonly ChangeTrackingTabContentService sut;
        private readonly IDatabaseProvider databaseProvider;

        public ChangeTrackingTabContentServiceTests()
        {
            changeTrackingService = Substitute.For<IChangeTrackingService>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            sut = Substitute.ForPartsOf<ChangeTrackingTabContentService>(changeTrackingService, databaseProvider);
        }

        [Theory]
        [AutoData]
        public void GetModels_ContainsItem(ChangeSet set, List<ChangeTrackingItemChange> itemChanges, List<ChangeTrackingFieldChange> fieldChanges)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithUri();
            set.Changes = Enumerable.OfType<Change>(itemChanges.OfType<Change>().Union(fieldChanges)).ToList();
            foreach (var d in set.Changes)
            {
                d.ItemId = item.ID.Guid;
            }

            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(item);
            changeTrackingService.GetChangeSets(Arg.Any<Item>(), Arg.Any<DateTime>(), Arg.Any<DateTime>()).Returns(new List<ChangeSet> { set });

            // Act
            var actual = sut.GetModels(item.ToSitecoreItem().Uri);

            // Assert
            actual.SelectMany(i => i.Items).SelectMany(i => i.Changes).Count().Should().Equals(set.Changes.Count);
        }

        [Theory]
        [AutoData]
        public void GetModels_ContainsWrongItem(ChangeSet set, DummyChange dummychange, List<Change> itemChanges, List<ChangeTrackingFieldChange> fieldChanges)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithUri();
            itemChanges.Add(dummychange);
            set.Changes = Enumerable.OfType<Change>(itemChanges.OfType<Change>().Union(fieldChanges)).ToList();
            foreach (var d in set.Changes)
            {
                d.ItemId = item.ID.Guid;
            }

            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(item);
            changeTrackingService.GetChangeSets(Arg.Any<Item>(), Arg.Any<DateTime>(), Arg.Any<DateTime>()).Returns(new List<ChangeSet> { set });

            // Act
            try
            {
                var actual = sut.GetModels(item.ToSitecoreItem().Uri);
            }
            catch (ArgumentException)
            {
                Assert.True(true);
            }
        }

        public class DummyChange : Change
        {
        }
    }
}