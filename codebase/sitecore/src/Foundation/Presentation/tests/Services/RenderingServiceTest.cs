using System.Collections.Generic;
using easyJet.Foundation.Presentation.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using Sitecore.NSubstituteUtils;
using Sitecore.Sites;
using Xunit;
using ISitecoreContext = easyJet.Foundation.Multisite.ISitecoreContext;

namespace easyJet.Foundation.Presentation.Tests.Services
{
    public class RenderingServiceTest
    {
        private readonly IHtmlCacheRepository cache;
        private readonly Multisite.ISitecoreContext context;
        private readonly RenderingService renderingService;

        public RenderingServiceTest()
        {
            cache = Substitute.For<IHtmlCacheRepository>();
            context = Substitute.For<ISitecoreContext>();
            renderingService = new RenderingService(cache, context);
        }

        [Fact]
        public void ShouldRenderingBeHidden_ShouldReturnFalse_IfSiteInfoIsnull()
        {
            // Arrange
            var item = new FakeItem();

            // Act
            var actual = renderingService.ShouldRenderingBeHidden(item);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void ShouldRenderingBeHidden_ShouldReturnTrue_IfIdEqualsRenderingId()
        {
            // Arrange
            var item = new FakeItem()
                .WithField(Templates.HideRendering.Fields.Renderings, "value")
                .ToSitecoreItem();
            SiteContext siteContext = new SiteInfoPropertiesBuilder("TestSiteName")
                .WithHostName("test-site-host")
                .WithDatabase("test-database")
                .WithStartItem("/test/start/items");
            context.Site = siteContext;
            cache.GetOrAdd(Arg.Any<string>(), () => new HashSet<string>()).ReturnsForAnyArgs(new HashSet<string> { item.ID.ToString() });

            // Act
            var actual = renderingService.ShouldRenderingBeHidden(item);

            // Assert
            actual.Should().BeTrue();
        }
    }
}