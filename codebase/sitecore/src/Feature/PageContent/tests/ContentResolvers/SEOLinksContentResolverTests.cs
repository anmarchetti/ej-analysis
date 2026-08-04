using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Feature.PageContent.ContentResolvers;
using easyJet.Foundation.SitecoreExtensions.Models;
using FluentAssertions;
using Newtonsoft.Json.Linq;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.ContentResolvers
{
    public class SEOLinksContentResolverTests
    {
        private readonly SEOLinksContentResolver resolver;
        private readonly IRenderingConfiguration renderingConfiguration;
        private readonly BaseLinkManager linkManager;

        public SEOLinksContentResolverTests()
        {
            // Arrange
            linkManager = Substitute.For<BaseLinkManager>();
            renderingConfiguration = Substitute.For<IRenderingConfiguration>();
            resolver = Substitute.ForPartsOf<SEOLinksContentResolver>(linkManager);
            resolver.UseContextItem = false;
            resolver.ItemSelectorQuery = "./*";
        }

        [Theory]
        [AutoData]
        public void ResolveContents_ShouldResolveContents_IfRenderingHasDatasource(string url, string title)
        {
            // Arrange
            var database = Substitute.For<Database>();
            var item = new FakeItem()
                .WithField(Constants.Fields.SEOLinks.Title, title)
                .WithItemAxes();
            item.ToSitecoreItem().Axes.SelectItems(Arg.Any<string>()).Returns(new Item[] { item });

            database.GetItem(Arg.Any<string>()).Returns(item);

            var renderingItem = Substitute.For<RenderingItem>(item.ToSitecoreItem());
            renderingItem.Database.Returns(database);

            var rendering = Substitute.For<Rendering>();
            rendering.RenderingItem.Returns(renderingItem);
            rendering.DataSource.Returns(item.ID.ToString());

            linkManager.GetItemUrl(Arg.Any<Item>()).Returns(url);
            var listItems = new List<Item>()
            {
                new FakeItem().WithTemplate(Constants.TemplateIds.NavigationLink),
                new FakeItem().WithTemplate(Constants.TemplateIds.BasePage),
            };
            resolver.GetItems(Arg.Any<Item>(), Arg.Any<string>()).Returns(listItems);
            var link = new Link()
            {
                Text = title,
                Url = url,
            };
            resolver.GetLinkField(Arg.Any<Item>(), Arg.Any<string>()).Returns(link);

            // Act
            var actual = JObject.FromObject(resolver.ResolveContents(rendering, renderingConfiguration));

            // Assert
            actual["items"].Should().HaveCount(1);
            actual["items"].Value<JArray>().First["Title"]["value"].Value<string>().Should().Be(title);
            actual["items"].Value<JArray>().First["Links"].Should().HaveCount(2);
        }
    }
}
