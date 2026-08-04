using System;
using AutoFixture;
using easyJet.Foundation.Multisite.Pipelines.ResolveTokens;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Pipelines.ResolveTokens
{
    public class ResolveDataTokenProcessorTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly IMultiSiteContext multiSiteContext;
        private readonly ResolveDataTokenProcessor resolveDataTokenProcessor;

        public ResolveDataTokenProcessorTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            multiSiteContext = Substitute.For<IMultiSiteContext>();
            resolveDataTokenProcessor = new ResolveDataTokenProcessor(multiSiteContext);
        }

        [Fact]
        public void Process_ShouldThrowException_IfArgsNull()
        {
            // Act
            Action actual = () => resolveDataTokenProcessor.Process(null);

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void Process_ShouldNotThrowException_IfArgsNotNull()
        {
            // Arrange
            var contextItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(contextItem);

            var args = new ResolveTokensArgs(db.GetItem(contextItem.ID), "fakequery");

            // Act
            Action actual = () => resolveDataTokenProcessor.Process(args);

            // Assert
            actual.Should().NotThrow<ArgumentNullException>();
        }

        [Fact]
        public void Process_ShouldEmptyQuery_IfTokenizedItemNull()
        {
            // Arrange
            var contextItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            db.Add(contextItem);

            var args = new ResolveTokensArgs(db.GetItem(contextItem.ID), "$data");

            // Act
            resolveDataTokenProcessor.Process(args);
            var actual = args.Query;

            // Assert
            actual.Should().BeEmpty();
        }

        [Fact]
        public void Process_ShouldSetItemPathInsteadToken_IfDataItemExists()
        {
            // Arrange
            var contextItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(contextItem);

            multiSiteContext.GetDataItem(Arg.Any<Item>()).ReturnsForAnyArgs(db.GetItem(contextItem.ID));

            var args = new ResolveTokensArgs(db.GetItem(contextItem.ID), "$data");

            // Act
            resolveDataTokenProcessor.Process(args);
            var actual = args.Query;

            // Assert
            actual.Should().Be(contextItem.FullPath);
        }
    }
}
