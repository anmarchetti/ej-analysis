using System.IO;
using Dianoga;
using easyJet.Foundation.Optimization.Tests.Services;
using easyJet.Foundation.PushNotifications.Logging;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.Resources.Media;
using Xunit;

namespace easyJet.Foundation.Optimization.Tests.RequestHandlers
{
    public class MediaRequestHandlerTests
    {
        private readonly MediaOptimizer optimizer;
        private readonly IOptimizationLogger logger;
        private readonly OptimizationImageServiceFake service;

        public MediaRequestHandlerTests()
        {
            logger = Substitute.For<IOptimizationLogger>();
            optimizer = Substitute.ForPartsOf<MediaOptimizer>();
            service = new OptimizationImageServiceFake(logger, optimizer);
        }

        [Theory]
        [AutoDbData]
        public void Optimize_NotRunOptimizerProcessAndLogWarn_IfInputStreamIsNotAllowMemoryLoading(MediaItem mediaItem)
        {
            // Arrange
            using (var image = new FileStream("..\\..\\Assets\\TestImage.jpg", FileMode.Open))
            {
                using (new SettingsSwitcher("Media.MaxSizeInMemory", "1"))
                {
                    var mediaStream = new MediaStream(image, "jpg", mediaItem);

                    // Act
                    var actual = service.Optimize(mediaStream, new MediaOptions());

                    // Assert
                    optimizer.DidNotReceive().Process(Arg.Any<MediaStream>(), Arg.Any<MediaOptions>());
                    actual.Should().BeSameAs(mediaStream.Stream);
                    logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
                }
            }
        }

        [Theory]
        [AutoDbData]
        public void Optimize_ReturnOptimizedImage_IfOptimizerProccessCanOptimizeImage(MediaItem mediaItem)
        {
            // Arrange
            using (var image = new FileStream("..\\..\\Assets\\TestImage.jpg", FileMode.Open))
            {
                using (var imageMin = new FileStream("..\\..\\Assets\\TestImage-min.jpg", FileMode.Open))
                {
                    var mediaStream = new MediaStream(image, "jpg", mediaItem);
                    var mediaMinStream = new MediaStream(imageMin, "jpg", mediaItem);
                    optimizer.Process(Arg.Any<MediaStream>(), Arg.Any<MediaOptions>())
                        .Returns(mediaMinStream);

                    // Act
                    var actual = service.Optimize(mediaStream, new MediaOptions());

                    // Assert
                    optimizer.Received().Process(Arg.Any<MediaStream>(), Arg.Any<MediaOptions>());
                    actual.Should().BeSameAs(mediaMinStream.Stream);
                    logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
                }
            }
        }

        [Theory]
        [AutoDbData]
        public void Optimize_ReturnUnoptimizedImageAndLogWarn_IfOptimizerProccessCanNotOptimizeImage(MediaItem mediaItem)
        {
            // Arrange
            using (var image = new FileStream("..\\..\\Assets\\TestImage.jpg", FileMode.Open))
            {
                var mediaStream = new MediaStream(image, "jpg", mediaItem);
                MediaStream optimizedStream = null;
                optimizer.Process(Arg.Any<MediaStream>(), Arg.Any<MediaOptions>())
                    .Returns(optimizedStream);

                // Act
                var actual = service.Optimize(mediaStream, new MediaOptions());

                // Assert
                optimizer.Received().Process(Arg.Any<MediaStream>(), Arg.Any<MediaOptions>());
                actual.Should().BeSameAs(mediaStream.Stream);
                logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            }
        }
    }
}