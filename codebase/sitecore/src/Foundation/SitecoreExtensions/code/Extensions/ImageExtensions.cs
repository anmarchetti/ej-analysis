using easyJet.Foundation.SitecoreExtensions.Models;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Links.UrlBuilders;
using Sitecore.Resources.Media;
using Sitecore.Shell.Applications.ContentEditor;

namespace easyJet.Foundation.SitecoreExtensions.Extensions
{
    public static class ImageExtensions
    {
        /// <summary>
        /// Get image URL from media item.
        /// </summary>
        /// <param name="mediaItem">Media Item.</param>
        /// <param name="width">Image width.</param>
        /// <returns>Image url.</returns>
        public static string GetMediaUrl(this MediaItem mediaItem, int width = 0)
        {
            var mediaUrlOptions = MediaUrlBuilderOptions.GetShellOptions();
            if (width > 0)
            {
                mediaUrlOptions.Width = width;
            }

            return mediaItem == null ? null : StringUtil.EnsurePrefix('/', HashingUtils.ProtectAssetUrl(MediaManager.GetMediaUrl(mediaItem, mediaUrlOptions)));
        }

        /// <summary>
        /// Get image URL from media item.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldName">Image Field Name.</param>
        /// <param name="width">Image width.</param>
        /// <returns>Image url.</returns>
        public static string GetMediaUrl(this Item item, string fieldName, int width = 0)
        {
            ImageField file = item?.Fields[fieldName];
            return GetMediaUrl(file?.MediaItem, width);
        }

        /// <summary>
        /// Get medium size image URL from media item.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldName">Image Field Name.</param>
        /// <returns>Image url.</returns>
        public static string GetMediumMediaUrl(this Item item, string fieldName)
        {
            ImageField file = item?.Fields[fieldName];
            return GetMediumImageUrl(file?.MediaItem);
        }

        /// <summary>
        /// Get small size image URL from media item.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldName">Image Field Name.</param>
        /// <returns>Image url.</returns>
        public static string GetSmallMediaUrl(this Item item, string fieldName)
        {
            ImageField file = item?.Fields[fieldName];
            return GetSmallImageUrl(file?.MediaItem);
        }

        /// <summary>
        /// Returns image url for Small size (Taken from Destinations.ImageSize.Small setting, 320px by default).
        /// </summary>
        /// <param name="mediaItem">Media Item.</param>
        /// <returns>Image url for small size.</returns>
        public static string GetSmallImageUrl(this MediaItem mediaItem)
        {
            return GetMediaUrl(mediaItem, Settings.GetIntSetting("Destinations.ImageSize.Small", 320));
        }

        /// <summary>
        /// Returns image url for Medium size (Taken from Destinations.ImageSize.Medium setting, 800px by default).
        /// </summary>
        /// <param name="mediaItem">Media Item.</param>
        /// <returns>Image url for medium size.</returns>
        public static string GetMediumImageUrl(this MediaItem mediaItem)
        {
            return GetMediaUrl(mediaItem, Settings.GetIntSetting("Destinations.ImageSize.Medium", 800));
        }

        /// <summary>
        /// Returns image url for Large size (Taken from Destinations.ImageSize.Large setting, 1024px by default).
        /// </summary>
        /// <param name="mediaItem">Media Item.</param>
        /// <returns>Image url for large size.</returns>
        public static string GetLargeImageUrl(this MediaItem mediaItem)
        {
            return GetMediaUrl(mediaItem, Settings.GetIntSetting("Destinations.ImageSize.Large", 1024));
        }

        /// <summary>
        /// Returns image url for specified size.
        /// </summary>
        /// <param name="mediaItem">Sitecore media item.</param>
        /// <param name="size">Image size.</param>
        /// <returns>Image media url for specified size.</returns>
        public static string GetImageUrl(this MediaItem mediaItem, ImageSize size = ImageSize.Default)
        {
            switch (size)
            {
                case ImageSize.Small:
                    {
                        return GetSmallImageUrl(mediaItem);
                    }

                case ImageSize.Medium:
                    {
                        return GetMediumImageUrl(mediaItem);
                    }

                case ImageSize.Large:
                    {
                        return GetLargeImageUrl(mediaItem);
                    }

                default:
                    {
                        return mediaItem.GetMediaUrl();
                    }
            }
        }
    }
}