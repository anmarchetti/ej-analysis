using System;
using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Feature.ChangeTracking.Logging;
using easyJet.Feature.ChangeTracking.Models;
using easyJet.Feature.ChangeTracking.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.ChangeTracking.Tests.Services
{
    public class ChangeTrackingServiceTests
    {
        private readonly ICustomCacheRepository customCacheRepository;
        private readonly IChangeTrackingStoreService changeTrackingStoreService;
        private readonly ChangeTrackingCacheService changeTrackingCacheService;
        private readonly IChangeTrackingLogger logger;
        private readonly ChangeTrackingService sut;

        public ChangeTrackingServiceTests()
        {
            customCacheRepository = Substitute.For<ICustomCacheRepository>();
            logger = Substitute.For<IChangeTrackingLogger>();
            changeTrackingStoreService = Substitute.For<IChangeTrackingStoreService>();
            changeTrackingCacheService = Substitute.ForPartsOf<ChangeTrackingCacheService>(customCacheRepository);
            sut = new ChangeTrackingService(changeTrackingStoreService, changeTrackingCacheService, logger);
        }

        [Theory]
        [AutoData]
        public void GetChangeSets_ReturnsDataFromStore(List<Feature.ChangeTracking.Models.ChangeTrackingFieldChange> fieldChanges, List<ChangeTrackingItemChange> itemChanges)
        {
            var dbItem = new FakeItem();

            // Arrange
            changeTrackingStoreService.GetFieldChanges(Arg.Any<Item>(), Arg.Any<DateTime>(), Arg.Any<DateTime>()).Returns(fieldChanges);
            changeTrackingStoreService.GetItemChanges(Arg.Any<Item>(), Arg.Any<DateTime>(), Arg.Any<DateTime>()).Returns(itemChanges);

            // Act
            var actual = sut.GetChangeSets(dbItem, DateTime.MinValue, DateTime.MaxValue);

            actual.SelectMany(i => i.Changes).Should().Contain(fieldChanges);
            actual.SelectMany(i => i.Changes).Should().Contain(itemChanges);
        }

        [Theory]
        [AutoData]
        public void GetFieldChanges_ReturnsDataFromStore_IfCached(List<Feature.ChangeTracking.Models.ChangeTrackingFieldChange> fieldChanges)
        {
            // Arrange
            var dbItem = new FakeItem().WithUri();
            foreach (var fieldChange in fieldChanges)
            {
                fieldChange.ItemId = dbItem.ID.Guid;
            }

            changeTrackingCacheService.GetCachedValue(Arg.Any<string>(), Arg.Any<Func<List<ChangeTrackingFieldChange>>>()).Returns(fieldChanges);

            // Act
            var actual = sut.GetFieldChanges(dbItem, DateTime.MinValue, DateTime.MaxValue);

            actual.Should().Contain(fieldChanges);
        }

        [Theory]
        [AutoData]
        public void GetItemChanges_ReturnsDataFromStore_IfCached(List<ChangeTrackingItemChange> itemChanges)
        {
            // Arrange
            var dbItem = new FakeItem().WithUri();
            foreach (var fieldChange in itemChanges)
            {
                fieldChange.ItemId = dbItem.ID.Guid;
            }

            changeTrackingCacheService.GetCachedValue(Arg.Any<string>(), Arg.Any<Func<List<ChangeTrackingItemChange>>>()).Returns(itemChanges);

            // Act
            var actual = sut.GetItemChanges(dbItem, DateTime.MinValue, DateTime.MaxValue);

            actual.Should().Contain(itemChanges);
        }

        [Theory]
        [AutoData]
        public void GetFieldChanges_ReturnsDataFromStore_IfNotCached(List<ChangeTrackingFieldChange> fieldChanges)
        {
            // Arrange
            var dbItem = new FakeItem().WithUri();
            foreach (var fieldChange in fieldChanges)
            {
                fieldChange.ItemId = dbItem.ID.Guid;
            }

            changeTrackingStoreService.GetFieldChanges(Arg.Any<Item>(), Arg.Any<DateTime>(), Arg.Any<DateTime>()).Returns(fieldChanges);

            // Act
            var actual = sut.GetFieldChanges(dbItem, DateTime.MinValue, DateTime.MaxValue);

            actual.Should().Contain(fieldChanges);
        }

        [Theory]
        [AutoData]
        public void GetItemChanges_ReturnsDataFromStore_IfNotCached(List<ChangeTrackingItemChange> itemChanges)
        {
            // Arrange
            var dbItem = new FakeItem().WithUri();
            foreach (var itemChange in itemChanges)
            {
                itemChange.ItemId = dbItem.ID.Guid;
            }

            changeTrackingStoreService.GetItemChanges(Arg.Any<Item>(), Arg.Any<DateTime>(), Arg.Any<DateTime>()).Returns(itemChanges);

            // Act
            var actual = sut.GetItemChanges(dbItem, DateTime.MinValue, DateTime.MaxValue);

            actual.Should().Contain(itemChanges);
        }
    }
}