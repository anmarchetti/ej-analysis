using System;
using System.IO;
using Sitecore.Data.Items;
using Sitecore.Resources.Media;

namespace easyJet.Foundation.AmazonS3.Models
{
    public class Image : IDisposable
    {
        public Image()
        {
        }

        public Image(MediaItem mediaItem)
        {
            if (mediaItem == null)
            {
                return;
            }

            ContentType = mediaItem.MimeType;
            MediaItem = mediaItem;
            Stream = MediaManager.GetMedia(mediaItem)?.GetStream().Stream;
        }

        public MediaItem MediaItem { get; set; }

        public string Version { get; set; }

        public string ContentType { get; set; }

        public Stream Stream { get; set; }

        public void Dispose()
        {
            Stream?.Dispose();
        }
    }
}