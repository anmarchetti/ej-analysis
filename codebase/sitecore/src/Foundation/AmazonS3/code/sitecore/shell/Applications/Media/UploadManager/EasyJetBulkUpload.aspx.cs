using System;
using System.Diagnostics.CodeAnalysis;
using System.Web.UI.HtmlControls;
using Sitecore;
using Sitecore.Shell.Applications.Media.UploadManager;

namespace easyJet.Foundation.AmazonS3.sitecore.shell.Applications.Media.UploadManager
{
    public class EasyJetBulkUpload : UploadPage
    {
        protected internal static void ApplyKeepOriginalCheckboxState(HtmlInputCheckBox keepOriginalCheckbox, bool isKeepOriginalEnabled)
        {
            if (keepOriginalCheckbox == null)
            {
                return;
            }

            keepOriginalCheckbox.Checked = isKeepOriginalEnabled;
        }

        protected internal static bool ParseKeepOriginalValue(string rawValue)
        {
            return MainUtil.GetBool(rawValue, false);
        }

        protected override void OnLoad(EventArgs e)
        {
            if (Sitecore.Context.Database != null)
            {
                base.OnLoad(e);
            }

            ApplyKeepOriginalCheckboxState();
        }

        [ExcludeFromCodeCoverage]
        protected virtual bool GetKeepOriginalEnabled()
        {
            var rawValue = Sitecore.Context.User?.Profile?.GetCustomProperty(Constants.Settings.ImportHotelImagesKeepOriginalProfileKey);
            return ParseKeepOriginalValue(rawValue);
        }

        private void ApplyKeepOriginalCheckboxState()
        {
            var keepOriginalCheckbox = FindControl(Constants.Dialogs.KeepOriginalCheckboxName) as HtmlInputCheckBox;
            if (keepOriginalCheckbox == null)
            {
                return;
            }

            ApplyKeepOriginalCheckboxState(keepOriginalCheckbox, GetKeepOriginalEnabled());
        }
    }
}
