using easyJet.Holidays.Api.Controllers;
using NLog;
using NLog.LayoutRenderers;
using System.Text;

namespace easyJet.Holidays.Api.Logging
{
    /// <summary>
    /// Append log source type (backend, frontend)
    /// </summary>
    [LayoutRenderer(LayoutRendererName)]
    public class LogTypeLayoutRenderer : LayoutRenderer
    {
        public const string LayoutRendererName = "ej-event-source";
        public static readonly string FrontendLogger = typeof(LoggingController).FullName;

        protected override void Append(StringBuilder builder, LogEventInfo logEvent)
        {
            var type = (FrontendLogger == logEvent.LoggerName) ? "FRONTEND" : "BACKEND";
            builder.Append(type);
        }
    }
}
