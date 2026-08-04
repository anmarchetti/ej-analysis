using easyJet.Holidays.Api.Common.Exceptions;
using NLog;
using NLog.LayoutRenderers;
using System.Text;

namespace easyJet.Holidays.Api.Logging
{
    [LayoutRenderer(LayoutRendererName)]
    public class ApiErrorCodeLayoutRenderer : LayoutRenderer
    {
        public const string LayoutRendererName = "ej-api-error-code";

        /// <summary>
        /// Append Api Error code
        /// </summary>
        /// <param name="builder"></param>
        /// <param name="logEvent"></param>
        protected override void Append(StringBuilder builder, LogEventInfo logEvent)
        {
            if (logEvent.Exception != null && logEvent.Exception is ApiException)
            {
                builder.Append((logEvent.Exception as ApiException).Code.Code);
            }
        }
    }
}
