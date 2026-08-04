using Sitecore.Data.Items;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    public interface IFileService
    {
        /// <summary>
        /// Saving result data to file in media folder.
        /// </summary>
        /// <param name="data">Data of result.</param>
        /// <param name="fileName">File name for result data.</param>
        /// <param name="folderItem">Folder item in Media Library.</param>
        /// <returns>Saved File.</returns>
        Item SaveFileToMediaFolder(byte[] data, string fileName, Item folderItem);
    }
}
