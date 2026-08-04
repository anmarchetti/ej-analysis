using System;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    /// <summary>
    /// Represents Image Data object.
    /// </summary>
    public class ImageData
    {
        public ImageData()
        {
        }

        public ImageData(MediaItem mediaItem)
        {
            if (mediaItem == null)
            {
                return;
            }

            Small = mediaItem.GetSmallImageUrl();
            Medium = mediaItem.GetMediumImageUrl();
            Large = mediaItem.GetLargeImageUrl();
        }

        /// <summary>
        /// Gets or sets Item ID.
        /// </summary>
        public Guid Id { get; set; }

        /// <summary>
        /// Gets or sets small Image size url.
        /// </summary>
        public string Small { get; set; }

        /// <summary>
        /// Gets or sets medium Image size url.
        /// </summary>
        public string Medium { get; set; }

        /// <summary>
        /// Gets or sets large Image size url.
        /// </summary>
        public string Large { get; set; }

        /// <summary>
        /// Gets or sets descriptiob for image
        /// </summary>
        public string Description { get; set; }
    }
}