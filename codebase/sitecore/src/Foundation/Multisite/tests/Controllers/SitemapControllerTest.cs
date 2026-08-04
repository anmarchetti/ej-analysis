using System.Collections.Generic;
using System.Web.Mvc;
using easyJet.Foundation.Multisite.Controllers;
using easyJet.Foundation.Multisite.Logging;
using easyJet.Foundation.Multisite.Models;
using easyJet.Foundation.Multisite.Repositories;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.Collections;
using Sitecore.Data.Items;
using Sitecore.FakeDb.Sites;
using Sitecore.Globalization;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Controllers
{
    public class SitemapControllerTest
    {
        private readonly IXmlSitemapRepository repository;
        private readonly IMultisiteLogger logger;
        private readonly SitemapController controller;

        public SitemapControllerTest()
        {
            repository = Substitute.For<IXmlSitemapRepository>();
            logger = Substitute.For<IMultisiteLogger>();
            controller = new SitemapController(repository, logger);
        }

        [Theory]
        [AutoDbData]
        public void SitemapController_ShouldReturnGeneratedSitemap(Item item)
        {
            // Arrange
            var fakeSite = new FakeSiteContext(new StringDictionary
            {
                { "name", "website" }, { "database", "web" }
            });

            using (new SiteContextSwitcher(fakeSite))
            {
                var sitemap = new List<SitemapItem>()
                {
                    new SitemapItem(item)
                };

                repository.BuildSitemap(Language.Parse("en")).Returns(sitemap);

                // Act
                var actual = (controller.GenerateSitemap() as JsonResult).Data;

                // Assert
                actual.Should().BeSameAs(sitemap);
            }
        }
    }
}
