using System;
using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Multisite.Logging;
using easyJet.Foundation.Multisite.Models;
using easyJet.Foundation.Multisite.Repositories;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Sitecore;
using Sitecore.Collections;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.Globalization;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Repositories
{
    public class XmlSitemapRepositoryTests
    {
        private readonly IMultisiteLogger logger;
        private readonly IHtmlCacheRepository cache;
        private readonly IMultiSiteContext multiSiteContext;
        private readonly ISitecoreContext context;

        public XmlSitemapRepositoryTests()
        {
            logger = Substitute.For<IMultisiteLogger>();
            context = Substitute.For<ISitecoreContext>();
            multiSiteContext = Substitute.For<IMultiSiteContext>();
            cache = Substitute.ForPartsOf<HtmlCacheRepository>();
        }

        [Theory]
        [AutoData]
        public void SitemapRepository_ShouldReturnSitemapForHomePage_IfHomePageNotContainsChildElements(Db db, IEnumerable<ID> templatesToExclude, IEnumerable<ID> templatesToExcludeForUi, IEnumerable<ID> templatesToExcludeChildren)
        {
            // Arrange
            var templatesToExcludeSetting = string.Join(",", templatesToExclude);
            var templatesToExcludeForUiSetting = string.Join(",", templatesToExcludeForUi);
            var templatesToExcludeChildrenSetting = string.Join(",", templatesToExcludeChildren);
            XmlSitemapRepository repository;
            cache.GetItem<Dictionary<string, List<SitemapItem>>>(Arg.Any<string>()).Returns<object>(null);
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExclude", templatesToExcludeSetting))
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExcludeForUi", templatesToExcludeForUiSetting))
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExcludeChildren", templatesToExcludeChildrenSetting))
            {
                repository = new XmlSitemapRepository(cache, logger, multiSiteContext, context);
            }

            var rootItem = new DbItem("Home");
            db.Add(rootItem);

            var fakeSite = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "website" }, { "database", "master" }, { "startItem", db.GetItem(rootItem.ID).Paths.FullPath }
                });
            context.Database = db.Database;
            context.Item = db.GetItem(rootItem.ID);
            context.Site = fakeSite;
            using (new SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = repository.BuildSitemap(Language.Parse("en"));

                // Assert
                actual.Count().Should().Be(1);
            }
        }

        [Theory]
        [AutoData]
        public void SitemapRepository_ShouldThrowException_IfCacheServiceThrowException(Db db, IEnumerable<ID> templatesToExclude, IEnumerable<ID> templatesToExcludeForUi, IEnumerable<ID> templatesToExcludeChildren)
        {
            // Arrange
            XmlSitemapRepository repository;
            cache.When(x => x.StoreItem(Arg.Any<string>(), Arg.Any<Dictionary<string, List<SitemapItem>>>())).Do(x => throw new Exception());
            var templatesToExcludeSetting = string.Join(",", templatesToExclude);
            var templatesToExcludeForUiSetting = string.Join(",", templatesToExcludeForUi);
            var templatesToExcludeChildrenSetting = string.Join(",", templatesToExcludeChildren);
            cache.GetItem<Dictionary<string, List<SitemapItem>>>(Arg.Any<string>()).Returns<object>(null);
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExclude", templatesToExcludeSetting))
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExcludeForUi", templatesToExcludeForUiSetting))
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExcludeChildren", templatesToExcludeChildrenSetting))
            {
                repository = new XmlSitemapRepository(cache, logger, multiSiteContext, context);
            }

            var rootItem = new DbItem("Home");
            db.Add(rootItem);

            var fakeSite = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "website" }, { "database", "master" }, { "startItem", db.GetItem(rootItem.ID).Paths.FullPath }
                })
            {
                Database = db.Database
            };

            using (new SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = repository.BuildSitemap(Language.Parse("en"));

                // Assert
                actual.Should().Throws<Exception>();
            }
        }

        [Theory]
        [AutoData]
        public void SitemapRepository_ShouldReturnSitemap_IfHomePageContainsChildElements(Db db, IEnumerable<ID> templatesToExclude, IEnumerable<ID> templatesToExcludeChildren)
        {
            // Arrange
            var templatesToExcludeSetting = string.Join(",", templatesToExclude);
            var templatesToExcludeChildrenSetting = string.Join(",", templatesToExcludeChildren);
            XmlSitemapRepository repository;
            cache.GetItem<Dictionary<string, List<SitemapItem>>>(Arg.Any<string>()).Returns<object>(null);
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExclude", templatesToExcludeSetting))
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExcludeChildren", templatesToExcludeChildrenSetting))
            {
                repository = new XmlSitemapRepository(cache, logger, multiSiteContext, context);
            }

            var rootItem = new DbItem("Home");

            var changeFrequencyItem = new DbItem("Change Frequency test item");
            changeFrequencyItem.Fields.Add(Constants.Fields.SitecoreProperty.Value, "0");
            db.Add(changeFrequencyItem);

            var pageItem = new DbItem("Test item");
            pageItem.Fields.Add(Constants.Fields.SitemapBase.ChangeFrequency, db.GetItem(changeFrequencyItem.ID).ID.ToString());
            pageItem.Fields.Add(FieldIDs.LayoutField, ID.NewID.ToString());

            var childPageItem = new DbItem("Test child item");
            childPageItem.Fields.Add(Constants.Fields.SitemapBase.ChangeFrequency, db.GetItem(changeFrequencyItem.ID).ID.ToString());

            childPageItem.Fields.Add(new DbField("LayoutField", FieldIDs.LayoutField)
            {
                { "en", ID.NewID.ToString() },
                { "da", ID.NewID.ToString() }
            });
            pageItem.Add(childPageItem);
            rootItem.Add(pageItem);

            db.Add(rootItem);

            var fakeSite = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "website" }, { "database", "master" }, { "startItem", db.GetItem(rootItem.ID).Paths.FullPath }
                });
            context.Site = fakeSite;

            context.Database = db.Database;
            context.Item = db.GetItem(rootItem.ID);

            using (new SettingsSwitcher("Multisite.Sitemap.ShouldSupportMultilanguage", bool.TrueString))
            using (new SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = repository.BuildSitemap(Language.Parse("en"));

                // Assert
                actual.Count().Should().Be(4);
            }
        }
    }
}