using System;
using System.Collections.Specialized;
using System.Web.Routing;
using AutoFixture.Xunit2;
using easyJet.Feature.Redirects.Models;
using easyJet.Feature.Redirects.Pipelines.GetLayoutServiceContext;
using easyJet.Feature.Redirects.Pipelines.HttpRequestBegin;
using easyJet.Feature.Redirects.Services;
using easyJet.Foundation.Multisite;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ReturnsExtensions;
using Sitecore;
using Sitecore.Globalization;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;
using Sitecore.LayoutService.Mvc.ItemResolving;
using Sitecore.LayoutService.Mvc.Routing;
using Sitecore.Mvc.Pipelines.Request.RequestBegin;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.Redirects.Tests.Pipelines.HttpRequestBegin
{
    [Collection("SitecoreSettings")]
    public class HandleItemNotFoundRedirectProcessorTests : IDisposable
    {
        private readonly HandleItemNotFoundRedirectProcessor handleItemNotFoundRedirectProcessor;
        private readonly RedirectDataContext redirectDataContext;
        private readonly ISitecoreContext sitecoreContext;

        private readonly IRedirectMapResolverService redirectMapResolverService;
        private readonly IRouteMapper routeMapper;

        public HandleItemNotFoundRedirectProcessorTests()
        {
            redirectMapResolverService = Substitute.For<IRedirectMapResolverService>();
            var itemResolver = Substitute.For<IItemResolver>();
            routeMapper = Substitute.For<IRouteMapper>();
            sitecoreContext = Substitute.For<ISitecoreContext>();
            handleItemNotFoundRedirectProcessor = new HandleItemNotFoundRedirectProcessor(itemResolver, routeMapper, redirectMapResolverService, sitecoreContext);
            redirectDataContext = new RedirectDataContext(redirectMapResolverService);
        }

        public void Dispose()
        {
            Context.Items.Remove("RedirectData");
            Context.Site = null;
        }

        [Theory]
        [AutoData]
        public void Process_ShouldAddRedirectDataToSitecoreContext_IfItemPathHasRedirectConfigured(RedirectData redirectData)
        {
            // Arrange
            var fakeItem = new FakeItem().WithItemVersions().WithVisualization();
            var language = Language.Parse("en");
            sitecoreContext.Language.Returns(language);
            sitecoreContext.Item.Returns(fakeItem.ToSitecoreItem());
            Context.Items.Remove("RedirectData");
            const string itemPath = "/ThisItemDoesNotExists";
            var layoutArgs = new GetLayoutServiceContextArgs();
            layoutArgs.ContextData.Keys.Should().BeEmpty();
            var requestContext = Substitute.For<RequestContext>();
            var requestBeginArgs = Substitute.For<RequestBeginArgs>(requestContext);
            requestBeginArgs.PageContext.RequestContext.HttpContext.Request.QueryString.Returns(new NameValueCollection
            {
                { "item", itemPath }
            });

            ConfigureSiteContext();
            redirectMapResolverService.GetRedirectData(itemPath, language: language).ReturnsForAnyArgs(redirectData);
            routeMapper.IsLayoutServiceRoute(Arg.Any<RequestContext>()).Returns(true);

            // Act
            handleItemNotFoundRedirectProcessor.Process(requestBeginArgs);
            redirectDataContext.Process(layoutArgs);

            // Assert
            layoutArgs.ContextData.ContainsKey("redirect").Should().BeTrue();
            layoutArgs.ContextData["redirect"].Should().Be(redirectData);
        }

        [Fact]
        public void Process_ShouldNotAddRedirectDataToSitecoreContext_IfItemPathHasNoRedirectConfigured()
        {
            // Arrange
            var fakeItem = new FakeItem().WithItemVersions().WithVisualization();
            var language = Language.Parse("en");
            sitecoreContext.Language.Returns(language);
            sitecoreContext.Item.Returns(fakeItem.ToSitecoreItem());
            Context.Items.Remove("RedirectData");
            const string itemPath = "/ThisItemDoesNotExists";
            var layoutArgs = new GetLayoutServiceContextArgs();
            layoutArgs.ContextData.Keys.Should().BeEmpty();

            var requestContext = Substitute.For<RequestContext>();
            var requestBeginArgs = Substitute.For<RequestBeginArgs>(requestContext);
            requestBeginArgs.PageContext.RequestContext.HttpContext.Request.QueryString.Returns(new NameValueCollection
            {
                { "item", itemPath }
            });

            ConfigureSiteContext();
            redirectMapResolverService.GetRedirectData(itemPath).ReturnsNull();
            redirectMapResolverService.GetRedirectData(Arg.Any<Sitecore.Data.Items.Item>()).ReturnsNull();

            routeMapper.IsLayoutServiceRoute(Arg.Any<RequestContext>()).Returns(true);
            // Act
            handleItemNotFoundRedirectProcessor.Process(requestBeginArgs);
            redirectDataContext.Process(layoutArgs);

            // Assert
            layoutArgs.ContextData.ContainsKey("redirect").Should().BeFalse();
        }

        [Fact]
        public void Process_ShouldNotAddRedirectDataToSitecoreContext_IfIsNotLayoutServiceRoute()
        {
            // Arrange
            var fakeItem = new FakeItem().WithItemVersions().WithVisualization();
            var language = Language.Parse("en");
            sitecoreContext.Language.Returns(language);
            sitecoreContext.Item.Returns(fakeItem.ToSitecoreItem());
            Context.Items.Remove("RedirectData");
            var layoutArgs = new GetLayoutServiceContextArgs();

            layoutArgs.ContextData.Keys.Should().BeEmpty();

            var requestContext = Substitute.For<RequestContext>();
            var requestBeginArgs = Substitute.For<RequestBeginArgs>(requestContext);

            redirectMapResolverService.GetRedirectData(Arg.Any<string>()).ReturnsNull();
            redirectMapResolverService.GetRedirectData(Arg.Any<Sitecore.Data.Items.Item>()).ReturnsNull();
            routeMapper.IsLayoutServiceRoute(Arg.Any<RequestContext>()).Returns(false);
            // Act
            handleItemNotFoundRedirectProcessor.Process(requestBeginArgs);
            redirectDataContext.Process(layoutArgs);

            // Assert
            layoutArgs.ContextData.ContainsKey("redirect").Should().BeFalse();
        }

        private static void ConfigureSiteContext()
        {
            Context.Site = new SiteInfoPropertiesBuilder("TestSiteName")
                .WithHostName("test-site-host")
                .WithDatabase("master")
                .WithStartItem("/test/start/items");
        }
    }
}