using System.IO;
using AutoFixture.Xunit2;
using Dianoga.Processors;
using easyJet.Foundation.Optimization.Pipelines.dianogaOptimize;
using easyJet.Foundation.PushNotifications.Logging;
using FluentAssertions;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Resources.Media;
using Xunit;

namespace easyJet.Foundation.Optimization.Tests.Pipelines
{
    public class ImageSizeValidationProcessorTests
    {
        private readonly IOptimizationLogger logger;

        public ImageSizeValidationProcessorTests()
        {
            logger = Substitute.For<IOptimizationLogger>();
        }

        [Theory]
        [AutoData]
        public void Process_ShouldSkipImage_IfImageSizeLessThanExpected(Db db, byte[] fakeData)
        {
            // Arrange
            var mediaDBItem = new DbItem("Image")
            {
                ParentID = Sitecore.ItemIDs.MediaLibraryRoot
            };
            db.Add(mediaDBItem);

            using (var memoryStream = new MemoryStream())
            using (new SettingsSwitcher("Optimization.MinImageSize", "400"))
            {
                var mediaItem = new MediaItem(db.GetItem(mediaDBItem.ID));
                memoryStream.Write(fakeData, 0, fakeData.Length);

                var mediaStream = new MediaStream(memoryStream, "png", mediaItem);

                var args = new ProcessorArgs(mediaStream);
                new ImageSizeValidationProcessor(logger).Process(args);
                args.Aborted.Should().BeTrue();
            }
        }

        [Theory]
        [AutoData]
        public void Process_ShouldSkipImage_IfImageSizeMoreThanExpected(Db db, byte[] fakeData)
        {
            // Arrange
            var mediaDBItem = new DbItem("Image")
            {
                ParentID = Sitecore.ItemIDs.MediaLibraryRoot
            };
            mediaDBItem.Fields.Add(new DbField("size") { Value = (500 * 1024).ToString() });
            db.Add(mediaDBItem);

            using (var memoryStream = new MemoryStream())
            using (new SettingsSwitcher("Optimization.MinImageSize", "400"))
            {
                var mediaItem = new MediaItem(db.GetItem(mediaDBItem.ID));
                memoryStream.Write(fakeData, 0, fakeData.Length);

                var mediaStream = new MediaStream(memoryStream, "png", mediaItem);

                var args = new ProcessorArgs(mediaStream);
                new ImageSizeValidationProcessor(logger).Process(args);
                args.Aborted.Should().BeFalse();
            }
        }
    }
}
