using System.Linq;
using System.Web;
using System.Web.Routing;
using AutoFixture;
using easyJet.Foundation.Destinations.Models.Domain.DynamicPromoPage;
using easyJet.Foundation.Destinations.Pipelines.RequestBegin;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.Testing.Switchers;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.Globalization;
using Sitecore.LayoutService.Mvc.ItemResolving;
using Sitecore.LayoutService.Mvc.Routing;
using Sitecore.Mvc.Pipelines.Request.RequestBegin;
using Sitecore.NSubstituteUtils;
using Sitecore.NSubstituteUtils.Extensions;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentResolvers
{
    public class DynamicPromoPagesContextItemResolverExTests
    {
        private ISitecoreContext sitecoreContext;
        private IItemResolver itemResolver;
        private IRouteMapper routeMapper;

        public DynamicPromoPagesContextItemResolverExTests()
        {
            sitecoreContext = Substitute.For<ISitecoreContext>();
            itemResolver = Substitute.For<IItemResolver>();
            routeMapper = Substitute.For<IRouteMapper>();

            routeMapper.IsLayoutServiceRoute(Arg.Any<RequestContext>()).Returns(true);
            routeMapper.IsLayoutServiceRoute(Arg.Any<HttpContextBase>()).Returns(true);
        }

        [Fact]
        public void ProcessItem_ContextItemExists_ResolverAborted()
        {
            var siteContext = new SiteInfoPropertiesBuilder("TestContext");
            var site = siteContext.ToSiteContext();
            sitecoreContext.Site = site;

            var args = new RequestBeginArgs(new RequestContext());
            args.PageContext = new Sitecore.Mvc.Presentation.PageContext
            {
                RequestContext = new RequestContext()
            };
            using (new FakeSiteContextSwitcher(site))
            using (new SafeContextItemSwitcher(new FakeItem().ToSitecoreItem()))
            {
                var resolver = new DynamicPromoPageContextItemResolverExtended(sitecoreContext, itemResolver, routeMapper, Substitute.For<IHtmlCacheRepository>());
                resolver.Process(args);
                Context.Item.Should().NotBeNull();
            }
        }

        [Fact]
        public void ProcessItem_NoContextItem_CoreDatabase()
        {
            var siteContext = new SiteInfoPropertiesBuilder("TestContext").WithDatabase("core");
            var site = siteContext.ToSiteContext();
            sitecoreContext.Site = site;

            var args = new RequestBeginArgs(new RequestContext());
            args.PageContext = new Sitecore.Mvc.Presentation.PageContext();
            args.PageContext.RequestContext = new RequestContext();

            using (new FakeSiteContextSwitcher(site))
            using (new SafeContextItemSwitcher(null))
            {
                var resolver = new DynamicPromoPageContextItemResolverExtended(sitecoreContext, itemResolver, routeMapper, Substitute.For<IHtmlCacheRepository>());
                resolver.Process(args);
                Context.Item.Should().BeNull();
            }
        }

        [Fact]
        public void ProcessItem_ContextItem_GetFromCache()
        {
            var siteContext = new SiteInfoPropertiesBuilder("TestContext");
            var site = siteContext.ToSiteContext();
            sitecoreContext.Site.Returns(site);
            sitecoreContext.Language.Returns(Language.Parse("en"));

            var args = new RequestBeginArgs(new RequestContext());
            args.PageContext = new Sitecore.Mvc.Presentation.PageContext();
            args.PageContext.RequestContext = new RequestContext();
            args.PageContext.RequestContext.HttpContext = new HttpContextWrapper(new HttpContext(new HttpRequest("fake", "http://sc.holidays.local/", "item=test"), new HttpResponse(null)));

            var fixture = new Fixture();
            var db = fixture.Freeze<Db>();
            var itemDb = new DbItem("Page");
            db.Add(itemDb);

            var item = db.GetItem(itemDb.ID);

            var htmlCacheRepositoryEx = Substitute.For<IHtmlCacheRepository>();
            htmlCacheRepositoryEx.GetItem<PromoPage[]>(Arg.Any<string>()).Returns(new[] { new PromoPage() { UrlPathName = "test", Item = item } });

            using (new FakeSiteContextSwitcher(site))
            using (new SafeContextItemSwitcher(null))
            {
                var resolver = new DynamicPromoPageContextItemResolverExtended(sitecoreContext, itemResolver, routeMapper, htmlCacheRepositoryEx);
                resolver.Process(args);
                Context.Item.Should().NotBeNull();
                Context.Item.ID.Should().Be(item.ID);
            }
        }

        [Fact]
        public void ProcessItem_ContextItem_GetItemFromDatabase()
        {
            var siteContext = new SiteInfoPropertiesBuilder("TestContext");
            var site = siteContext.ToSiteContext();

            var args = new RequestBeginArgs(new RequestContext());
            args.PageContext = new Sitecore.Mvc.Presentation.PageContext();
            args.PageContext.RequestContext = new RequestContext();
            args.PageContext.RequestContext.HttpContext = new HttpContextWrapper(new HttpContext(new HttpRequest("fake", "http://sc.holidays.local/", "item=test"), new HttpResponse(null)));

            // need to initialize item this way to get around authorization
            var fixture = new Fixture();
            var db = fixture.Freeze<Db>();
            var itemDb = new DbItem("Page");
            itemDb.Fields.Add(Constants.Fields.DynamicPromoPage.UrlPathName, "test");
            db.Add(itemDb);

            var item = db.GetItem(itemDb.ID);

            var mockDatabase = Substitute.For<Database>();
            mockDatabase.SelectItems($"/sitecore/content/EasyJet/Holidays/Home/DynamicPromoPages/*[@@templatename='Dynamic Promo Page Layout']").Returns(new[] { item });
            sitecoreContext.Site.Returns(site);
            sitecoreContext.Language.Returns(Language.Parse("en"));
            sitecoreContext.Database.Returns(mockDatabase);

            using (new FakeSiteContextSwitcher(site))
            using (new SafeContextItemSwitcher(null))
            {
                var resolver = new DynamicPromoPageContextItemResolverExtended(sitecoreContext, itemResolver, routeMapper, Substitute.For<IHtmlCacheRepository>());
                resolver.Process(args);
                Context.Item.Should().NotBeNull();
                Context.Item.ID.Should().Be(item.ID);
            }
        }

        [Fact]
        public void ProcessItem_ContextItemNull_NoItemsFromDatabase()
        {
            var siteContext = new SiteInfoPropertiesBuilder("TestContext");
            var site = siteContext.ToSiteContext();

            var args = new RequestBeginArgs(new RequestContext());
            args.PageContext = new Sitecore.Mvc.Presentation.PageContext();
            args.PageContext.RequestContext = new RequestContext();
            args.PageContext.RequestContext.HttpContext = new HttpContextWrapper(new HttpContext(new HttpRequest("fake", "http://sc.holidays.local/", "item=test"), new HttpResponse(null)));

            var mockDatabase = Substitute.For<Database>();
            mockDatabase.SelectItems($"/sitecore/content/EasyJet/Holidays/Home/DynamicPromoPages/*[@@templatename='Dynamic Promo Page Layout']").Returns(Enumerable.Empty<Item>());
            sitecoreContext.Site.Returns(site);
            sitecoreContext.Language.Returns(Language.Parse("en"));
            sitecoreContext.Database.Returns(mockDatabase);

            var item = new FakeItem().ToSitecoreItem();
            using (new FakeSiteContextSwitcher(site))
            using (new SafeContextItemSwitcher(null))
            {
                var resolver = new DynamicPromoPageContextItemResolverExtended(sitecoreContext, itemResolver, routeMapper, Substitute.For<IHtmlCacheRepository>());
                resolver.Process(args);
                Context.Item.Should().BeNull();
            }
        }
    }
}