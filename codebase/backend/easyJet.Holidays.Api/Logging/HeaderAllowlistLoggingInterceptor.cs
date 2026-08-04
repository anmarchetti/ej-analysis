using easyJet.Holidays.Api.Domain.Attributes;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Logging;

internal class HeaderAllowlistLoggingInterceptor : IHttpLoggingInterceptor
{
    private readonly HashSet<string> _allowList;

    public HeaderAllowlistLoggingInterceptor(IOptions<ApiSettings> loggingOptions)
    {
        var settings = loggingOptions.Value.Logging;

        _allowList = new HashSet<string>(settings.AllowedRequestHeaders, StringComparer.InvariantCultureIgnoreCase);
    }

    /// <inheritdoc />
    public ValueTask OnRequestAsync(HttpLoggingInterceptorContext logContext)
    {
        InsertAllowedHeaders(logContext);

        return default;
    }

    [PerformanceSensitive]
    private void InsertAllowedHeaders(HttpLoggingInterceptorContext logContext)
    {
        foreach (var header in logContext.HttpContext.Request.Headers)
        {
            if (_allowList.Contains(header.Key))
            {
                logContext.AddParameter(header.Key, header.Value);
            }
        }
    }

    /// <inheritdoc />
    public ValueTask OnResponseAsync(HttpLoggingInterceptorContext logContext) => default;
}