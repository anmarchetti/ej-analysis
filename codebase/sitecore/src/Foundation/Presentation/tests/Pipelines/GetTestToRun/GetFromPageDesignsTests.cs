using System;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Pipelines.GetTestToRun;
using easyJet.Foundation.Presentation.Tests.Services;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.Collections;
using Sitecore.ContentTesting.Pipelines.GetTestToRun;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Pipelines.GetXmlBasedLayoutDefinition
{
    public class GetFromPageDesignsTests
    {
        private readonly GetFromPageDesigns pipeline;
        private readonly IPresentationLogger logger;

        public GetFromPageDesignsTests()
        {
            logger = Substitute.For<IPresentationLogger>();
            pipeline = new GetFromPageDesigns(logger);
        }

        [Fact]
        public void Process_ShouldLogError_IfArgumentsIsNull()
        {
            // Act
            pipeline.Process(null);

            // Assert
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldSetTestDefintionItem_IfPageDesignHasMultivariantRendering()
        {
            // Arrange
            ID homeId = ID.NewID;
            ID pageDesignId = ID.NewID;
            ID deviceId = new ID("{FE5D7FDF-89C0-4D99-9AA3-B5FBD009C9F3}");
            ID testId = new ID("{C002A035-1BB7-4CDC-AFD7-D1F1844B4A19}");

            var fakeSiteContext = new FakeSiteContext(new StringDictionary
            {
                { "name", "website" },
                { "rootPath", "/sitecore/content/" }
            });

            using (var db = new Db
            {
                new DbItem("Home", homeId),
                new DbItem("Presentation", ID.NewID, Templates.Presentation.Id)
                {
                    new DbItem("Multivariant Presentation",  ID.NewID, Templates.MultivatiantPageDesignFolder.Id)
                    {
                        new DbItem("Page Design", pageDesignId, Templates.MultivatiantPageDesign.Id)
                        {
                            new DbField(Sitecore.FieldIDs.LayoutField)
                            {
                                Value = GetFromPageDesignsTestsData.PageDesignContextItemBodyXml
                            },
                            new DbField(Templates.MultivatiantPageDesign.Fields.PageTemplates)
                        }
                    }
                },
                new DbItem("Test defitiontion item", testId)
            })
            {
                using (new SiteContextSwitcher(fakeSiteContext))
                {
                    var homeItem = db.GetItem(homeId);
                    var pageDesign = db.GetItem(pageDesignId);
                    using (new EditContext(pageDesign))
                    {
                        pageDesign.Fields[Templates.MultivatiantPageDesign.Fields.PageTemplates].Value = homeItem.TemplateID.ToString();
                    }

                    var args = new GetTestToRunArgs(homeItem, deviceId);

                    // Act
                    pipeline.Process(args);

                    // Assert
                    args.TestDefinition.Should().NotBeNull();
                    args.CustomData.ContainsKey(Constants.PageDesignArgsKey).Should().BeTrue();
                }
            }
        }

        [Theory]
        [AutoDbData]
        public void Process_ShouldNotSetTestDefinitionItem_IfNoPageDesign(Item hostItem, ID deviceId)
        {
            // Arrange
            var args = new GetTestToRunArgs(hostItem, deviceId);

            // Act
            pipeline.Process(args);

            // Assert
            args.TestDefinition.Should().BeNull();
            args.CustomData.ContainsKey(Constants.PageDesignArgsKey).Should().BeFalse();
        }
    }
}
