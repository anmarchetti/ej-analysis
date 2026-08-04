using System;
using easyJet.Feature.PageContent.ContentResolvers;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Newtonsoft.Json.Linq;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Sitecore.Abstractions;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.ContentResolvers
{
    public class DealsLinksContentResolverTests
    {
        private readonly DealsLinksContentResolver resolver;
        private readonly IRenderingConfiguration renderingConfiguration;
        private readonly BaseLinkManager linkManager;

        public DealsLinksContentResolverTests()
        {
            // Arrange
            linkManager = Substitute.For<BaseLinkManager>();
            renderingConfiguration = Substitute.For<IRenderingConfiguration>();
            resolver = new DealsLinksContentResolver(linkManager)
            {
                UseContextItem = false
            };
        }

        [Fact]
        public void ResolveContents_ShouldBeNull_IfRenderingDataSourceIsNull()
        {
            // Act
            var rendering = new Rendering()
            {
                DataSource = null
            };

            var actual = resolver.ResolveContents(rendering, renderingConfiguration);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ResolveContents_ShouldBeNull_IfRenderingItemIsNull()
        {
            // Act
            var rendering = new Rendering()
            {
                DataSource = "fakeDatasource"
            };

            var actual = resolver.ResolveContents(rendering, renderingConfiguration);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void ResolveContents_ShouldResolveContents_IfUseContextItemMode(
            IRenderingConfiguration renderingConfig,
            Db db,
            RenderingItem renderingItem,
            string title,
            string subtitle,
            string url)
        {
            // Arrange
            var page = new DbItem("Page1");

            var dealsLinks = new DbItem("Deals Links");
            dealsLinks.Fields.Add(Constants.Fields.DealsLinks.Title, title);
            dealsLinks.Fields.Add(Constants.Fields.DealsLinks.Subtitle, subtitle);

            var pages = new DbField(Constants.Fields.DealsLinks.Pages)
            {
                Type = "Multilistfield",
                Value = $"{page.ID}"
            };

            dealsLinks.Fields.Add(pages);

            db.Add(dealsLinks);
            db.Add(page);

            linkManager.GetItemUrl(Arg.Any<Item>()).Returns(url);

            resolver.ItemSelectorQuery = "./*";

            renderingConfig.ItemSerializer.Serialize(Arg.Any<Item>()).Returns("{}");
            var rendering = new Rendering()
            {
                RenderingItem = renderingItem,
                DataSource = dealsLinks.ID.ToString()
            };

            // Act
            var actual = JObject.FromObject(resolver.ResolveContents(rendering, renderingConfig));

            // Assert
            ((string)actual["Title"]["value"]).Should().BeEquivalentTo(title);
            ((string)actual["Subtitle"]["value"]).Should().BeEquivalentTo(subtitle);
            ((string)actual["Pages"][0]["Url"]).Should().BeEquivalentTo(url);
        }

        [Fact]
        public void ResolveContents_ShouldLogError_IfThrowsError()
        {
            // Arrange
            resolver.UseContextItem = true;
            var renderingConfig = Substitute.For<IRenderingConfiguration>();

            var item = new FakeItem();

            using (new ContextItemSwitcher(item))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfig);

                // Assert
                actual.Should().BeNull();
            }
        }
    }
}
