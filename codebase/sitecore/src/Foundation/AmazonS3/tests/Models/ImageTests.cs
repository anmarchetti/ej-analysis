using easyJet.Foundation.AmazonS3.Models;
using FluentAssertions;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.AmazonS3.Tests.Models
{
    public class ImageTests
    {
        [Fact]
        public void Image_SetupMediaItem_IfMediaItemNotNull()
        {
            var mediaItem = new MediaItem(new FakeItem().WithName("image").ToSitecoreItem());

            // Act
            var image = new Image(mediaItem);

            // Assert
            image.MediaItem.Should().BeSameAs(mediaItem);
            image.ContentType.Should().Be(mediaItem.MimeType);
        }

        [Fact]
        public void Image_SetupMediaItem_IfMediaItemEqualNull()
        {
            // Act
            var image = new Image(null);

            // Assert
            image.ContentType.Should().BeNull();
            image.MediaItem.Should().BeNull();
        }

        [Fact]
        public void Image_StreamShouldDispose_IfCallMethodDispoce()
        {
            var stream = new TestDisposableStream();
            var image = new Image
            {
                Stream = stream,
            };

            // Act
            image.Dispose();

            // Assert
            stream.IsDisposed.Should().BeTrue();
        }

        private class TestDisposableStream : System.IO.MemoryStream
        {
            public bool IsDisposed { get; private set; }

            protected override void Dispose(bool disposing)
            {
                IsDisposed = true;
                base.Dispose(disposing);
            }
        }
    }
}
