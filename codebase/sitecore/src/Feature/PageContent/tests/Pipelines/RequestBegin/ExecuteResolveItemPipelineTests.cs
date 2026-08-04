using System.Web;
using System.Web.Routing;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Feature.PageContent.Pipelines.ItemResolving;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.Testing.Switchers;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Pipelines;
using Sitecore.FakeDb.Sites;
using Sitecore.LayoutService.Mvc.ItemResolving;
using Sitecore.LayoutService.Mvc.Routing;
using Sitecore.Mvc.Pipelines.Request.RequestBegin;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.Pipelines.RequestBegin
{
    public class ExecuteResolveItemPipelineTests
    {
        private readonly ExecuteResolveItemPipeline resolver;
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly IHtmlCacheRepository cache;
        private readonly IRouteMapper routeMapper;
        private readonly RequestBeginArgs args;

        public ExecuteResolveItemPipelineTests()
        {
            var itemResolver = Substitute.For<IItemResolver>();
            routeMapper = Substitute.For<IRouteMapper>();
            cache = Substitute.For<IHtmlCacheRepository>();

            // Arrange
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            resolver = new ExecuteResolveItemPipeline(itemResolver, routeMapper, cache);

            args = new RequestBeginArgs(new RequestContext());
            args.PageContext = new Sitecore.Mvc.Presentation.PageContext();
            args.PageContext.RequestContext = new RequestContext();
        }

        [Fact]
        public void Process_ContextItemShouldBeNull_IfItemPathIsEmpty()
        {
            using (new SafeContextItemSwitcher(null))
            {
                // Act
                resolver.Process(args);

                // Assert
                Context.Item.Should().BeNull();
            }
        }

        [Fact]
        public void Resolve_ShouldBeNull_IfPathDoesntStartWithPrefix()
        {
            // Arrange
            var processor = Substitute.For<IPipelineProcessor>();

            db.PipelineWatcher.Register("easyJet.ResolveItem", processor);

            var fakeSite = new FakeSiteContext("Site");

            args.PageContext.RequestContext.HttpContext =
                new HttpContextWrapper(new HttpContext(new HttpRequest("fake", "http://sc.holidays.local", "item=qwer"), new HttpResponse(null)));

            routeMapper.IsLayoutServiceRoute(Arg.Any<RequestContext>()).Returns(true);

            using (new FakeSiteContextSwitcher(fakeSite))
            using (new SafeContextItemSwitcher(null))
            {
                // Act
                resolver.Process(args);

                // Assert
                Context.Item.Should().BeNull();
            }
        }

        [Fact]
        public void Resolve_ShouldBeNull_IfContextDatabaseIsNull()
        {
            // Arrange
            Context.Database = null;

            using (new SafeContextItemSwitcher(null))
            {
                // Act
                resolver.Process(args);

                // Assert
                Context.Item.Should().BeNull();
            }
        }

        [Theory]
        [AutoData]
        public void Resolve_ShouldBeNotNull_IfHasCachedItem(string itemPath)
        {
            // Arrange
            var expectedPathPrefix = "/Root";

            var fullPath = $"{expectedPathPrefix}/{itemPath}";
            var fakeSite = new FakeSiteContext("Site");
            var cacheKey = $"ResolveItemPipeline-{fullPath}";

            var itemDb = new DbItem("Page");
            db.Add(itemDb);

            cache.GetItem<Item>(cacheKey).Returns(db.GetItem(itemDb.ID));

            args.PageContext.RequestContext.HttpContext =
                new HttpContextWrapper(new HttpContext(new HttpRequest("fake", "http://sc.holidays.local", $"item={expectedPathPrefix}/{itemPath}"), new HttpResponse(null)));

            routeMapper.IsLayoutServiceRoute(Arg.Any<RequestContext>()).Returns(true);

            using (new FakeSiteContextSwitcher(fakeSite))
            using (new SafeContextItemSwitcher(null))
            {
                // Act
                resolver.Process(args);

                // Assert
                Context.Item.Should().NotBeNull();
            }
        }
    }
}
