using System;
using Sitecore.Analytics;
using Sitecore.JavaScriptServices.Configuration;
using Sitecore.JavaScriptServices.ViewEngine.LayoutService.Pipelines.GetLayoutServiceContext;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;

namespace easyJet.Foundation.Analytics.Pipelines.GetLayoutServiceContext
{
    public class TrackingIdContextDataProcessor : JssGetLayoutServiceContextProcessor
    {
        public const string TrackingIdPropertyName = "trackingId";

        public TrackingIdContextDataProcessor(IConfigurationResolver configurationResolver)
            : base(configurationResolver)
        {
        }

        protected override void DoProcess(GetLayoutServiceContextArgs args, AppConfiguration application)
        {
            var trackingId = Tracker.Current?.Session?.Device?.LastKnownContactId;

            if (trackingId.HasValue)
            {
                args.ContextData.Add(TrackingIdPropertyName, ((Guid)trackingId).ToString("N"));
            }
        }
    }
}
