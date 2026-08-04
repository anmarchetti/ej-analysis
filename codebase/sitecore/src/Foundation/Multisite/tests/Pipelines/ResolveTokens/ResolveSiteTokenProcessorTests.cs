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
    public class ResolveSiteTokenProcessorTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly IMultiSiteContext multiSiteContext;
        private readonly ResolveSiteTokenProcessor resolveSiteTokenProcessor;

        public ResolveSiteTokenProcessorTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            multiSiteContext = Substitute.For<IMultiSiteContext>();
            resolveSiteTokenProcessor = new ResolveSiteTokenProcessor(multiSiteContext);
        }

        [Fact]
        public void Process_ShouldThrowException_IfArgsNull()
        {
            // Act
            Action actual = () => resolveSiteTokenProcessor.Process(null);

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
            Action actual = () => resolveSiteTokenProcessor.Process(args);

            // Assert
            actual.Should().NotThrow<ArgumentNullException>();
        }

        [Fact]
        public void Process_ShouldEmptyQuery_IfTokenizedItemNull()
        {
            // Arrange
            var contextItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            db.Add(contextItem);

            var args = new ResolveTokensArgs(db.GetItem(contextItem.ID), "$site");

            // Act
            resolveSiteTokenProcessor.Process(args);
            var actual = args.Query;

            // Assert
            actual.Should().BeEmpty();
        }

        [Fact]
        public void Process_ShouldSetItemPathInsteadToken_IfSiteItemExists()
        {
            // Arrange
            var contextItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(contextItem);

            multiSiteContext.GetSiteItem(Arg.Any<Item>()).ReturnsForAnyArgs(db.GetItem(contextItem.ID));

            var args = new ResolveTokensArgs(db.GetItem(contextItem.ID), "$site");

            // Act
            resolveSiteTokenProcessor.Process(args);
            var actual = args.Query;

            // Assert
            actual.Should().Be(contextItem.FullPath);
        }
    }
}
