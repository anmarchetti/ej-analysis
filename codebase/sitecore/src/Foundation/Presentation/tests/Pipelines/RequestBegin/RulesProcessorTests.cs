using System.Web.Routing;
using AutoFixture.Xunit2;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Pipelines.RequestBegin;
using easyJet.Foundation.Testing.Switchers;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Collections;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.LayoutService.Mvc.ItemResolving;
using Sitecore.LayoutService.Mvc.Routing;
using Sitecore.Mvc.Pipelines.Request.RequestBegin;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Pipelines.RequestBegin
{
    public class RulesProcessorTests : RulesProcessor
    {
        private readonly RequestBeginArgs args;

        public RulesProcessorTests()
            : base(Substitute.For<IItemResolver>(), Substitute.For<IRouteMapper>(), Substitute.For<IPresentationLogger>())
        {
            args = new RequestBeginArgs(new RequestContext());
        }

        [Fact]
        public void Process_ContextItemShouldBeNull_IfNoItemSet()
        {
            using (new SafeContextItemSwitcher(null))
            {
                // Act
                Process(args);

                // Assert
                Context.Item.Should().BeNull();
            }
        }

        [Theory]
        [AutoData]
        public void Process_ContextItemShouldBeNull_IfRulesFolderDoesNotExist(Db db, string fakeItemName)
        {
            // Arrange
            var dbItem = new DbItem(fakeItemName);
            db.Add(dbItem);

            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            using (new SafeContextItemSwitcher(db.GetItem(dbItem.ID)))
            {
                // Act
                Process(args);

                // Assert
                Context.Item.Name.Should().Be(fakeItemName);
            }
        }
    }
}
