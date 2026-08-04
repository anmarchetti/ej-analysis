using Microsoft.Extensions.Primitives;

namespace easyJet.Holidays.Api.Middleware;

/// <summary>
/// Security Headers Middleware
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context)
    {
        context.Response.Headers.Add("Content-Security-Policy", new StringValues("frame-ancestors 'self'"));
        context.Response.Headers.Add("X-Frame-Options", new StringValues("DENY"));
        context.Response.Headers.Add("X-Content-Type-Options", new StringValues("nosniff"));
        await _next(context);
    }
}

// Extension method used to add the middleware to the HTTP request pipeline.
/// <summary>
/// Add Security Headers to the HTTP response
/// </summary>
public static class SecurityHeadersMiddlewareExtensions
{
    public static void UseSecurityHeadersMiddleware(this IApplicationBuilder builder)
    {
        builder.UseMiddleware<SecurityHeadersMiddleware>();
    }
}