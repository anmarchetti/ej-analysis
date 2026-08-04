using System;
using System.IO;
using System.Web;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Diagnostics;
using Sitecore.Resources.Media;

namespace easyJet.Foundation.Optimization.RequestHandlers
{
    public class MediaRequestHandler : Sitecore.JavaScriptServices.Media.MediaRequestHandler
    {
        public static readonly double CdnCacheMaxTtlDays = Settings.GetDoubleSetting(Constants.SettingNames.CdnCacheMaxTtlDays, 365.0);

        public static readonly int CdnCacheOptimizationTtlSeconds = Settings.GetIntSetting(Constants.SettingNames.CdnCacheOptimizationTtlSeconds, 300);

        protected override MediaStream GetMediaStream(Media media, MediaRequest request)
        {
            var stream = base.GetMediaStream(media, request);

            // when stream.Stream is MemoryStream the compression is still in progress
            HttpContext.Current.Items[Constants.IsOptimizingIndex] = stream.Stream is MemoryStream;
            return stream;
        }

        protected override void SendMediaHeaders(Media media, HttpContextBase context)
        {
            if ((bool?)HttpContext.Current.Items[Constants.IsOptimizingIndex] != true)
            {
                base.SendMediaHeaders(media, context);
            }
            else
            {
                SetCustomCacheHeaders(media, context);
            }
        }

        private static DateTime AdjustMediaDataUpdatedDate(Media media, TimeSpan delta)
        {
            var date = media.MediaData.Updated;

            if (date < DateTime.MinValue + delta)
            {
                date = DateTime.MinValue + delta;
            }

            if (date > DateTime.UtcNow)
            {
                date = DateTime.UtcNow;
            }

            return date;
        }

        private static void SetCacheProperties(HttpResponseBase response, string mediaId, DateTime date, TimeSpan delta)
        {
            var cache = response.Cache;
            cache.SetLastModified(date - delta);
            cache.SetETag($"{mediaId}_temp");
            cache.SetCacheability(Settings.MediaResponse.Cacheability);

            if (delta > TimeSpan.Zero)
            {
                if (delta > TimeSpan.FromDays(CdnCacheMaxTtlDays))
                {
                    delta = TimeSpan.FromDays(CdnCacheMaxTtlDays);
                }

                response.Headers["Edge-Control"] = $"max-age={(int)delta.TotalSeconds}";
                cache.SetMaxAge(delta);
                cache.SetProxyMaxAge(delta);
                cache.SetExpires(DateTime.UtcNow + delta);
                cache.SetRevalidation(HttpCacheRevalidation.AllCaches);
            }

            var slidingExpiration = Settings.MediaResponse.SlidingExpiration;
            if (slidingExpiration != Tristate.Undefined)
            {
                cache.SetSlidingExpiration(slidingExpiration == Tristate.True);
            }

            var cacheExtensions = Settings.MediaResponse.CacheExtensions;
            if (cacheExtensions.Length > 0)
            {
                cache.AppendCacheExtension(cacheExtensions);
            }
        }

        private void SetCustomCacheHeaders(Media media, HttpContextBase context)
        {
            Log.Debug("Setting cacheability to 5 minutes.", this);
            var delta = TimeSpan.FromSeconds(CdnCacheOptimizationTtlSeconds);

            var date = AdjustMediaDataUpdatedDate(media, delta);

            SetCacheProperties(context.Response, media.MediaData.MediaId, date, delta);

            var varyHeader = GetVaryHeader(media, context);
            if (!string.IsNullOrEmpty(varyHeader))
            {
                context.Response.AppendHeader("vary", varyHeader);
            }
        }
    }
}
