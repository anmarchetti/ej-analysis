using System;
using System.Diagnostics.CodeAnalysis;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.AmazonS3.Commands
{
    public class ToggleImportHotelImagesKeepOriginalCommand : Command
    {
        public override void Execute(CommandContext context)
        {
            var currentValue = GetKeepOriginalEnabled();
            SetKeepOriginalEnabled(!currentValue);
            SendRefreshMessage();
        }

        public override CommandState QueryState(CommandContext context)
        {
            if (context?.Items == null || context.Items.Length == 0)
            {
                return CommandState.Hidden;
            }

            if (!IsUnderImagesRootPath(context.Items[0]))
            {
                return CommandState.Hidden;
            }

            // Large check ribbon buttons use Down for the pressed/checked state; Enabled alone is always unchecked.
            return GetKeepOriginalEnabled() ? CommandState.Down : CommandState.Enabled;
        }

        protected virtual bool IsUnderImagesRootPath(Item item)
        {
            var imagesRootPath = Settings.GetSetting("AmazonS3.SitecoreImagesPath");
            var itemPath = item?.Paths?.Path;
            return item != null
                   && !string.IsNullOrEmpty(imagesRootPath)
                   && !string.IsNullOrEmpty(itemPath)
                   && itemPath.StartsWith(imagesRootPath, StringComparison.OrdinalIgnoreCase)
                   && !itemPath.Equals(imagesRootPath, StringComparison.OrdinalIgnoreCase);
        }

        [ExcludeFromCodeCoverage]
        protected virtual bool GetKeepOriginalEnabled()
        {
            var rawValue = Sitecore.Context.User?.Profile?.GetCustomProperty(Constants.Settings.ImportHotelImagesKeepOriginalProfileKey);
            return MainUtil.GetBool(rawValue, false);
        }

        [ExcludeFromCodeCoverage]
        protected virtual void SetKeepOriginalEnabled(bool value)
        {
            var profile = Sitecore.Context.User?.Profile;
            if (profile == null)
            {
                return;
            }

            profile.SetCustomProperty(Constants.Settings.ImportHotelImagesKeepOriginalProfileKey, value ? "1" : "0");
            profile.Save();
            SheerResponse.Eval("scForm.postRequest('', '', '', 'item:load(id=' + scContent.getId() + ')');");
        }

        [ExcludeFromCodeCoverage]
        protected virtual void SendRefreshMessage()
        {
            Sitecore.Context.ClientPage.SendMessage(this, "item:refresh");
        }
    }
}
