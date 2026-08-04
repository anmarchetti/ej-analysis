using System.IO;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logging;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.IO;
using Sitecore.Resources.Media;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    [Service(typeof(IFileService), Lifetime = Lifetime.Singleton)]
    public class FileService : IFileService
    {
        private readonly ISitecoreExtensionsLogger logger;

        public FileService(ISitecoreExtensionsLogger logger)
        {
            this.logger = logger;
        }

        /// <inheritdoc/>
        public Item SaveFileToMediaFolder(byte[] data, string fileName, Item folderItem)
        {
            if (folderItem == null || data == null || string.IsNullOrEmpty(fileName))
            {
                logger.Warn($"Can not save file to media folder, due to {nameof(folderItem)} or {nameof(data)} or {nameof(fileName)} variables are null or empty.", this);
                return null;
            }

            MediaCreatorOptions options = new MediaCreatorOptions
            {
                Database = folderItem.Database,
                Language = folderItem.Language,
                Versioned = Settings.Media.UploadAsVersionableByDefault,
                Destination = $"{folderItem.Paths.FullPath}/{FileUtil.GetFileNameWithoutExtension(fileName)}",
                FileBased = Settings.Media.UploadAsFiles
            };

            MediaCreator creator = new MediaCreator();

            using (var stream = new MemoryStream(data))
            {
                return creator.CreateFromStream(stream, fileName, options);
            }
        }
    }
}