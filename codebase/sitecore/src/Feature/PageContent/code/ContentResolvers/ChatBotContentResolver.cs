using easyJet.Foundation.Analytics.Services;
using Newtonsoft.Json.Linq;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.ItemRendering.ContentsResolvers;
using Sitecore.Mvc.Presentation;
using RenderingContentsResolver = easyJet.Foundation.SitecoreExtensions.ContentResolvers.RenderingContentsResolver;

namespace easyJet.Feature.PageContent.ContentResolvers
{
    public class ChatBotContentResolver : RenderingContentsResolver, IRenderingContentsResolver
    {
        public const string ScAnalyticsPropertyName = "SCAnalyticsGlobalValue";
        private readonly ITrackerProvider trackerProvider;

        public ChatBotContentResolver(ITrackerProvider trackerProvider)
        {
            this.trackerProvider = trackerProvider;
        }

        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            if (!(base.ResolveContents(rendering, renderingConfig) is JObject result))
            {
                return null;
            }

            EnrichResultItem(result);

            return result;
        }

        private void EnrichResultItem(JObject result)
        {
            AddSCAnalyticsValue(result);
        }

        private void AddSCAnalyticsValue(JObject result)
        {
            var deviceId = trackerProvider.CurrentTracker?.Session?.Device?.DeviceId.ToString("N") ?? string.Empty;

            result[ScAnalyticsPropertyName] = JToken.FromObject(deviceId);
        }
    }
}
