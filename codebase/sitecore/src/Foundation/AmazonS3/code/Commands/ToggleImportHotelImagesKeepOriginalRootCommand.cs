using System;
using Sitecore.Configuration;
using Sitecore.Data.Items;

namespace easyJet.Foundation.AmazonS3.Commands
{
    public class ToggleImportHotelImagesKeepOriginalRootCommand : ToggleImportHotelImagesKeepOriginalCommand
    {
        protected override bool IsUnderImagesRootPath(Item item)
        {
            var imagesRootPath = Settings.GetSetting("AmazonS3.SitecoreImagesPath");
            var itemPath = item?.Paths?.Path;
            return item != null
                   && !string.IsNullOrEmpty(imagesRootPath)
                   && !string.IsNullOrEmpty(itemPath)
                   && itemPath.Equals(imagesRootPath, StringComparison.OrdinalIgnoreCase);
        }
    }
}
