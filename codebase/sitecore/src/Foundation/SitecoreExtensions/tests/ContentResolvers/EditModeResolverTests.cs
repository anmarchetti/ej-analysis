using easyJet.Foundation.SitecoreExtensions.ContentResolvers;
using easyjet.Foundation.Testing.Attributes;
using easyJet.Foundation.Testing.Switchers;
using FluentAssertions;
using Newtonsoft.Json.Linq;
using NSubstitute;
using Sitecore;
using Sitecore.Collections;
using Sitecore.Data.Items;
using Sitecore.FakeDb.Sites;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.ContentResolvers
{
    public class EditModeResolverTests
    {
        [Theory]
        [AutoDbData]
        public void ResolveContents_ShouldBeNull_IfPageContextIsNormalMode(
            EditModeResolver resolver,
            IRenderingConfiguration renderingConfiguration)
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(new StringDictionary
            {
                { "enableWebEdit", "false" },
                { "masterDatabase", "master" }
            });

            using (new SiteContextSwitcher(fakeSiteContext))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfiguration);

                // Assert
                actual.Should().BeNull();
            }
        }

        [Theory]
        [AutoDbData]
        public void ResolveContents_ShouldBeNull_IfContextItemNull(
            EditModeResolver resolver,
            IRenderingConfiguration renderingConfiguration)
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(new StringDictionary
            {
                { "enableWebEdit", "true" },
                { "masterDatabase", "master" }
            });

            using (new SiteContextSwitcher(fakeSiteContext))
            using (new SafeContextItemSwitcher(null))
            {
                Context.Site.SetDisplayMode(DisplayMode.Edit, DisplayModeDuration.Remember);

                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfiguration);

                // Assert
                actual.Should().BeNull();
            }
        }

        [Theory]
        [AutoDbData]
        public void ResolveContents_ShouldReturnContextItem_IfItemSelectorQueryIsNull(
            EditModeResolver resolver,
            IRenderingConfiguration renderingConfiguration,
            Item item)
        {
            // Arrange
            resolver.UseContextItem = true;
            resolver.ItemSelectorQuery = null;

            string serilizedItem = "{\"PageCategory\":{\"value\":\"Global\"},\"Robots\":[],\"PageImage\":{\"value\":{\"src\":\"url\",\"alt\":\"\"}}}";

            renderingConfiguration.ItemSerializer
                .Serialize(Arg.Any<Item>())
                .Returns(serilizedItem);

            var fakeSiteContext = new FakeSiteContext(new StringDictionary
            {
                { "enableWebEdit", "true" },
                { "database", "master" },
                { "masterDatabase", "master" }
            });

            using (new SiteContextSwitcher(fakeSiteContext))
            using (new SafeContextItemSwitcher(item))
            {
                Context.Site.SetDisplayMode(DisplayMode.Edit, DisplayModeDuration.Remember);

                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfiguration);

                // Assert
                actual.Should().BeOfType<JObject>();
                actual.Should().NotBeNull();
            }
        }

        [Theory]
        [AutoDbData]
        public void ResolveContents_ShouldBeEmpty_IfContextItemHasNoChildren(
            EditModeResolver resolver,
            IRenderingConfiguration renderingConfiguration,
            Item item)
        {
            // Arrange
            resolver.UseContextItem = true;
            resolver.ItemSelectorQuery = "fakeQuery";

            string serilizedItem = "{\"PageCategory\":{\"value\":\"Global\"},\"Robots\":[],\"PageImage\":{\"value\":{\"src\":\"url\",\"alt\":\"\"}}}";

            renderingConfiguration.ItemSerializer
                .Serialize(Arg.Any<Item>())
                .Returns(serilizedItem);

            var fakeSiteContext = new FakeSiteContext(new StringDictionary
            {
                { "enableWebEdit", "true" },
                { "database", "master" },
                { "masterDatabase", "master" }
            });

            using (new SiteContextSwitcher(fakeSiteContext))
            using (new SafeContextItemSwitcher(item))
            {
                Context.Site.SetDisplayMode(DisplayMode.Edit, DisplayModeDuration.Remember);

                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfiguration);

                // Assert
                actual.Should().BeOfType<JArray>();
                (actual as JArray).Should().BeEmpty();
            }
        }

        [Theory]
        [AutoDbData]
        public void ResolveContents_ShouldBeNotEmpty_IfContextItemHasChildren(
           EditModeResolver resolver,
           IRenderingConfiguration renderingConfiguration,
           Item root,
           TemplateItem template)
        {
            // Arrange
            resolver.UseContextItem = true;
            resolver.ItemSelectorQuery = "/sitecore/content/*";

            string serilizedItem = "{\"PageCategory\":{\"value\":\"Global\"},\"Robots\":[],\"PageImage\":{\"value\":{\"src\":\"url\",\"alt\":\"\"}}}";

            renderingConfiguration.ItemSerializer
                .Serialize(Arg.Any<Item>())
                .Returns(serilizedItem);

            var fakeSiteContext = new FakeSiteContext(new StringDictionary
            {
                { "enableWebEdit", "true" },
                { "database", "master" },
                { "masterDatabase", "master" }
            });

            root.Add("Item 1", template);
            root.Add("Item 2", template);

            using (new SiteContextSwitcher(fakeSiteContext))
            using (new SafeContextItemSwitcher(root))
            {
                Context.Site.SetDisplayMode(DisplayMode.Edit, DisplayModeDuration.Remember);

                // Act
                dynamic actual = resolver.ResolveContents(new Rendering(), renderingConfiguration);

                // Assert
                JArray items = actual.Items;
                items.Should().NotBeEmpty();
            }
        }
    }
}