using easyJet.Holidays.Api.Domain.Services.Analytics;
using NLog;
using NLog.LayoutRenderers;
using NLog.Web.LayoutRenderers;
using System.Text;

namespace easyJet.Holidays.Api.Logging
{
    [LayoutRenderer(LayoutRendererName)]
    public class ContextMetadataLayoutRenderer : AspNetLayoutMultiValueRendererBase
    {
        public const string LayoutRendererName = "ej-context-metadata";

        /// <summary>
        /// Append request data that identifies user: sessionId and userId
        /// </summary>
        /// <param name="builder"></param>
        /// <param name="logEvent"></param>
        protected override void DoAppend(StringBuilder builder, LogEventInfo logEvent)
        {
            var context = HttpContextAccessor?.HttpContext;

            if (context == null)
            {
                return;
            }

            var analyticsService = context.RequestServices?.GetService(typeof(IAnalyticsService)) as IAnalyticsService;
            if (analyticsService == null)
            {
                return;
            }

            var data = analyticsService.GetAnalyticsData(context);

            var metadata = new List<KeyValuePair<string, string>>(2);
            metadata.Add(new KeyValuePair<string, string>("sessionId", data.SessionId));
            metadata.Add(new KeyValuePair<string, string>("userId", data.UserId));

            SerializePairs(metadata, builder, logEvent);
        }
    }
}
