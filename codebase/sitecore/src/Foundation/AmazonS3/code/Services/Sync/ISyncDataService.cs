using Sitecore.Data.Items;

namespace easyJet.Foundation.AmazonS3.Services.Sync
{
    public interface ISyncDataService
    {
        /// <summary>
        /// Gets the target folder for an image based on hotel and image code.
        /// If imageCode equals hotelCode, returns the hotel's Images folder.
        /// Otherwise, returns the room's Images folder based on the room code.
        /// Use this method to cache folder lookups when processing multiple images with the same code.
        /// </summary>
        /// <param name="hotelItem">The hotel item.</param>
        /// <param name="imageCode">The image code (e.g., room code like "DB01" or hotel code like "TRAN0070").</param>
        /// <param name="imageName">The image name (used for logging).</param>
        /// <param name="hotelCode">The hotel code.</param>
        /// <returns>The target folder item where the image should be stored, or null if not found.</returns>
        Item GetImageFolder(Item hotelItem, string imageCode, string imageName, string hotelCode);

        /// <summary>
        /// Syncs an image to Amazon S3 and creates/updates the corresponding Sitecore item.
        /// This method resolves the parent folder internally based on imageCode and hotelCode.
        /// </summary>
        /// <param name="hotelItem">The hotel item to sync the image to.</param>
        /// <param name="imageItem">The media library image item to sync.</param>
        /// <param name="imageCode">The image code (e.g., room code or hotel code).</param>
        /// <param name="hotelCode">The hotel code.</param>
        void SyncImage(Item hotelItem, Item imageItem, string imageCode, string hotelCode, bool keepOriginal = false);

        /// <summary>
        /// Syncs an image to Amazon S3 using a pre-resolved parent folder.
        /// Use this overload when you have already cached the folder lookup for better performance.
        /// </summary>
        /// <param name="parentFolder">The pre-resolved target folder for the image.</param>
        /// <param name="imageItem">The media library image item to sync.</param>
        /// <param name="hotelCode">The hotel code (used for error reporting).</param>
        void SyncImage(Item parentFolder, Item imageItem, string hotelCode, bool keepOriginal = false);
    }
}
