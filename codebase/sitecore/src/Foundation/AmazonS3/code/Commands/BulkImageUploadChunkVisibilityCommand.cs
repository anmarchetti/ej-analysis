using System;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Foundation.AmazonS3.Commands
{
    public class BulkImageUploadChunkVisibilityCommand : Command
    {
        public override void Execute(CommandContext context)
        {
            // Visibility command. No action is required on execute.
        }

        public override CommandState QueryState(CommandContext context)
        {
            if (context?.Items == null || context.Items.Length == 0)
            {
                return CommandState.Hidden;
            }

            return IsVisibleForItem(context.Items[0]) ? CommandState.Enabled : CommandState.Hidden;
        }

        protected virtual bool IsVisibleForItem(Item item)
        {
            var imagesRootPath = Settings.GetSetting("AmazonS3.SitecoreImagesPath");
            return item != null
                   && !string.IsNullOrEmpty(imagesRootPath)
                   && item.Paths.Path.StartsWith(imagesRootPath, StringComparison.OrdinalIgnoreCase);
        }
    }
}
