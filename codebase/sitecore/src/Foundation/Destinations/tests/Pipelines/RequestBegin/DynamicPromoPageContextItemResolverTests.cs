using System.Web;
using System.Web.Routing;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Pipelines.RequestBegin;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.Testing.Switchers;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.LayoutService.Mvc.ItemResolving;
using Sitecore.LayoutService.Mvc.Routing;
using Sitecore.Mvc.Pipelines.Request.RequestBegin;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Pipelines.RequestBegin
{
    public class DynamicPromoPageContextItemResolverTests
    {
        private readonly DynamicPromoPageContextItemResolver resolver;
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly IHtmlCacheRepository cache;
        private readonly IRouteMapper routeMapper;
        private readonly RequestBeginArgs args;

        public DynamicPromoPageContextItemResolverTests()
        {
            var itemResolver = Substitute.For<IItemResolver>();
            routeMapper = Substitute.For<IRouteMapper>();
            cache = Substitute.For<IHtmlCacheRepository>();

            // Arrange
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            resolver = new DynamicPromoPageContextItemResolver(itemResolver, routeMapper, cache);

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
            var fakeSite = new FakeSiteContext("Site");

            args.PageContext.RequestContext.HttpContext =
                new HttpContextWrapper(new HttpContext(new HttpRequest("fake", "http://sc.holidays.local", "item=qwe"), new HttpResponse(null)));

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
        public void Resolve_ShouldNotBeNull_IfPathIsCorrect()
        {
            // Arrange
            var expectedPathPrefix = "/DynamicPromoPages";
            var fakeSite = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "website" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content/" }
                });

            var hotelThemeItem = new DbItem("Hotel Theme");
            hotelThemeItem.Fields.Add(Constants.Fields.DestinationGuideTheme.DestinationGuideUrl, "theme");
            db.Add(hotelThemeItem);

            var dynamicPromoPageTemplate = new DbTemplate("Dynamic Promo Page");
            dynamicPromoPageTemplate.Fields.Add(Constants.Fields.DynamicPromo.HotelTheme);
            db.Add(dynamicPromoPageTemplate);

            var dynamicPromoPagesFolderTemplate = new DbTemplate("Dynamic Promo Pages Folder");
            db.Add(dynamicPromoPagesFolderTemplate);

            var dynamicPromoPages = new DbItem("DynamicPromoPages");
            dynamicPromoPages.TemplateID = dynamicPromoPagesFolderTemplate.ID;

            var itemDb = new DbItem("Dynamic Promo Page");
            itemDb.Fields.Add("__Display name", "Dynamic Promo Page 1");
            itemDb.TemplateID = dynamicPromoPageTemplate.ID;

            dynamicPromoPages.Add(itemDb);

            db.Add(dynamicPromoPages);

            var item = db.GetItem(itemDb.ID);
            item.Editing.BeginEdit();
            item[Constants.Fields.DynamicPromo.HotelTheme] = hotelThemeItem.ID.ToString();
            item.Editing.EndEdit();

            args.PageContext.RequestContext.HttpContext =
                new HttpContextWrapper(new HttpContext(new HttpRequest("fake", "http://sc.holidays.local", $"item=theme"), new HttpResponse(null)));

            routeMapper.IsLayoutServiceRoute(Arg.Any<RequestContext>()).Returns(true);

            using (new FakeSiteContextSwitcher(fakeSite))
            using (new SafeContextItemSwitcher(null))
            {
                using (new SettingsSwitcher("Destinations.DynamicPromoPages.JssApiPrefix", expectedPathPrefix))
                {
                    // Act
                    resolver.Process(args);

                    // Assert
                    Context.Item.Should().NotBeNull();
                }
            }
        }

        [Theory]
        [AutoData]
        public void Resolve_ShouldBeNotNull_IfHasCachedItem(string itemPath)
        {
            // Arrange
            var expectedPathPrefix = "/DynamicPromoPages";

            var fullPath = $"{expectedPathPrefix}/{itemPath}";
            var fakeSite = new FakeSiteContext("Site");
            var cacheKey = $"DynamicPromoPageItem-{fullPath}";

            var itemDb = new DbItem("Dynamic Promo Page");
            db.Add(itemDb);

            cache.GetItem<Item>(cacheKey).Returns(db.GetItem(itemDb.ID));

            args.PageContext.RequestContext.HttpContext =
                new HttpContextWrapper(new HttpContext(new HttpRequest("fake", "http://sc.holidays.local", $"item={expectedPathPrefix}/{itemPath}"), new HttpResponse(null)));

            routeMapper.IsLayoutServiceRoute(Arg.Any<RequestContext>()).Returns(true);

            using (new FakeSiteContextSwitcher(fakeSite))
            using (new SettingsSwitcher("Destinations.DynamicPromoPages.JssApiPrefix", expectedPathPrefix))
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
