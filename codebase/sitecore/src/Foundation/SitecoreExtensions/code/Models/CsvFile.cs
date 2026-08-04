using System;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using Sitecore.Data.Items;

namespace easyJet.Foundation.SitecoreExtensions.Models
{
    [ExcludeFromCodeCoverage]
    public class CsvFile : IDisposable
    {
        public CsvFile(MediaItem mediaItem)
        {
            if (mediaItem == null)
            {
                return;
            }

            ContentType = mediaItem.MimeType;
            MediaItem = mediaItem;
            Stream = mediaItem.GetMediaStream();
        }

        public MediaItem MediaItem { get; }

        public string ContentType { get; }

        public Stream Stream { get; }

        public void Dispose()
        {
            Stream?.Dispose();
        }
    }
}