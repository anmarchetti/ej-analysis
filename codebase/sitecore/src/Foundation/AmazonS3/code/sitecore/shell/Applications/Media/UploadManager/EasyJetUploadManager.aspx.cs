using System;
using System.Diagnostics.CodeAnalysis;
using System.Web.UI.HtmlControls;
using Sitecore.Shell.Web;
using Sitecore.Web;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.AmazonS3.sitecore.shell.Applications.Media.UploadManager
{
    public class EasyJetUploadManager : ClientPage
    {
        protected static string BuildFrameSource(string baseUrl, string queryString)
        {
            return $"{baseUrl}?{queryString}";
        }

        protected static void SetFrameSource(HtmlGenericControl frame, string baseUrl, string queryString)
        {
            if (frame == null)
            {
                return;
            }

            frame.Attributes["src"] = BuildFrameSource(baseUrl, queryString);
        }

        protected override void OnLoad(EventArgs e)
        {
            var uploadFrame = FindControl("Upload") as HtmlGenericControl;
            var resultFrame = FindControl("Result") as HtmlGenericControl;
            EnsureLoggedIn();
            base.OnLoad(e);
            var queryString = GetQueryString();
            SetFrameSource(uploadFrame, Constants.Dialogs.CustomUploadDialogUrl, queryString);
            SetFrameSource(resultFrame, Constants.Dialogs.UploadResultDialogUrl, queryString);
        }

        [ExcludeFromCodeCoverage]
        protected virtual void EnsureLoggedIn()
        {
            ShellPage.IsLoggedIn();
        }

        [ExcludeFromCodeCoverage]
        protected virtual string GetQueryString()
        {
            return WebUtil.GetQueryString();
        }
    }
}
