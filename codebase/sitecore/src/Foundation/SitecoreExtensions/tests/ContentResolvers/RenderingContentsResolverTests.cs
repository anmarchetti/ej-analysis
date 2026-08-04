using AutoFixture.Xunit2;
using easyJet.Foundation.SitecoreExtensions.ContentResolvers;
using FluentAssertions;
using Newtonsoft.Json.Linq;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.FakeDb.Sites;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.ContentResolvers
{
    public class RenderingContentsResolverTests
    {
        [Theory]
        [AutoData]
        public void ProcessItems_ShouldContainUrl_IfTemplateHasCorrectBaseTemplate(string itemSelectorQuery, string name)
        {
            // Arrange
            var fakeItem = new FakeItem()
                .WithTemplate(Constants.TemplateIds.BasePageTemplate)
                .WithName(name)
                .WithPath("/")
                .WithItemAxes();

            var item = fakeItem.ToSitecoreItem();
            item.Database.GetItem(item.ID.ToString()).Returns(item);
            item.Axes.SelectItems(itemSelectorQuery).Returns(new[] { item });

            var renderingConfiguration = Substitute.For<IRenderingConfiguration>();
            var serializedItem = "{\"PageCategory\":{\"value\":\"Global\"},\"Robots\":[],\"PageImage\":{\"value\":{\"src\":\"url\",\"alt\":\"\"}}}";
            renderingConfiguration.ItemSerializer
                .Serialize(Arg.Any<Item>())
                .Returns(serializedItem);

            var fakeSite = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "website" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
                });

            var rendering = new Rendering { DataSource = item.ID.ToString(), RenderingItem = item };
            var sut = new RenderingContentsResolver { UseContextItem = false, ItemSelectorQuery = itemSelectorQuery };

            using (new Sitecore.Sites.SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = sut.ResolveContents(rendering, renderingConfiguration);

                // Assert
                actual.Should().BeOfType<JObject>();
                actual.Should().NotBeNull();
                var url = (actual as JObject)["items"].First["url"];
                url.Should().NotBeNull();
                url.Value<string>().Should().Be("/");
            }
        }

        [Theory]
        [AutoData]
        public void ProcessItems_ShouldNotContainUrl_IfTemplateHasIncorrectBaseTemplate(string itemSelectorQuery, string name)
        {
            // Arrange
            var fakeItem = new FakeItem()
                .WithTemplate(Constants.TemplateIds.BaseObjectTemplate)
                .WithName(name)
                .WithPath("/")
                .WithItemAxes();

            var item = fakeItem.ToSitecoreItem();
            item.Database.GetItem(item.ID.ToString()).Returns(item);
            item.Axes.SelectItems(itemSelectorQuery).Returns(new[] { item });

            var renderingConfiguration = Substitute.For<IRenderingConfiguration>();
            var serializedItem = "{\"PageCategory\":{\"value\":\"Global\"},\"Robots\":[],\"PageImage\":{\"value\":{\"src\":\"url\",\"alt\":\"\"}}}";
            renderingConfiguration.ItemSerializer
                .Serialize(Arg.Any<Item>())
                .Returns(serializedItem);

            var fakeSite = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "website" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
                });

            var rendering = new Rendering { DataSource = item.ID.ToString(), RenderingItem = item };
            var sut = new RenderingContentsResolver { UseContextItem = false, ItemSelectorQuery = itemSelectorQuery };

            using (new Sitecore.Sites.SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = sut.ResolveContents(rendering, renderingConfiguration);

                // Assert
                actual.Should().BeOfType<JObject>();
                actual.Should().NotBeNull();
                var url = (actual as JObject)["items"].First["url"];
                url.Should().BeNull();
            }
        }
    }
}