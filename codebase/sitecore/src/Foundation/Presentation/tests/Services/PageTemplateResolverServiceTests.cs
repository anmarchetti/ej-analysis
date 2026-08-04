using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Services
{
    public class PageTemplateResolverServiceTests
    {
        private readonly IDatabaseProvider databaseProvider;
        private readonly IPresentationLogger logger;
        private readonly PageTemplateResolverService sut;

        public PageTemplateResolverServiceTests()
        {
            databaseProvider = Substitute.For<IDatabaseProvider>();
            logger = Substitute.For<IPresentationLogger>();
            sut = new PageTemplateResolverService(databaseProvider, logger);
        }

        [Fact]
        public void ResolveTemplateId_WhenPageItemIdIsNull_ShouldReturnIdNull()
        {
            // ARRANGE

            // ACT
            var result = sut.ResolveTemplateId(ID.Null, DatabaseType.Content);

            // ASSERT
            result.Should().Be(ID.Null);
        }

        [Fact]
        public void ResolveTemplateId_WhenDatabaseIsNull_ShouldReturnIdNull()
        {
            // ARRANGE
            var pageItemId = ID.NewID;
            databaseProvider.GetDatabase(DatabaseType.Content).Returns((Database)null);

            // ACT
            var result = sut.ResolveTemplateId(pageItemId, DatabaseType.Content);

            // ASSERT
            result.Should().Be(ID.Null);
        }

        [Fact]
        public void ResolveTemplateId_WhenItemNotFoundInDatabase_ShouldReturnIdNull()
        {
            // ARRANGE
            var pageItemId = ID.NewID;
            var mockDb = Substitute.For<Database>();
            databaseProvider.GetDatabase(DatabaseType.Content).Returns(mockDb);
            mockDb.GetItem(pageItemId).Returns((Item)null);

            // ACT
            var result = sut.ResolveTemplateId(pageItemId, DatabaseType.Content);

            // ASSERT
            result.Should().Be(ID.Null);
        }

        [Fact]
        public void ResolveTemplateId_WhenItemNotFoundInDatabase_ShouldLogWarning()
        {
            // ARRANGE
            var pageItemId = ID.NewID;
            var mockDb = Substitute.For<Database>();
            databaseProvider.GetDatabase(DatabaseType.Content).Returns(mockDb);
            mockDb.GetItem(pageItemId).Returns((Item)null);

            // ACT
            sut.ResolveTemplateId(pageItemId, DatabaseType.Content);

            // ASSERT
            logger.Received(1).Warn(Arg.Any<string>(), Arg.Any<System.Type>());
        }

        [Fact]
        public void ResolveTemplateId_WhenItemFound_ShouldReturnItsTemplateId()
        {
            // ARRANGE
            var pageItemId = ID.NewID;
            var expectedTemplateId = ID.NewID;
            var mockDb = Substitute.For<Database>();
            databaseProvider.GetDatabase(DatabaseType.Content).Returns(mockDb);

            var fakeItem = new FakeItem(pageItemId)
                .WithTemplate(expectedTemplateId)
                .ToSitecoreItem();

            mockDb.GetItem(pageItemId).Returns(fakeItem);

            // ACT
            var result = sut.ResolveTemplateId(pageItemId, DatabaseType.Content);

            // ASSERT
            result.Should().Be(expectedTemplateId);
        }

        [Fact]
        public void ResolveTemplateId_WhenCalledWithMasterDatabaseType_ShouldQueryMasterDatabase()
        {
            // ARRANGE
            var pageItemId = ID.NewID;
            var mockDb = Substitute.For<Database>();
            databaseProvider.GetDatabase(DatabaseType.Master).Returns(mockDb);
            mockDb.GetItem(pageItemId).Returns((Item)null);

            // ACT
            sut.ResolveTemplateId(pageItemId, DatabaseType.Master);

            // ASSERT
            databaseProvider.Received(1).GetDatabase(DatabaseType.Master);
        }
    }
}