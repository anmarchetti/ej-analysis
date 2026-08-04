using System;
using System.Collections.Specialized;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Shell.Framework.Commands.Media;
using Sitecore.Text;
using Sitecore.Web.UI.Sheer;
using Version = Sitecore.Data.Version;

namespace easyJet.Foundation.AmazonS3.Commands
{
    public class BatchUploadByPathCommand : BatchUpload
    {
        public override void Execute(CommandContext context)
        {
            var targetItem = ResolveTargetItem(context);
            if (targetItem == null)
            {
                ExecuteBase(context);
                return;
            }

            var targetPath = Settings.GetSetting(Constants.Settings.SitecoreImagesPathSettingsName, string.Empty).TrimEnd('/');
            var shouldUseCustomDialog = !string.IsNullOrWhiteSpace(targetPath)
                && targetItem.Paths.FullPath.Equals(targetPath, StringComparison.OrdinalIgnoreCase);

            if (!shouldUseCustomDialog)
            {
                ExecuteBase(context);
                return;
            }

            StartCustomBatchUpload(targetItem);
        }

        public override CommandState QueryState(CommandContext context)
        {
            return ResolveTargetItem(context) == null ? CommandState.Hidden : base.QueryState(context);
        }

        [ExcludeFromCodeCoverage]
        protected virtual void ExecuteBase(CommandContext context)
        {
            base.Execute(context);
        }

        [ExcludeFromCodeCoverage]
        protected virtual void StartCustomBatchUpload(Item targetItem)
        {
            var parameters = new NameValueCollection
            {
                ["id"] = targetItem.ID.ToString(),
                ["language"] = targetItem.Language.Name,
                ["version"] = targetItem.Version.Number.ToString()
            };

            Sitecore.Context.ClientPage.Start(this, nameof(RunCustomBatchUpload), parameters);
        }

        protected virtual void RunCustomBatchUpload(ClientPipelineArgs args)
        {
            var itemId = args.Parameters["id"];
            var languageName = args.Parameters["language"];
            var versionValue = args.Parameters["version"];
            var item = ResolveItemFromArgs(itemId, languageName, versionValue);
            if (item == null)
            {
                ShowItemNotFoundAlert();
                return;
            }

            if (args.IsPostBack)
            {
                SendRefreshMessages(itemId);
                return;
            }

            var customDialogUrl = GetCustomDialogUrl();
            var urlString = new UrlString(customDialogUrl);
            item.Uri.AddToUrlString(urlString);
            ShowDialog(urlString.ToString());
            args.WaitForPostBack();
        }

        [ExcludeFromCodeCoverage]
        protected virtual Item ResolveItemFromArgs(string itemId, string languageName, string versionValue)
        {
            return Sitecore.Context.ContentDatabase?.Items[itemId, Language.Parse(languageName), Version.Parse(versionValue)];
        }

        [ExcludeFromCodeCoverage]
        protected virtual void ShowItemNotFoundAlert()
        {
            SheerResponse.Alert("Item not found.");
        }

        [ExcludeFromCodeCoverage]
        protected virtual void SendRefreshMessages(string itemId)
        {
            Sitecore.Context.ClientPage.SendMessage(this, "item:refresh");
            Sitecore.Context.ClientPage.SendMessage(this, $"item:refreshchildren(id={itemId})");
        }

        [ExcludeFromCodeCoverage]
        protected virtual string GetCustomDialogUrl()
        {
            return Settings.GetSetting(Constants.Settings.BatchUploadCustomDialogUrlSettingsName, Constants.Dialogs.DefaultUploadDialogUrl);
        }

        protected virtual void ShowDialog(string url)
        {
            SheerResponse.ShowModalDialog(url, response: true);
        }

        private static Item ResolveTargetItem(CommandContext context)
        {
            return context?.Items?.FirstOrDefault();
        }
    }
}
