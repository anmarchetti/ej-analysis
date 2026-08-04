using System;
using System.Drawing;
using System.IO;
using System.Linq;
using easyJet.Foundation.AmazonS3.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Resources.Media;
using Xunit;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Foundation.AmazonS3.Tests.Services
{
    public class ImageServiceTests
    {
        private readonly ImageService service;
        private readonly BaseMediaManager mediaManager;

        public ImageServiceTests()
        {
            mediaManager = Substitute.For<BaseMediaManager>();
            service = new ImageService(mediaManager);
        }

        [Fact]
        public void ResizeImage_ShouldThrowArgumentNullException_IfMediaItemNull()
        {
            // Act
            Action actual = () => service.ResizeImage(null);

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void ResizeImage_ShouldHaveCountOfThree_IfItemHasMedia()
        {
            var mediaItem = GetMediaItem("TestImage");
            using (var image = new FileStream("..\\..\\Assets\\TestImage.jpg", FileMode.Open))
            {
                var mediaStream = new MediaStream(image, "jpg", mediaItem);
                mediaManager.GetMedia(Arg.Is(mediaItem)).GetStream().Returns(mediaStream);

                var actual = service.ResizeImage(mediaItem);

                actual.Should().HaveCount(3);
                actual.Select(version => version.Version).Should().Contain(new[]
                {
                    DestinationsConstants.Fields.ExternalImageItem.Small,
                    DestinationsConstants.Fields.ExternalImageItem.Medium,
                    DestinationsConstants.Fields.ExternalImageItem.Large
                });
            }
        }

        [Fact]
        public void ResizeImage_ShouldThrowArgumentNullException_IfSourceIsNull()
        {
            Action actual = () => service.ResizeImage(null, 10);

            actual.Should().Throw<ArgumentNullException>();
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        [InlineData(-50)]
        public void ResizeImage_ShouldThrowArgumentNullException_IfWidthIsNegativeOrZero(int width)
        {
            Action actual = () => service.ResizeImage(new MemoryStream(), width);

            actual.Should().Throw<ArgumentOutOfRangeException>();
        }

        [Theory]
        [InlineData(300)]
        [InlineData(600)]
        [InlineData(800)]
        public void ResizeImage_ShouldResizedImage(int expectedWidth)
        {
            using (var file = new FileStream("..\\..\\Assets\\TestImage.jpg", FileMode.Open))
            {
                var image = service.ResizeImage(file, expectedWidth);

                using (var actual = Image.FromStream(image))
                {
                    actual.Width.Should().Be(expectedWidth);
                }
            }
        }

        private static MediaItem GetMediaItem(string name) =>
            new MediaItem(new FakeItem().WithName(name).ToSitecoreItem());
    }
}
