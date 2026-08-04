using System.Collections.Generic;
using System.Xml.Linq;
using easyJet.Foundation.Presentation.Extensions;
using easyJet.Foundation.Presentation.Pipelines.GetXmlBasedLayoutDefinition;
using easyJet.Foundation.Presentation.Services;
using easyJet.Foundation.Presentation.Tests.Infrastructure;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyjet.Foundation.Testing.Attributes;
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
    public class AddMultivariantPageDesignsRenderingsTests
    {
        private readonly ILayoutXmlService service;
        private readonly IHtmlCacheRepository cache;
        private readonly AddMultivariantPageDesignsRenderings processor;

        public AddMultivariantPageDesignsRenderingsTests()
        {
            service = Substitute.For<ILayoutXmlService>();
            cache = Substitute.For<IHtmlCacheRepository>();
            processor = new AddMultivariantPageDesignsRenderings(service, cache);
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
        public void Process_ShouldOnlyMergeMultivaritantRenderings_IfHasRenderingsInCacheAndPageModeIsNormal(
            Item root,
            PartialDesignDbTemplate template)
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
                service.Received().MergeMultivaritantRenderings(Arg.Any<XElement>(), Arg.Any<List<XElement>>());
                cache.DidNotReceive().StoreItem(Arg.Any<string>(), Arg.Any<List<XElement>>());
            }
        }

        [Theory]
        [AutoDbData]
        public void Process_ShouldMergeMultivaritantRenderingsAndCachedItem_IfPageModeIsExperianceEditor(
            Item root,
            PartialDesignDbTemplate template)
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
                service.Received().MergeMultivaritantRenderings(Arg.Any<XElement>(), Arg.Any<List<XElement>>());
                cache.Received().StoreItem(Arg.Any<string>(), Arg.Any<List<XElement>>());
            }
        }

        [Theory]
        [AutoDbData]
        public void Process_ShouldNotMergeMultivaritantRenderings_IfNoRenderings(
            Item root,
            PartialDesignDbTemplate template)
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
                service.DidNotReceive().MergeMultivaritantRenderings(Arg.Any<XElement>(), Arg.Any<List<XElement>>());
                cache.DidNotReceive().StoreItem(Arg.Any<string>(), Arg.Any<List<XElement>>());
            }
        }
    }
}
