using System.Collections.Generic;
using System.IO;
using easyJet.Foundation.AmazonS3.Models;
using Sitecore.Data.Items;

namespace easyJet.Foundation.AmazonS3.Services
{
    public interface IImageService
    {
        /// <summary>
        /// Resize Sitecore Media Item into 3 versions (Small, Medium, Large).
        /// </summary>
        /// <param name="mediaItem">Media Item.</param>
        /// <exception cref="System.ArgumentNullException">Throw when mediaItem is null.</exception>
        /// <returns>Collection of Images with different size.</returns>
        List<Image> ResizeImage(MediaItem mediaItem);

        /// <summary>
        /// Resize Media Stream by provided width.
        /// </summary>
        /// <param name="source">Source Stream.</param>
        /// <param name="width">New width.</param>
        /// <exception cref="System.ArgumentNullException">Throw when source is null.</exception>
        /// <exception cref="System.ArgumentOutOfRangeException">Throw when width is negative or zero.</exception>
        /// <returns>New resized media.</returns>
        Stream ResizeImage(Stream source, int width);
    }
}
