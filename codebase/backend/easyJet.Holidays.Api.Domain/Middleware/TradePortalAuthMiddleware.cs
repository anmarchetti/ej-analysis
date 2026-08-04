using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using System.Net;

namespace easyJet.Holidays.Api.Domain.Middleware
{
    public class TradePortalAuthMiddleware
    {
        private readonly RequestDelegate _next;

        public TradePortalAuthMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context,
            IHttpContextAccessor httpContextAccessor,
            ITradeAgentAuthenticationService tradeAgentAuthService,
            ITradeAgentCookieAuthService tradeAgentCookieService)
        {
            if (tradeAgentAuthService.IsTradePortalEnv())
            {
                var auth = await context.AuthenticateAsync();

                if (auth.Succeeded)
                    httpContextAccessor.HttpContext.User = auth.Principal;

                if (!tradeAgentAuthService.IsLoggedInAsTradeAgent())
                    throw new ApiException(ApiExceptionCodes.UnauthorizedAccess, HttpStatusCode.Unauthorized);

                var cookieCredentials = tradeAgentCookieService.GetCredentials();

                if (!string.IsNullOrWhiteSpace(cookieCredentials?.Number))
                    await tradeAgentCookieService.SetCookie(cookieCredentials);
            }

            await _next(context);
        }
    }

    public static class TradePortalAuthMiddlewareExtensions
    {
        public static IApplicationBuilder UseTradePortalAuthMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseWhen(
                httpContext => !httpContext.Request.Path.Value.Contains("/trade-portal/account"),
                subApp => subApp.UseMiddleware<TradePortalAuthMiddleware>()
            );
        }
    }
}