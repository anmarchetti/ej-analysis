using System.Collections.Generic;
using System.Xml.Linq;
using easyJet.Foundation.Presentation;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Pipelines.GetXmlBasedLayoutDefinition;
using easyJet.Foundation.Presentation.Repositories;
using easyJet.Foundation.Presentation.Services;
using easyJet.Foundation.Presentation.Tests.Infrastructure;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.Mvc.Pipelines.Response.GetXmlBasedLayoutDefinition;
using Sitecore.Mvc.Presentation;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Pipelines.GetXmlBasedLayoutDefinition
{
    public class AddPartialDesignsRenderingsTests
    {
        private readonly ILayoutXmlService service;
        private readonly IHtmlCacheRepository cache;
        private readonly IPageDesignRepository pageDesignRepository;
        private readonly IQueryStringProvider queryStringProvider;
        private readonly AddPartialDesignsRenderings processor;

        public AddPartialDesignsRenderingsTests()
        {
            service = Substitute.For<ILayoutXmlService>();
            cache = Substitute.For<IHtmlCacheRepository>();
            pageDesignRepository = Substitute.For<IPageDesignRepository>();
            queryStringProvider = Substitute.For<IQueryStringProvider>();
            processor = new AddPartialDesignsRenderings(service, cache, pageDesignRepository, queryStringProvider);
            processor.AddWebsite("Holidays");
        }

        [Theory]
        [AutoDbData]
        public void Process_ShouldNotMergeParitals_IfHasNoItem(Db db)
        {
            PageContext pageContext = Substitute.For<PageContext>();

            pageContext.Database.Returns(db.Database);
            Sitecore.Mvc.Common.ContextService.Get().Push(pageContext);
            // Act
            processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = null });

            // Assert
            cache.DidNotReceive().GetItem<List<XElement>>(Arg.Any<string>());
        }

        [Theory]
        [AutoDbData]
        public void Process_ShouldOnlyMergeParitals_IfHasRenderingsInCacheAndPageModeIsNormal(Item root, PartialDesignDbTemplate template)
        {
            // Arrange
            var contextItem = root.Add("home", new TemplateID(template.ID));

            var fakeSiteContext = new FakeSiteContext(new StringDictionary
            {
                { "name", "Holidays" },
                { "enableWebEdit", "false" },
                { "masterDatabase", "master" }
            });

            cache.GetItem<List<XElement>>(Arg.Any<string>()).Returns(new List<XElement>());

            using (new SiteContextSwitcher(fakeSiteContext))
            {
                // Act
                processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = contextItem });

                // Assert
                cache.Received().GetItem<List<XElement>>(Arg.Any<string>());
                service.Received().MergePartialDesignsRenderings(Arg.Any<XElement>(), Arg.Any<IEnumerable<XElement>>());
                cache.DidNotReceive().StoreItem(Arg.Any<string>(), Arg.Any<List<XElement>>());
            }
        }

        [Theory]
        [AutoDbData]
        public void Process_ShouldMergeParitalsAndCachedItem_IfPageModeIsExperianceEditor(Item root, PartialDesignDbTemplate template)
        {
            // Arrange
            var layoutXml = XDocument.Parse("<r/>").Root;
            var contextItem = root.Add("home", new TemplateID(template.ID));

            var fakeSiteContext = new FakeSiteContext(new StringDictionary
            {
                { "name", "Holidays" },
                { "enableWebEdit", "true" },
                { "masterDatabase", "master" }
            });

            cache.GetItem<List<XElement>>(Arg.Any<string>()).Returns(new List<XElement>());
            service.GetRenderings(Arg.Any<Item>(), Arg.Any<Item>()).Returns(new List<XElement>() { layoutXml });

            using (new SiteContextSwitcher(fakeSiteContext))
            {
                Context.Site.SetDisplayMode(DisplayMode.Edit, DisplayModeDuration.Remember);

                // Act
                processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = contextItem, Result = layoutXml });

                // Assert
                cache.Received().GetItem<List<XElement>>(Arg.Any<string>());
                service.Received().GetRenderings(Arg.Any<Item>(), Arg.Any<Item>());
                service.Received().MergePartialDesignsRenderings(Arg.Any<XElement>(), Arg.Any<List<XElement>>());
                cache.Received().StoreItem(Arg.Any<string>(), Arg.Any<List<XElement>>());
            }
        }

        [Theory]
        [AutoDbData]
        public void Process_ShouldNotMergePartials_IfNoRenderings(Item root, PartialDesignDbTemplate template)
        {
            // Arrange
            var contextItem = root.Add("home", new TemplateID(template.ID));

            var fakeSiteContext = new FakeSiteContext(new StringDictionary
            {
                { "name", "Holidays" },
                { "enableWebEdit", "true" },
                { "masterDatabase", "master" }
            });

            cache.GetItem<List<XElement>>(Arg.Any<string>()).Returns(new List<XElement>());
            service.GetRenderings(Arg.Any<Item>(), Arg.Any<Item>()).Returns(new List<XElement>());

            using (new SiteContextSwitcher(fakeSiteContext))
            {
                Context.Site.SetDisplayMode(DisplayMode.Edit, DisplayModeDuration.Remember);

                // Act
                processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = contextItem });

                // Assert
                cache.Received().GetItem<List<XElement>>(Arg.Any<string>());
                service.Received().GetRenderings(Arg.Any<Item>(), Arg.Any<Item>());
                service.DidNotReceive().MergePartialDesignsRenderings(Arg.Any<XElement>(), Arg.Any<List<XElement>>());
                cache.DidNotReceive().StoreItem(Arg.Any<string>(), Arg.Any<List<XElement>>());
            }
        }

        [Fact]
        public void Process_ShouldFallbackToStandardDesign_WhenNoQueryStringProvider()
        {
            // ARRANGE
            var itemId = ID.NewID;
            var dbTemplate = new DbTemplate("PartialDesign", Templates.PartialDesign.Id);
            var homeItem = new DbItem("home", itemId) { TemplateID = dbTemplate.ID };

            var fakeSiteContext = new FakeSiteContext(new StringDictionary
            {
                { "name", "Holidays" },
                { "enableWebEdit", "false" },
                { "masterDatabase", "master" }
            });

            queryStringProvider.GetQueryString(Arg.Any<string>()).Returns(string.Empty);
            cache.GetItem<List<XElement>>(Arg.Any<string>()).Returns(new List<XElement>());

            using (var db = new Db { dbTemplate, homeItem })
            using (new SiteContextSwitcher(fakeSiteContext))
            {
                var contextItem = db.Database.GetItem(itemId);

                // ACT
                processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = contextItem });

                // ASSERT
                cache.Received().GetItem<List<XElement>>(Arg.Any<string>());
                service.Received().MergePartialDesignsRenderings(Arg.Any<XElement>(), Arg.Any<IEnumerable<XElement>>());
            }
        }

        [Fact]
        public void GetPageDesign_ShouldForwardEcpValueToPageDesignRepository()
        {
            // ARRANGE
            var itemId = ID.NewID;
            var dbTemplate = new DbTemplate("PartialDesign", Templates.PartialDesign.Id);
            var homeItem = new DbItem("home", itemId) { TemplateID = dbTemplate.ID };

            var fakeSiteContext = new FakeSiteContext(new StringDictionary
            {
                { "name", "Holidays" },
                { "enableWebEdit", "false" },
                { "masterDatabase", "master" }
            });

            queryStringProvider.GetQueryString(Arg.Any<string>()).Returns("test-provider");
            cache.GetItem<List<XElement>>(Arg.Any<string>()).Returns(new List<XElement>());

            using (var db = new Db { dbTemplate, homeItem })
            using (new SiteContextSwitcher(fakeSiteContext))
            {
                var contextItem = db.Database.GetItem(itemId);

                // ACT
                processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = contextItem });

                // ASSERT — resolution is delegated to the repository with the ecp query-string value
                pageDesignRepository.Received(1).ResolveActivePageDesign(contextItem, "test-provider");
            }
        }

        [Fact]
        public void GetPageDesign_WhenContextItemIsNull_ShouldNotInteractWithQueryStringProvider()
        {
            // ACT
            processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = null });

            // ASSERT
            queryStringProvider.DidNotReceive().GetQueryString(Arg.Any<string>());
            pageDesignRepository.DidNotReceive().ResolveActivePageDesign(Arg.Any<Item>(), Arg.Any<string>());
        }

        [Fact]
        public void Process_ShouldFallbackToStandardDesign_WhenQuerystringIsWhitespace()
        {
            // ARRANGE
            var itemId = ID.NewID;
            var dbTemplate = new DbTemplate("PartialDesign", Templates.PartialDesign.Id);
            var homeItem = new DbItem("home", itemId) { TemplateID = dbTemplate.ID };

            var fakeSiteContext = new FakeSiteContext(new StringDictionary
            {
                { "name", "Holidays" },
                { "enableWebEdit", "false" },
                { "masterDatabase", "master" }
            });

            queryStringProvider.GetQueryString(Arg.Any<string>()).Returns("   ");
            cache.GetItem<List<XElement>>(Arg.Any<string>()).Returns(new List<XElement>());

            using (var db = new Db { dbTemplate, homeItem })
            using (new SiteContextSwitcher(fakeSiteContext))
            {
                var contextItem = db.Database.GetItem(itemId);

                // ACT
                processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = contextItem });

                // ASSERT
                cache.Received().GetItem<List<XElement>>(Arg.Any<string>());
                service.Received().MergePartialDesignsRenderings(Arg.Any<XElement>(), Arg.Any<IEnumerable<XElement>>());
            }
        }

        [Fact]
        public void GetPageDesign_ShouldQueryExperienceContextProviderKey()
        {
            // ARRANGE
            var itemId = ID.NewID;
            var dbTemplate = new DbTemplate("PartialDesign", Templates.PartialDesign.Id);
            var homeItem = new DbItem("home", itemId) { TemplateID = dbTemplate.ID };

            var fakeSiteContext = new FakeSiteContext(new StringDictionary
            {
                { "name", "Holidays" },
                { "enableWebEdit", "false" },
                { "masterDatabase", "master" }
            });

            queryStringProvider.GetQueryString(Arg.Any<string>()).Returns(string.Empty);
            cache.GetItem<List<XElement>>(Arg.Any<string>()).Returns(new List<XElement>());

            using (var db = new Db { dbTemplate, homeItem })
            using (new SiteContextSwitcher(fakeSiteContext))
            {
                var contextItem = db.Database.GetItem(itemId);

                // ACT
                processor.Process(new GetXmlBasedLayoutDefinitionArgs() { ContextItem = contextItem });

                // ASSERT
                queryStringProvider.Received(1).GetQueryString(Constants.QueryStringParams.ExperienceContextProvider);
            }
        }
    }
}
