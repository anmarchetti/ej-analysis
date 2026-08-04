using System;
using easyJet.Feature.PageContent.Pipelines.ItemResolving;
using FluentAssertions;
using NSubstitute;
using Sitecore.Pipelines;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.Pipelines.ItemResolving
{
    public class CreateResolveItemResultTests
    {
        private readonly CreateResolveItemResult sut;

        public CreateResolveItemResultTests()
        {
            sut = Substitute.ForPartsOf<CreateResolveItemResult>();
        }

        [Fact]
        public void RunPipeline_FailsToGetPipeline_ThrowsException()
        {
            // Arrange
            sut.WhenForAnyArgs(mock => mock.GetPipelineWrapper()).DoNotCallBase();
            sut.GetPipelineWrapper().ReturnsForAnyArgs(null as CorePipeline);

            // Act
            Func<ResolveItemResult> action = () => sut.RunPipeline(null);

            // Assert
            action.Should().Throw<Exception>();
        }

        [Fact]
        public void RunPipeline_GetsPipelineAndRunsItSuccessfully()
        {
            // Arrange
            var pipelineMock = Substitute.For<CorePipeline>("dummyPipeline");
            sut.WhenForAnyArgs(mock => mock.GetPipelineWrapper()).DoNotCallBase();
            sut.GetPipelineWrapper().ReturnsForAnyArgs(pipelineMock);

            // Act
            sut.RunPipeline(new CreateResolveItemResultArgs(default, default));

            // Assert
            pipelineMock.ReceivedWithAnyArgs().Run(default);
        }
    }
}
