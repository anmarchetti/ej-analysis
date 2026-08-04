using System;
using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Feature.SitecoreEnhancment.ForceRepublish;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using NSubstitute;
using NSubstitute.ReturnsExtensions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.ForceRepublish
{
    public class ChangeItemRevisionServiceTests
    {
        private readonly IChangeItemRevisionService sut;
        private readonly IDatabaseProvider databaseProvider;
        private readonly ISitecoreEnhancmentLogger logger;

        public ChangeItemRevisionServiceTests()
        {
            databaseProvider = Substitute.For<IDatabaseProvider>();
            logger = Substitute.For<ISitecoreEnhancmentLogger>();
            sut = new ChangeItemRevisionService(databaseProvider, logger);
        }

        [Theory]
        [AutoData]
        public void ChangeItemRevision_ItemNotInWebDatabase(ID itemId)
        {
            // Arrange
            using (var db = new Db { new DbItem("Item", itemId) })
            {
                var item = db.GetItem(itemId);
                databaseProvider.GetItem(item.ID, item.Language, DatabaseType.Web).ReturnsNull();

                // Act
                sut.ChangeItemRevision(item);

                // Assert
                logger.Received().Debug(Arg.Any<string>(), Arg.Any<object>());
            }
        }

        [Theory]
        [AutoData]
        public void ChangeItemRevision_ItemEditThrowsException(ID itemId)
        {
            // Arrange
            using (var db = new Db { new DbItem("Item", itemId) })
            {
                var item = db.GetItem(itemId);
                databaseProvider.GetItem(item.ID, item.Language, DatabaseType.Web).Returns(item);

                // Act
                item.Database.ReadOnly = true;
                sut.ChangeItemRevision(item);

                // Assert
                logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            }
        }

        [Theory]
        [AutoData]
        public void ChangeItemRevision_ItemRevisionIsUpdated(ID itemId, string revision)
        {
            // Arrange
            using (var db = new Db { new DbItem("Item", itemId) { new DbField(Sitecore.FieldIDs.Revision) { Value = revision } } })
            {
                var item = db.GetItem(itemId);
                databaseProvider.GetItem(item.ID, item.Language, DatabaseType.Web).Returns(item);

                // Act
                sut.ChangeItemRevision(item);

                // Assert
                Assert.NotEqual(revision, item[Sitecore.FieldIDs.Revision]);
            }
        }

        [Theory]
        [AutoData]
        public void ChangeItemRevision_ItemRevisionsAreUpdated(ID itemId1, string revision1, ID itemId2, string revision2)
        {
            // Arrange
            using (var db = new Db
                   {
                       new DbItem("Item1", itemId1) { new DbField(Sitecore.FieldIDs.Revision) { Value = revision1 } },
                       new DbItem("Item2", itemId2) { new DbField(Sitecore.FieldIDs.Revision) { Value = revision2 } }
                   })
            {
                var item1 = db.GetItem(itemId1);
                var item2 = db.GetItem(itemId2);
                databaseProvider.GetItem(item1.ID, item1.Language, DatabaseType.Web).Returns(item1);
                databaseProvider.GetItem(item2.ID, item2.Language, DatabaseType.Web).Returns(item2);

                // Act
                sut.ChangeItemRevision(new List<Item> { item1, item2 });

                // Assert
                Assert.NotEqual(revision1, item1[Sitecore.FieldIDs.Revision]);
                Assert.NotEqual(revision2, item2[Sitecore.FieldIDs.Revision]);
            }
        }
    }
}
