using System;
using System.Collections.Specialized;
using System.Web;
using Sitecore;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Events;
using Sitecore.Resources.Media;

namespace easyJet.Foundation.Multisite.Events
{
    public class MediaRequestEventHandler
    {
        private const string HeaderName = "X-Robots-Tag";
        private const string NoIndexValue = "noindex";
        private const string ShellSiteName = "shell";
        private const string PdfExtension = "pdf";

        public static string BuildRobotsHeaderValue(Item item)
        {
            if (item == null)
            {
                return null;
            }

            var noIndexField = item.Fields[Constants.Fields.BasePdf.NoIndex];
            if (noIndexField == null)
            {
                return null;
            }

            var checkboxField = (CheckboxField)noIndexField;
            if (checkboxField == null || !checkboxField.Checked)
            {
                return null;
            }

            return NoIndexValue;
        }

        public static bool IsSupportedMediaExtension(string extension)
        {
            return PdfExtension.Equals(extension, StringComparison.InvariantCultureIgnoreCase);
        }

        public static string GetHeaderValueToApply(string existingHeaderValue, string newHeaderValue)
        {
            return string.IsNullOrWhiteSpace(newHeaderValue) ? existingHeaderValue : newHeaderValue;
        }

        public static bool IsShellSite(string siteName)
        {
            return ShellSiteName.Equals(siteName, StringComparison.InvariantCultureIgnoreCase);
        }

        public static bool TryGetMediaRequest(EventArgs args, out MediaRequest request)
        {
            request = null;

            if (!(args is SitecoreEventArgs sitecoreEventArgs) || sitecoreEventArgs.Parameters == null || sitecoreEventArgs.Parameters.Length == 0)
            {
                return false;
            }

            if (!(sitecoreEventArgs.Parameters[0] is MediaRequest mediaRequest) || mediaRequest.MediaUri == null)
            {
                return false;
            }

            request = mediaRequest;
            return true;
        }

        public static bool TryApplyRobotsHeader(string extension, Item mediaItem, NameValueCollection headers)
        {
            if (!IsSupportedMediaExtension(extension) || mediaItem == null || headers == null)
            {
                return false;
            }

            var headerValue = BuildRobotsHeaderValue(mediaItem);
            if (string.IsNullOrWhiteSpace(headerValue))
            {
                return false;
            }

            headers.Set(HeaderName, GetHeaderValueToApply(headers[HeaderName], headerValue));
            return true;
        }

        public static bool TryApplyFromEvent(string siteName, EventArgs args, NameValueCollection headers, Func<MediaRequest, Media> mediaResolver)
        {
            if (IsShellSite(siteName) || !TryGetMediaRequest(args, out var request) || mediaResolver == null)
            {
                return false;
            }

            var media = mediaResolver(request);
            return media?.MediaData?.MediaItem != null && TryApplyRobotsHeader(media.Extension, media.MediaData.MediaItem, headers);
        }

        public void OnMediaRequest(object sender, EventArgs args)
        {
            try
            {
                TryApplyFromEvent(Context.Site?.Name, args, HttpContext.Current?.Response?.Headers, request => MediaManager.GetMedia(request.MediaUri));
            }
            catch (Exception ex)
            {
                Sitecore.Diagnostics.Log.Error("MediaRequestEventHandler: Error processing media request.", ex, this);
            }
        }
    }
}
