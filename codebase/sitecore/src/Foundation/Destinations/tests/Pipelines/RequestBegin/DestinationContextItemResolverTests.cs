using System.Web;
using System.Web.Routing;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Pipelines.RequestBegin;
using easyJet.Foundation.Testing.Switchers;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.FakeDb.Sites;
using Sitecore.LayoutService.Mvc.ItemResolving;
using Sitecore.LayoutService.Mvc.Routing;
using Sitecore.Mvc.Pipelines.Request.RequestBegin;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Pipelines.RequestBegin
{
    public class DestinationContextItemResolverTests
    {
        private readonly IRouteMapper routeMapper;
        private readonly IItemResolver itemResolver;

        public DestinationContextItemResolverTests()
        {
            itemResolver = Substitute.For<IItemResolver>();
            routeMapper = Substitute.For<IRouteMapper>();
        }

        [Theory]
        [AutoData]
        public void Resolve_ShouldNotBeNull_IfPathIsCorrect(string itemName)
        {
            // Arrange
            var expectedPathPrefix = "/Destinations";
            using (new SettingsSwitcher("Destinations.JssApiPrefix", expectedPathPrefix))
            {
                var resolver = new DestinationContextItemResolver(itemResolver, routeMapper);

                var args = new RequestBeginArgs(new RequestContext())
                {
                    PageContext = new Sitecore.Mvc.Presentation.PageContext()
                };

                args.PageContext.RequestContext = new RequestContext();

                var expectedPath = $"{expectedPathPrefix}/{itemName}";
                itemResolver.Resolve(expectedPath, SearchRoots.Sitecore | SearchRoots.SiteStartItem, out Arg.Any<bool>())
                    .Returns(x =>
                    {
                        x[2] = false;
                        return new FakeItem();
                    });

                var fakeSite = new FakeSiteContext(
                    new Sitecore.Collections.StringDictionary
                    {
                    { "name", "website" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content/" }
                    });

                args.PageContext.RequestContext.HttpContext =
                    new HttpContextWrapper(new HttpContext(new HttpRequest("fake", "http://sc.holidays.local", $"item={itemName}"), new HttpResponse(null)));

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
}
