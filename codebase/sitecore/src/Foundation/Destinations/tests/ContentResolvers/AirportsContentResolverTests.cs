using System.Collections.Generic;
using AutoFixture;
using easyJet.Foundation.Destinations.ContentResolvers;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Multisite.Models;
using easyJet.Foundation.Multisite.Services;
using easyJet.Foundation.SiteModes.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentResolvers
{
    public class AirportsContentResolverTests
    {
        private readonly AirportsContentResolver resolver;
        private readonly ISiteModeService service;
        private readonly IDestinationsLogger logger;
        private readonly IMarketSettingsService marketSettingsService;
        private readonly Fixture fixture;
        private readonly Db db;

        public AirportsContentResolverTests()
        {
            // Arrange
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            service = Substitute.For<ISiteModeService>();
            logger = Substitute.For<IDestinationsLogger>();
            marketSettingsService = Substitute.For<IMarketSettingsService>();
            resolver = new AirportsContentResolver(marketSettingsService, service, logger) { UseContextItem = false };
        }

        [Fact]
        public void ResolveContents_ShouldBeNullOrEmpty_RenderingDatasourceHasNoChildren()
        {
            // Arrange
            var itemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            db.Add(itemDb);

            var item = db.GetItem(itemDb.ID);
            var rendering = new Rendering() { DataSource = itemDb.ID.ToString(), RenderingItem = item, Item = item };

            service.GetModes().Returns(new SiteModes.Models.Domain.Modes()
            {
                IsFullMode = true,
                IsSoftMode = true
            });

            var fakeSite = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "website" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
                });

            using (new Sitecore.Sites.SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = resolver.ResolveContents(rendering, Substitute.For<IRenderingConfiguration>());

                // Assert
                actual.Should().BeNull();
            }
        }

        [Fact]
        public void ResolveContents_ShouldBeCountOne_RenderingDataSourceHasOneValidChildren()
        {
            // Arrange
            Db db = new Db();

            var fakeSite = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "website" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
                });

            var data = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var itemDb = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var child1 = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var child2 = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var marketSetting = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            data.TemplateID = ID.Parse("{81BF68AE-91FD-4535-9D77-989773789AB6}"); // Data Folder Template ID
            itemDb.TemplateID = Constants.TemplateIds.AirportsFolder;
            child1.TemplateID = Constants.TemplateIds.AirportsGroup;
            child2.TemplateID = Constants.TemplateIds.Airport;
            child2.Fields.Add(Constants.Fields.DatasourceItem.Code, "LGW");

            itemDb.Children.Add(child1);
            child1.Children.Add(child2);
            data.Children.Add(itemDb);
            db.Add(data);

            var item = db.GetItem(itemDb.ID);
            var rendering = new Rendering() { DataSource = itemDb.ID.ToString(), Item = item };

            service.GetModes().Returns(new SiteModes.Models.Domain.Modes()
            {
                IsFullMode = false,
                IsSoftMode = false
            });

            var market = new MarketSettings(null)
            {
                AirportDepartureCodes = new HashSet<string>(1) { "LGW" }
            };

            marketSettingsService.GetCurrentMarket().Returns(market);

            using (new Sitecore.Sites.SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = resolver.ResolveContents(rendering, Substitute.For<IRenderingConfiguration>()) as dynamic;

                // Assert
                ((IEnumerable<AirportsGroup>)actual.AirportsGroups).Should().HaveCount(1);
            }
        }

        [Fact]
        public void ResolveContents_ShouldBeNull_IfMethodThrowException()
        {
            // Arrange
            service.GetModes().Returns(new SiteModes.Models.Domain.Modes()
            {
                IsFullMode = false,
                IsSoftMode = false
            });

            // Act
            var actual = resolver.ResolveContents(null, null) as IEnumerable<AirportsGroup>;

            // Assert
            actual.Should().BeNull();
        }
    }
}
