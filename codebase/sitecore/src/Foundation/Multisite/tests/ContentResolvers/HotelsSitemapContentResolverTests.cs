using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Multisite.ContentResolvers;
using easyJet.Foundation.Multisite.Models;
using easyJet.Foundation.Multisite.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using FluentAssertions;
using Newtonsoft.Json.Linq;
using NSubstitute;
using Sitecore.Collections;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.ContentResolvers
{
    public class HotelsSitemapContentResolverTests
    {
        private readonly IHtmlSitemapRepository repository;
        private readonly HotelsSitemapContentResolver resolver;
        private readonly IRenderingConfiguration renderingConfiguration;

        public HotelsSitemapContentResolverTests()
        {
            repository = Substitute.For<IHtmlSitemapRepository>();
            resolver = new HotelsSitemapContentResolver(repository);
            renderingConfiguration = Substitute.For<IRenderingConfiguration>();
        }

        [Fact]
        public void ResolveContents_ShouldReturnNull_WhenContextItemIsNull()
        {
            // Act
            renderingConfiguration.ItemSerializer
                .Serialize(Arg.Any<Item>())
                .Returns("{}");

            var actual = resolver.ResolveContents(new Rendering(), renderingConfiguration);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void ResolveContents_ShouldReturnNull_WhenNoSectionsConfigured(Db db)
        {
            // Arrange
            var renderingDbItem = new DbItem("Rendering");
            var sitemapBlockDbItem = new DbItem("Sitemap Block");
            db.Add(renderingDbItem);
            db.Add(sitemapBlockDbItem);

            IRenderingConfiguration renderingConfig = Substitute.For<IRenderingConfiguration>();
            RenderingItem renderingItem = new RenderingItem(db.GetItem(renderingDbItem.ID));

            renderingConfig.ItemSerializer
                .Serialize(Arg.Any<Item>())
                .Returns("{}");

            // Act
            var actual = resolver.ResolveContents(
                new Rendering { RenderingItem = renderingItem, DataSource = sitemapBlockDbItem.ID.ToString() },
                renderingConfig);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void ResolveContents_ShouldReturnOnlyFirstSection_WhenMultipleSectionsConfigured(Db db)
        {
            // Arrange
            var renderingDbItem = new DbItem("Rendering");
            db.Add(renderingDbItem);

            IRenderingConfiguration renderingConfig = Substitute.For<IRenderingConfiguration>();
            RenderingItem renderingItem = new RenderingItem(db.GetItem(renderingDbItem.ID));

            var sectionOne = new DbItem("Section One");
            sectionOne.Fields.Add(Constants.Fields.SitemapBase.Title, "Section One");

            var sectionTwo = new DbItem("Section Two");
            sectionTwo.Fields.Add(Constants.Fields.SitemapBase.Title, "Section Two");

            var sitemapBlockDbItem = new DbItem("Sitemap Block");
            sitemapBlockDbItem.Fields.Add(Constants.Fields.SitemapBlock.Sections, $"{sectionOne.ID}|{sectionTwo.ID}");
            sitemapBlockDbItem.Add(sectionOne);
            sitemapBlockDbItem.Add(sectionTwo);
            db.Add(sitemapBlockDbItem);

            repository.BuildSitemapBySections(Arg.Any<Item>(), Arg.Any<Item[]>())
                .Returns(new List<SitemapSection> { new SitemapSection(db.GetItem(sectionOne.ID)) });

            renderingConfig.ItemSerializer
                .Serialize(Arg.Any<Item>())
                .Returns("{}");

            // Act
            var actual = JObject.FromObject(resolver.ResolveContents(
                new Rendering { RenderingItem = renderingItem, DataSource = sitemapBlockDbItem.ID.ToString() },
                renderingConfig));

            // Assert
            actual["items"].Should().HaveCount(1);
            ((string)actual["items"][0]["Title"]).Should().Be("Section One");
        }

        [Theory]
        [AutoData]
        public void ResolveContents_ShouldReturnNull_WhenSectionHasNoRoots(Db db)
        {
            // Arrange
            var renderingDbItem = new DbItem("Rendering");
            db.Add(renderingDbItem);

            IRenderingConfiguration renderingConfig = Substitute.For<IRenderingConfiguration>();
            RenderingItem renderingItem = new RenderingItem(db.GetItem(renderingDbItem.ID));

            var sectionDbItem = new DbItem("Section");
            var sitemapBlockDbItem = new DbItem("Sitemap Block");
            sitemapBlockDbItem.Fields.Add(Constants.Fields.SitemapBlock.Sections, sectionDbItem.ID.ToString());
            sitemapBlockDbItem.Add(sectionDbItem);
            db.Add(sitemapBlockDbItem);

            repository.BuildSitemapBySections(Arg.Any<Item>(), Arg.Any<Item[]>())
                .Returns(new List<SitemapSection> { new SitemapSection(db.GetItem(sectionDbItem.ID)) });

            renderingConfig.ItemSerializer
                .Serialize(Arg.Any<Item>())
                .Returns("{}");

            // Act
            var actual = JObject.FromObject(resolver.ResolveContents(
                new Rendering { RenderingItem = renderingItem, DataSource = sitemapBlockDbItem.ID.ToString() },
                renderingConfig));

            // Assert — section returned but GroupedPages is null or empty when no roots
            actual["items"].Should().HaveCount(1);
            var groupedPages = actual.SelectToken("items[0].GroupedPages");
            (groupedPages == null || !groupedPages.HasValues).Should().BeTrue();
        }

        [Fact]
        public void ResolveContents_ShouldGroupPagesByChildUrl()
        {
            using (var db = new Db())
            {
                // Arrange
                var renderingDbItem = new DbItem("Rendering");
                db.Add(renderingDbItem);

                IRenderingConfiguration renderingConfig = Substitute.For<IRenderingConfiguration>();
                RenderingItem renderingItem = new RenderingItem(db.GetItem(renderingDbItem.ID));

                var spainChild = new DbItem("Spain");
                var franceChild = new DbItem("France");
                var rootDbItem = new DbItem("Hotels");
                rootDbItem.Add(spainChild);
                rootDbItem.Add(franceChild);

                var sectionDbItem = new DbItem("Section");
                sectionDbItem.Fields.Add(Constants.Fields.SitemapBase.Roots, rootDbItem.ID.ToString());
                sectionDbItem.Add(rootDbItem);

                var sitemapBlockDbItem = new DbItem("Home");
                sitemapBlockDbItem.Fields.Add(Constants.Fields.SitemapBlock.Sections, sectionDbItem.ID.ToString());
                sitemapBlockDbItem.Add(sectionDbItem);
                db.Add(sitemapBlockDbItem);

                var fakeSite = new FakeSiteContext(new StringDictionary
                {
                    { "name", "website" },
                    { "database", "master" },
                    { "startItem", db.GetItem(sitemapBlockDbItem.ID).Paths.FullPath }
                });

                using (new SiteContextSwitcher(fakeSite))
                {
                    var spainItem = db.GetItem(spainChild.ID);
                    var franceItem = db.GetItem(franceChild.ID);

                    var spainUrl = spainItem.GetItemUrl();
                    var franceUrl = franceItem.GetItemUrl();

                    var allPages = new List<SitemapItem>
                    {
                        new SitemapItem(spainItem) { Url = spainUrl + "/mallorca" },
                        new SitemapItem(spainItem) { Url = spainUrl + "/ibiza" },
                        new SitemapItem(franceItem) { Url = franceUrl + "/paris" }
                    };

                    var section = new SitemapSection(db.GetItem(sectionDbItem.ID)) { Pages = allPages };

                    repository.BuildSitemapBySections(Arg.Any<Item>(), Arg.Any<Item[]>())
                        .Returns(new List<SitemapSection> { section });

                    renderingConfig.ItemSerializer
                        .Serialize(Arg.Any<Item>())
                        .Returns("{}");

                    // Act
                    var actual = JObject.FromObject(resolver.ResolveContents(
                        new Rendering { RenderingItem = renderingItem, DataSource = sitemapBlockDbItem.ID.ToString() },
                        renderingConfig));

                    // Assert
                    var groupedPages = actual["items"][0]["GroupedPages"];
                    groupedPages.Should().HaveCount(2);

                    var spainGroup = groupedPages.First(g => (string)g["Title"] == "Spain");
                    var franceGroup = groupedPages.First(g => (string)g["Title"] == "France");

                    spainGroup["Pages"].Select(p => (string)p["Url"]).Should().Contain(spainUrl + "/mallorca");
                    spainGroup["Pages"].Select(p => (string)p["Url"]).Should().Contain(spainUrl + "/ibiza");
                    franceGroup["Pages"].Select(p => (string)p["Url"]).Should().Contain(franceUrl + "/paris");
                }
            }
        }

        [Fact]
        public void ResolveContents_ShouldLeaveGroupedPagesNull_WhenNoChildrenHaveMatchingPages()
        {
            using (var db = new Db())
            {
                // Arrange
                var renderingDbItem = new DbItem("Rendering");
                db.Add(renderingDbItem);

                IRenderingConfiguration renderingConfig = Substitute.For<IRenderingConfiguration>();
                RenderingItem renderingItem = new RenderingItem(db.GetItem(renderingDbItem.ID));

                var childDbItem = new DbItem("Spain");
                var rootDbItem = new DbItem("Hotels");
                rootDbItem.Add(childDbItem);

                var sectionDbItem = new DbItem("Section");
                sectionDbItem.Fields.Add(Constants.Fields.SitemapBase.Roots, rootDbItem.ID.ToString());
                sectionDbItem.Add(rootDbItem);

                var sitemapBlockDbItem = new DbItem("Home");
                sitemapBlockDbItem.Fields.Add(Constants.Fields.SitemapBlock.Sections, sectionDbItem.ID.ToString());
                sitemapBlockDbItem.Add(sectionDbItem);
                db.Add(sitemapBlockDbItem);

                var fakeSite = new FakeSiteContext(new StringDictionary
                {
                    { "name", "website" },
                    { "database", "master" },
                    { "startItem", db.GetItem(sitemapBlockDbItem.ID).Paths.FullPath }
                });

                using (new SiteContextSwitcher(fakeSite))
                {
                    var section = new SitemapSection(db.GetItem(sectionDbItem.ID))
                    {
                        Pages = new List<SitemapItem>
                        {
                            new SitemapItem(db.GetItem(sitemapBlockDbItem.ID)) { Url = "/unrelated/page" }
                        }
                    };

                    repository.BuildSitemapBySections(Arg.Any<Item>(), Arg.Any<Item[]>())
                        .Returns(new List<SitemapSection> { section });

                    renderingConfig.ItemSerializer
                        .Serialize(Arg.Any<Item>())
                        .Returns("{}");

                    // Act
                    var actual = JObject.FromObject(resolver.ResolveContents(
                        new Rendering { RenderingItem = renderingItem, DataSource = sitemapBlockDbItem.ID.ToString() },
                        renderingConfig));

                    // Assert — section is returned, GroupedPages is null or empty
                    actual["items"].Should().HaveCount(1);
                    var groupedPages = actual.SelectToken("items[0].GroupedPages");
                    (groupedPages == null || !groupedPages.HasValues).Should().BeTrue();
                }
            }
        }
    }
}
