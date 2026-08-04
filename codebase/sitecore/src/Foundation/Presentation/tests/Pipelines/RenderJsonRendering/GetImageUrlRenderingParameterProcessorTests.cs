using System;
using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Pipelines.RenderJsonRendering;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.LayoutService.Presentation.Pipelines.RenderJsonRendering;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Pipelines.RenderJsonRendering
{
    public class GetImageUrlRenderingParameterProcessorTests
    {
        private readonly IPresentationLogger logger;
        private readonly BaseMediaManager mediaManager;
        private readonly GetImageUrlRenderingParameterProcessor processor;

        public GetImageUrlRenderingParameterProcessorTests()
        {
            logger = Substitute.For<IPresentationLogger>();
            mediaManager = Substitute.For<BaseMediaManager>();
            processor = new GetImageUrlRenderingParameterProcessor(mediaManager, logger);
        }

        [Theory]
        [AutoData]
        public void Process_ShouldGetImageUrlRenderingParameter_IfRenderingParametrExist(Db db, ID renderingId, string renderingParametrName, string url)
        {
            // Arrange
            var innerRenderingItem = new DbItem("Inner rendering item", renderingId);
            db.Add(innerRenderingItem);

            var imageItem = new DbItem("Image");
            imageItem.Fields.Add(new DbField("ImageItem") { Value = ID.NewID.ToString() });
            db.Add(imageItem);

            var args = new RenderJsonRenderingArgs()
            {
                Rendering = new Sitecore.Mvc.Presentation.Rendering()
                {
                    Id = renderingId.Guid,
                    RenderingItem = new Sitecore.Data.Items.RenderingItem(db.GetItem(innerRenderingItem.ID))
                },
                Result = new Sitecore.LayoutService.ItemRendering.RenderedJsonRendering()
                {
                    RenderingParams = new Dictionary<string, string>()
                }
            };

            args.Result.RenderingParams.Add(renderingParametrName, $"<image linktype=\"media\" mediaid=\"{imageItem.ID.ToString()}\" />");
            mediaManager.GetMediaUrl(Arg.Any<MediaItem>()).Returns(url);
            // Act
            processor.Process(args);

            // Assert
            args.Result.RenderingParams[renderingParametrName].Should().Be(url);
        }

        [Theory]
        [AutoData]
        public void Process_ShouldCatchException_IfMediaMangerServiceThrowException(Db db, ID renderingId, string renderingParametrName)
        {
            // Arrange
            var innerRenderingItem = new DbItem("Inner rendering item", renderingId);
            db.Add(innerRenderingItem);

            var imageItem = new DbItem("Image");
            imageItem.Fields.Add(new DbField("ImageItem") { Value = ID.NewID.ToString() });
            db.Add(imageItem);

            var args = new RenderJsonRenderingArgs()
            {
                Rendering = new Sitecore.Mvc.Presentation.Rendering()
                {
                    Id = renderingId.Guid,
                    RenderingItem = new Sitecore.Data.Items.RenderingItem(db.GetItem(innerRenderingItem.ID)),
                    Item = db.GetItem(imageItem.ID)
                },
                Result = new Sitecore.LayoutService.ItemRendering.RenderedJsonRendering()
                {
                    RenderingParams = new Dictionary<string, string>()
                }
            };

            args.Result.RenderingParams.Add(renderingParametrName, $"<image linktype=\"media\" mediaid=\"{imageItem.ID.ToString()}\" />");
            mediaManager.GetMediaUrl(Arg.Any<MediaItem>()).Throws<Exception>();
            // Act
            processor.Process(args);

            // Assert
            logger.Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }
    }
}
