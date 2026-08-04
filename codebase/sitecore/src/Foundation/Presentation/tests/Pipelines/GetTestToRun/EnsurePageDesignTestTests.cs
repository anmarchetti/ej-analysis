using AutoFixture.Xunit2;
using easyJet.Foundation.Presentation.Pipelines.GetTestToRun;
using FluentAssertions;
using Sitecore.ContentTesting.Pipelines.GetTestToRun;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Pipelines.GetTestToRun
{
    public class EnsurePageDesignTestTests
    {
        private readonly EnsurePageDesignTest ensurePageDesignTest;

        public EnsurePageDesignTestTests()
        {
            ensurePageDesignTest = new EnsurePageDesignTest();
        }

        [Theory]
        [AutoData]
        public void Process_ShouldEnsurePageDesign_IfPageDesignNotNull(Db db, object pageDesign)
        {
            // Arrange
            var dbItem = new DbItem("Db item");
            db.Add(dbItem);

            var args = new GetTestToRunArgs(db.GetItem(dbItem.ID), ID.NewID);
            args.CustomData.Add(Constants.PageDesignArgsKey, pageDesign);

            // Act
            ensurePageDesignTest.Process(args);

            // Assert
            args.Aborted.Should().BeFalse();
        }
    }
}
