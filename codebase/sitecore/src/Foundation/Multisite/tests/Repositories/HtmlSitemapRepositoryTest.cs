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
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Repositories
{
    public class HtmlSitemapRepositoryTest
    {
        private readonly IMultisiteLogger multisiteLogger;
        private readonly ISitecoreContext context;
        private readonly IHtmlCacheRepository cache;

        public HtmlSitemapRepositoryTest()
        {
            multisiteLogger = Substitute.For<IMultisiteLogger>();
            context = new SitecoreContext();
            cache = Substitute.ForPartsOf<HtmlCacheRepository>();
        }

        [Theory]
        [AutoData]
        public void HtmlSitemapRepository_ShouldReturnSitemapSectionForHomePage(Db db, IEnumerable<ID> templatesToExclude, IEnumerable<ID> templatesToExcludeChildren)
        {
            // Arrange
            var templatesToExcludeSetting = string.Join(",", templatesToExclude);
            var templatesToExcludeChildrenSetting = string.Join(",", templatesToExcludeChildren);
            HtmlSitemapRepository repository;
            cache.GetItem<Dictionary<string, List<SitemapItem>>>(Arg.Any<string>()).Returns<object>(null);
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExclude", templatesToExcludeSetting))
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExcludeChildren", templatesToExcludeChildrenSetting))
            {
                repository = new HtmlSitemapRepository(cache, multisiteLogger, context);
            }

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

            var rootItem = new DbItem("Home");
            rootItem.Fields.Add(Constants.Fields.SitemapBlock.Sections, pageItem.ID.ToString());

            pageItem.Add(childPageItem);
            rootItem.Add(pageItem);

            db.Add(rootItem);

            var fakeSite = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "website" }, { "database", "master" }, { "startItem", db.GetItem(rootItem.ID).Paths.FullPath }
                });
            context.Database = db.Database;
            context.Site = fakeSite;
            context.Item = db.GetItem(rootItem.ID);

            using (new SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = repository.BuildSitemapBySections(db.GetItem(rootItem.ID));
                // Assert
                actual.Count.Should().Be(1);
            }
        }

        [Theory]
        [AutoData]
        public void HtmlSitemapRepository_ShouldSkipNotSelectedSitemapSection(Db db, IEnumerable<ID> templatesToExclude, IEnumerable<ID> templatesToExcludeChildren)
        {
            // Arrange
            var templatesToExcludeSetting = string.Join(",", templatesToExclude);
            var templatesToExcludeChildrenSetting = string.Join(",", templatesToExcludeChildren);
            HtmlSitemapRepository repository;
            cache.GetItem<Dictionary<string, List<SitemapItem>>>(Arg.Any<string>()).Returns<object>(null);
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExclude", templatesToExcludeSetting))
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExcludeChildren", templatesToExcludeChildrenSetting))
            {
                repository = new HtmlSitemapRepository(cache, multisiteLogger, context);
            }

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

            var otherPageItem = new DbItem("Not selected item");

            var rootItem = new DbItem("Home");
            rootItem.Fields.Add(Constants.Fields.SitemapBlock.Sections, pageItem.ID.ToString());

            pageItem.Add(childPageItem);
            rootItem.Add(pageItem);
            rootItem.Add(otherPageItem);

            db.Add(rootItem);

            var fakeSite = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "website" }, { "database", "master" }, { "startItem", db.GetItem(rootItem.ID).Paths.FullPath }
                });
            context.Database = db.Database;
            context.Site = fakeSite;
            context.Item = db.GetItem(rootItem.ID);

            using (new SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = repository.BuildSitemapBySections(db.GetItem(rootItem.ID));
                // Assert
                actual.Count.Should().Be(1);
            }
        }

        [Theory]
        [AutoData]
        public void SitemapRepository_ShouldThrowException_IfCacheServiceThrowException(Db db, IEnumerable<ID> templatesToExclude, IEnumerable<ID> templatesToExcludeForUi, IEnumerable<ID> templatesToExcludeChildren)
        {
            // Arrange
            HtmlSitemapRepository repository;
            cache.When(x => x.StoreItem(Arg.Any<string>(), Arg.Any<Dictionary<string, List<SitemapItem>>>())).Do(x => throw new Exception());
            var templatesToExcludeSetting = string.Join(",", templatesToExclude);
            var templatesToExcludeForUiSetting = string.Join(",", templatesToExcludeForUi);
            var templatesToExcludeChildrenSetting = string.Join(",", templatesToExcludeChildren);
            cache.GetItem<Dictionary<string, List<SitemapItem>>>(Arg.Any<string>()).Returns<object>(null);
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExclude", templatesToExcludeSetting))
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExcludeForUi", templatesToExcludeForUiSetting))
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExcludeChildren", templatesToExcludeChildrenSetting))
            {
                repository = new HtmlSitemapRepository(cache, multisiteLogger, context);
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
                var actual = repository.BuildSitemapBySections(db.GetItem(rootItem.ID));

                // Assert
                actual.Should().Throws<Exception>();
            }
        }

        [Fact]
        public void BuildSitemapBySections_ShouldFilterPagesByRoots()
        {
            // Arrange
            cache.GetItem<List<SitemapSection>>(Arg.Any<string>()).Returns((List<SitemapSection>)null);
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExclude", string.Empty))
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExcludeChildren", string.Empty))
            using (var db = new Db())
            {
                var repository = new HtmlSitemapRepository(cache, multisiteLogger, context);

                var pageTemplateId = ID.NewID;

                var pageInAustria = new DbItem("Hotel in Austria", ID.NewID, pageTemplateId);
                pageInAustria.Fields.Add(FieldIDs.LayoutField, ID.NewID.ToString());

                var pageInSpain = new DbItem("Hotel in Spain", ID.NewID, pageTemplateId);
                pageInSpain.Fields.Add(FieldIDs.LayoutField, ID.NewID.ToString());

                var austriaRoot = new DbItem("Austria");
                austriaRoot.Add(pageInAustria);

                var spainRoot = new DbItem("Spain");
                spainRoot.Add(pageInSpain);

                var sectionItem = new DbItem("Hotels by country");
                sectionItem.Fields.Add(Constants.Fields.SitemapBase.PageTemplates, pageTemplateId.ToString());
                sectionItem.Fields.Add(Constants.Fields.SitemapBase.Roots, austriaRoot.ID.ToString());

                var settingsItem = new DbItem("Home");
                settingsItem.Fields.Add(Constants.Fields.SitemapBlock.Sections, sectionItem.ID.ToString());
                settingsItem.Add(sectionItem);
                settingsItem.Add(austriaRoot);
                settingsItem.Add(spainRoot);
                db.Add(settingsItem);

                var fakeSite = new FakeSiteContext(new StringDictionary
                {
                    { "name", "website" },
                    { "database", "master" },
                    { "startItem", db.GetItem(settingsItem.ID).Paths.FullPath }
                });

                context.Database = db.Database;
                context.Site = fakeSite;
                context.Item = db.GetItem(settingsItem.ID);

                using (new SiteContextSwitcher(fakeSite))
                {
                    // Act
                    var result = repository.BuildSitemapBySections(db.GetItem(settingsItem.ID));

                    // Assert
                    result.Should().HaveCount(1);
                    var pages = result.Single().Pages.Select(x => x.ID).ToList();
                    pages.Should().Contain(pageInAustria.ID.ToString());
                    pages.Should().NotContain(pageInSpain.ID.ToString());
                }
            }
        }

        [Fact]
        public void BuildSitemapBySections_ShouldUseSettingsItemIdInCacheKey()
        {
            // Arrange
            cache.GetItem<List<SitemapSection>>(Arg.Any<string>()).Returns((List<SitemapSection>)null);
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExclude", string.Empty))
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExcludeChildren", string.Empty))
            using (var db = new Db())
            {
                var repository = new HtmlSitemapRepository(cache, multisiteLogger, context);

                var homeOne = new DbItem("Home one");
                var homeTwo = new DbItem("Home two");
                db.Add(homeOne);
                db.Add(homeTwo);

                var fakeSite = new FakeSiteContext(new StringDictionary
                {
                    { "name", "website" },
                    { "database", "master" },
                    { "startItem", db.GetItem(homeOne.ID).Paths.FullPath }
                });

                context.Database = db.Database;
                context.Site = fakeSite;
                context.Item = db.GetItem(homeOne.ID);

                using (new SiteContextSwitcher(fakeSite))
                {
                    // Act
                    repository.BuildSitemapBySections(db.GetItem(homeOne.ID));
                    repository.BuildSitemapBySections(db.GetItem(homeTwo.ID));

                    // Assert
                    cache.Received().GetItem<List<SitemapSection>>(Arg.Is<string>(x => x.Contains(homeOne.ID.ToString())));
                    cache.Received().GetItem<List<SitemapSection>>(Arg.Is<string>(x => x.Contains(homeTwo.ID.ToString())));
                }
            }
        }

        [Fact]
        public void BuildSitemapBySections_ShouldSortPagesByPageTitle_WhenIsSortedIsTrue()
        {
            // Arrange
            cache.GetItem<List<SitemapSection>>(Arg.Any<string>()).Returns((List<SitemapSection>)null);
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExclude", string.Empty))
            using (new SettingsSwitcher("Multisite.Sitemap.TemplatesToExcludeChildren", string.Empty))
            using (var db = new Db())
            {
                var repository = new HtmlSitemapRepository(cache, multisiteLogger, context);

                var pageTemplateId = ID.NewID;

                var pageZ = new DbItem("Page Z", ID.NewID, pageTemplateId);
                pageZ.Fields.Add(FieldIDs.LayoutField, ID.NewID.ToString());
                pageZ.Fields.Add(Constants.Fields.BasePage.Title, "Zebra");

                var pageA = new DbItem("Page A", ID.NewID, pageTemplateId);
                pageA.Fields.Add(FieldIDs.LayoutField, ID.NewID.ToString());
                pageA.Fields.Add(Constants.Fields.BasePage.Title, "Alpha");

                var sectionItem = new DbItem("Hotels section");
                sectionItem.Fields.Add(Constants.Fields.SitemapBase.PageTemplates, pageTemplateId.ToString());
                sectionItem.Fields.Add(Constants.Fields.SitemapBase.IsSorted, "1");

                var settingsItem = new DbItem("Home");
                settingsItem.Fields.Add(Constants.Fields.SitemapBlock.Sections, sectionItem.ID.ToString());
                settingsItem.Add(sectionItem);
                settingsItem.Add(pageZ);
                settingsItem.Add(pageA);
                db.Add(settingsItem);

                var fakeSite = new FakeSiteContext(new StringDictionary
                {
                    { "name", "website" },
                    { "database", "master" },
                    { "startItem", db.GetItem(settingsItem.ID).Paths.FullPath }
                });

                context.Database = db.Database;
                context.Site = fakeSite;
                context.Item = db.GetItem(settingsItem.ID);

                using (new SiteContextSwitcher(fakeSite))
                {
                    // Act
                    var result = repository.BuildSitemapBySections(db.GetItem(settingsItem.ID));

                    // Assert
                    var orderedTitles = result.Single().Pages.Select(x => x.PageTitle).ToList();
                    orderedTitles.Should().Equal("Alpha", "Zebra");
                }
            }
        }
    }
}