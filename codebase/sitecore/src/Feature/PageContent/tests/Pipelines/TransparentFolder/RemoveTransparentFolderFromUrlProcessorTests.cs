using easyJet.Feature.PageContent.Pipelines.Arguments;
using easyJet.Feature.PageContent.Pipelines.TransparentFolder;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.Pipelines.TransparentFolder
{
    public class RemoveTransparentFolderFromUrlProcessorTests
    {
        private readonly RemoveTransparentFolderFromUrlProcessor sut;

        public RemoveTransparentFolderFromUrlProcessorTests()
        {
            sut = Substitute.ForPartsOf<RemoveTransparentFolderFromUrlProcessor>();
        }

        [Theory]
        [MemberData(nameof(RemoveTransparentFolderFromUrlProcessorTestData.InvalidArgsForProcess), MemberType = typeof(RemoveTransparentFolderFromUrlProcessorTestData))]
        public void Process_WithInvalidArgs_ReturnsWithoutFurtherAction(GetItemUrlPipelineArgs invalidArgs)
        {
            // Arrange
            sut.Configure().WhenForAnyArgs(mock => mock.RemoveTransparentFoldersFromPath(default, default)).DoNotCallBase();

            // Act
            sut.Process(invalidArgs);

            // Assert
            sut.DidNotReceiveWithAnyArgs().RemoveTransparentFoldersFromPath(default, default);
        }

        [Theory]
        [MemberData(nameof(RemoveTransparentFolderFromUrlProcessorTestData.ValidArgsWithUrlStartingWithDoubleSlash), MemberType = typeof(RemoveTransparentFolderFromUrlProcessorTestData))]
        public void Process_WithValidArgsWithDoubleSlash_CorrectlyRemovesTransparentFolderParts(GetItemUrlPipelineArgs validArgs, string expectedResultPath)
        {
            // Arrange

            // Act
            sut.Process(validArgs);

            // Assert
            validArgs.Url.Should().BeEquivalentTo(expectedResultPath);
        }

        [Theory]
        [MemberData(nameof(RemoveTransparentFolderFromUrlProcessorTestData.ValidArgsWithUrlStartingWithSingleSlash), MemberType = typeof(RemoveTransparentFolderFromUrlProcessorTestData))]
        public void Process_WithValidArgsWithSingleSlash_CorrectlyRemovesTransparentFolderParts(GetItemUrlPipelineArgs validArgs, string expectedResultPath)
        {
            // Arrange

            // Act
            sut.Process(validArgs);

            // Assert
            validArgs.Url.Should().BeEquivalentTo(expectedResultPath);
        }

        [Fact]
        public void Process_WithoutLeadingSlashes_WithoutTransparentItem_ReturnsWithoutChangingArgsUrl()
        {
            // Arrange
            var item = RemoveTransparentFolderFromUrlProcessorTestData.GetItemForArgs(out var rootName, out var folderName, out var childName, 0);
            var args = new GetItemUrlPipelineArgs()
            {
                Item = item,
                Url = $"{rootName}/{folderName}/{childName}"
            };

            var expected = $"{rootName}/{folderName}/{childName}";

            // Act
            sut.Process(args);

            // Assert
            sut.ReceivedWithAnyArgs().RemoveTransparentFoldersFromPath(default, default); // ensuring that an attempt was made to remove transparency
            args.Url.Should().BeEquivalentTo(expected);
        }

        [Fact]
        public void Process_WithoutLeadingSlashes_WithDefaultPort_HandlesPortCorrectly()
        {
            // Arrange
            var item = RemoveTransparentFolderFromUrlProcessorTestData.GetItemForArgs(out var rootName, out var folderName, out var childName);
            var args = new GetItemUrlPipelineArgs()
            {
                Item = item,
                Url = $"http://{rootName}/{folderName}/{childName}:80"
            };
            var expected = @"http://testroot/actualChildElement:80";

            // Act
            sut.Process(args);

            // Assert
            args.Url.Should().BeEquivalentTo(expected);
        }

        [Fact]
        public void Process_WithoutLeadingSlashes_WithNonDefaultPort_HandlesPortCorrectly()
        {
            // Arrange
            var item = RemoveTransparentFolderFromUrlProcessorTestData.GetItemForArgs(out var rootName, out var folderName, out var childName);
            var args = new GetItemUrlPipelineArgs()
            {
                Item = item,
                Url = $"http://{rootName}/{folderName}/{childName}"
            };
            var expected = @"http://testroot/actualChildElement";

            // Act
            sut.Process(args);

            // Assert
            args.Url.Should().BeEquivalentTo(expected);
        }
    }
}
