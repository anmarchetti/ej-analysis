using easyJet.Holidays.Api.Domain.Services.Analytics;

namespace easyJet.Holidays.Api.Middleware
{
    public class AnalyticsCookiesMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<AnalyticsCookiesMiddleware> _logger;

        public AnalyticsCookiesMiddleware(RequestDelegate next, ILogger<AnalyticsCookiesMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task Invoke(HttpContext httpContext, IAnalyticsService analyticsService)
        {
            try
            {
                analyticsService.AddAnalyticsData(httpContext);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cannot set analytics cookies");
            }

            await _next(httpContext);
        }
    }

    // Extension method used to add the middleware to the HTTP request pipeline.
    public static class AnalyticsCookiesMiddlewareExtensions
    {
        public static IApplicationBuilder UseAnalyticsCookiesMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<AnalyticsCookiesMiddleware>();
        }
    }
}
