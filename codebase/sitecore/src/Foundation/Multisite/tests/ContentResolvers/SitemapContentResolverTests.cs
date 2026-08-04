using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.Multisite.ContentResolvers;
using easyJet.Foundation.Multisite.Models;
using easyJet.Foundation.Multisite.Repositories;
using FluentAssertions;
using Newtonsoft.Json.Linq;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.Serialization.ItemSerializers;
using Sitecore.Mvc.Presentation;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.ContentResolvers
{
    public class SitemapContentResolverTests
    {
        private readonly IHtmlSitemapRepository repository;
        private readonly SitemapContentResolver sitemapContentResolver;
        private readonly IRenderingConfiguration renderingConfiguration;

        public SitemapContentResolverTests()
        {
            repository = Substitute.For<IHtmlSitemapRepository>();
            sitemapContentResolver = new SitemapContentResolver(repository);
            renderingConfiguration = Substitute.For<IRenderingConfiguration>();
        }

        [Fact]
        public void ResolveContents_ShouldBeNull_IfMethodThrowException()
        {
            // Act
            renderingConfiguration.ItemSerializer
                .Serialize(Arg.Any<Item>())
                .Returns("{}");

            var actual = sitemapContentResolver.ResolveContents(new Rendering(), renderingConfiguration);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void ResolveContents_ShouldResolveContents_IfDataExist(Db db)
        {
            // Arrange
            var renderingDbItem = new DbItem("Rendering");
            db.Add(renderingDbItem);

            IRenderingConfiguration renderingConfig = Substitute.For<IRenderingConfiguration>();
            RenderingItem renderingItem = new RenderingItem(db.GetItem(renderingDbItem.ID));
            var pageTempalteId = ID.NewID;

            var homePageDbItem = new DbItem("Home");

            var pageDbItem = new DbItem("Page");
            pageDbItem.TemplateID = pageTempalteId;
            pageDbItem.Fields.Add(Constants.Fields.BasePage.Robots, string.Empty);
            pageDbItem.Fields.Add(Constants.Fields.BasePage.CanonicalUrl, string.Empty);
            pageDbItem.Fields.Add(Constants.Fields.BasePage.RedirectUrl, string.Empty);
            homePageDbItem.Add(pageDbItem);

            var sitemapBlockDbItem = new DbItem("Sitemap block");
            var sitemapSectionDbItem = new DbItem("Sitemap Section");
            sitemapSectionDbItem.Fields.Add(Constants.Fields.SitemapBase.Pages, string.Empty);
            sitemapSectionDbItem.Fields.Add(Constants.Fields.SitemapBase.PageTemplates, pageTempalteId.ToString());
            sitemapSectionDbItem.Fields.Add(Constants.Fields.SitemapBase.Title, sitemapSectionDbItem.Name);
            sitemapBlockDbItem.Add(sitemapSectionDbItem);
            db.Add(homePageDbItem);
            db.Add(sitemapBlockDbItem);

            var expected = new SitemapSection(db.GetItem(sitemapSectionDbItem.ID));

            var response = new JObject()
            {
                ["items"] = JArray.FromObject(new SitemapSection[] { expected })
            }.ToString();

            repository.BuildSitemapBySections(Arg.Any<Item>()).Returns(new List<SitemapSection> { expected });
            renderingConfig.ItemSerializer
                .Serialize(Arg.Any<Item>())
                .Returns(response);

            // Act
            var actual = JObject.FromObject(sitemapContentResolver.ResolveContents(new Rendering() { RenderingItem = renderingItem, DataSource = sitemapBlockDbItem.ID.ToString() }, renderingConfig));

            // Assert
            actual.Should().HaveCount(1);
            ((string)actual["items"][0]["IsGroupedAlphabetically"]).Should().BeEquivalentTo(expected.IsGroupedAlphabetically.ToString());
            ((string)actual["items"][0]["Title"]).Should().BeEquivalentTo(expected.Title);
        }
    }
}
