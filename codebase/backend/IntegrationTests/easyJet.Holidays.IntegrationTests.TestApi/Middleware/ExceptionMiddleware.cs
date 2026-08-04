using easyJet.Holiday.IntegrationTests.Shared.Exceptions;

namespace easyJet.Holidays.IntegrationTests.TestApi.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (BookingException ex)
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new { Reason = ex.Reason, Attempt = ex.Attempt });
        }
    }
}