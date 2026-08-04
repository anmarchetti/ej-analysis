using System.Collections.Generic;
using System.IO;
using easyJet.Foundation.AmazonS3.Models;

namespace easyJet.Foundation.AmazonS3.Services
{
    public interface IAmazonS3ImageBucketService
    {
        /// <summary>
        /// Upload images to AWS S3 bucket.
        /// </summary>
        /// <param name="images">Collection of images.</param>
        /// <exception cref="System.ArgumentNullException">Throw when images is null.</exception>
        /// <returns>Image relative URLs.</returns>
        Dictionary<string, string> UploadImages(ICollection<Image> images);

        /// <summary>
        /// Upload a single image to AWS S3 bucket using an explicit key (no MediaItem dependency).
        /// </summary>
        /// <param name="imageStream">The image data stream.</param>
        /// <param name="s3Key">The full S3 object key (e.g. "hotelCode/small/image.jpg").</param>
        /// <param name="contentType">The MIME content type (e.g. "image/jpeg").</param>
        /// <exception cref="System.ArgumentNullException">Throw when imageStream or s3Key is null.</exception>
        /// <returns>The full S3 URL of the uploaded image.</returns>
        string UploadImage(Stream imageStream, string s3Key, string contentType);

        /// <summary>
        /// Delete images from AWS S3 bucket.
        /// </summary>
        /// <param name="imagesUrl">Collection of Image Url's from AWS S3.</param>
        /// <exception cref="System.ArgumentNullException">Throw when imagesUrl is null.</exception>
        void DeleteImages(ICollection<string> imagesUrl);
    }
}
