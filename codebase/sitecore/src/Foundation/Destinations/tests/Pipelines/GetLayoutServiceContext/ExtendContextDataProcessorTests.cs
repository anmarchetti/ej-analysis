using System.Collections.Generic;
using AutoFixture;
using easyJet.Foundation.Destinations.Pipelines.GetLayoutServiceContext;
using FluentAssertions;
using NSubstitute;
using Sitecore.Collections;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.Globalization;
using Sitecore.JavaScriptServices.Configuration;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Pipelines.GetLayoutServiceContext
{
    public class ExtendContextDataProcessorTests : ExtendContextDataProcessor
    {
        private readonly Fixture fixture;
        private readonly Db db;

        public ExtendContextDataProcessorTests()
            : base(Substitute.For<IConfigurationResolver>())
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void DoProcess_ShouldNotSetParentsKey_IfRenderingItemNull()
        {
            // Arrange
            var args = new GetLayoutServiceContextArgs();

            // Act
            DoProcess(args, null);

            var actual = args.CustomData.Keys;

            // Assert
            actual.Should().NotContain("parents");
        }

        [Theory]
        [MemberData(nameof(ValidTemplates))]
        public void DoProcess_ShouldSetParentsKey_IfItemIsDestination(ID templateId)
        {
            // Arrange
            var parentItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            parentItem.TemplateID = templateId;

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = templateId;

            parentItem.Children.Add(item);
            db.Add(parentItem);

            var args = new GetLayoutServiceContextArgs();
            args.RenderedItem = db.GetItem(item.ID);

            // Act
            DoProcess(args, null);
            var actual = args.ContextData.Keys;

            // Assert
            actual.Should().Contain("parents");
        }

        [Fact]
        public void DoProcess_ShouldSetPageUrls_IfItemHasOtherLanguages()
        {
            // Arrange
            var fakeSite = new FakeSiteContext(new StringDictionary
            {
                { "name", "website" }, { "database", "web" }
            });
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.AddVersion("en");
            db.Add(item);

            var args = new GetLayoutServiceContextArgs
            {
                RenderedItem = db.GetItem(item.ID)
            };

            // Act
            using (new SettingsSwitcher("Destinations.LanguagesToBuildUrlsForHreflangs", "en,fr-CH,de-CH"))
            using (new SiteContextSwitcher(fakeSite))
            using (new LanguageSwitcher("fr-CH"))
            {
                DoProcess(args, null);
            }

            var actual = args.ContextData["pageUrls"] as Dictionary<string, string>;

            // Assert
            Assert.NotNull(actual);
            Assert.NotEmpty(actual);
        }

        [Fact]
        public void DoProcess_ShouldNotSetPageUrls_ForCurrentContextItem()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.AddVersion("en");
            db.Add(item);

            var args = new GetLayoutServiceContextArgs
            {
                RenderedItem = db.GetItem(item.ID)
            };

            // Act
            DoProcess(args, null);
            var actual = args.ContextData["pageUrls"] as Dictionary<string, string>;

            // Assert
            Assert.NotNull(actual);
            Assert.Empty(actual);
        }

        public static IEnumerable<object[]> ValidTemplates => new[]
            {
                new object[] { Constants.TemplateIds.Country },
                new object[] { Constants.TemplateIds.Location },
                new object[] { Constants.TemplateIds.LocationCity },
                new object[] { Constants.TemplateIds.Resort },
                new object[] { Constants.TemplateIds.Accommodation },
                new object[] { Constants.TemplateIds.VirtualRegion },
                new object[] { Constants.TemplateIds.VirtualResort }
            };
    }
}