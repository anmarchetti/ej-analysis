using System;
using System.Reflection;
using AutoFixture.Xunit2;
using easyJet.Foundation.SiteModes.ContentResolvers;
using easyJet.Foundation.SiteModes.Logging;
using easyJet.Foundation.SiteModes.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.SiteModes.Tests.ContentResolvers
{
    public class ShowMaintenanceModeContentResolverTests
    {
        private readonly ISiteModeService service;
        private readonly ShowMaintenanceModeContentResolver resolver;

        public ShowMaintenanceModeContentResolverTests()
        {
            service = Substitute.For<ISiteModeService>();
            resolver = new ShowMaintenanceModeContentResolver(service, Substitute.For<ISiteModesLogger>());
            resolver.GetType().GetProperty("ExecuteContentResolvingAction", BindingFlags.NonPublic | BindingFlags.Instance).SetValue(resolver, (Func<Rendering, IRenderingConfiguration, object>)ResolveContent);
        }

        [Theory]
        [AutoData]
        public void ResolveContents_ShouldReturnResolvedContent_IfFullOrSoftModeAvaliable(Db db)
        {
            // Arrange
            service.GetModes().Returns(new Models.Domain.Modes() { IsFullMode = true, IsSoftMode = false });

            var fakeSite = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "website" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
                });

            var item = new DbItem("simple item");
            db.Add(item);

            using (new SiteContextSwitcher(fakeSite))
            {
                // Act
                var act = resolver.ResolveContents(new Rendering() { Item = db.GetItem(item.ID) }, null);

                // Assert
                act.Should().Be(item.ID);
            }
        }

        [Theory]
        [AutoData]
        public void ResolveContents_ShouldReturnNull_IfFullAndSoftModeUnvaliable(Db db)
        {
            // Arrange
            service.GetModes().Returns(new Models.Domain.Modes() { IsFullMode = false, IsSoftMode = false });

            var fakeSite = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "website" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
                });

            var item = new DbItem("simple item");
            db.Add(item);

            using (new SiteContextSwitcher(fakeSite))
            {
                // Act
                var act = resolver.ResolveContents(new Rendering() { Item = db.GetItem(item.ID) }, null);

                // Assert
                act.Should().BeNull();
            }
        }

        private object ResolveContent(Rendering rendering, IRenderingConfiguration configuration)
        {
            return rendering.Item.ID;
        }
    }
}
