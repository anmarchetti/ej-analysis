using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Filters
{
    public class ApiAuthAttribute : ActionFilterAttribute
    {
        private readonly ApiSettings _apiSettings;

        public ApiAuthAttribute(IOptions<ApiSettings> apiSettings)
        {
            _apiSettings = apiSettings.Value ?? throw new ArgumentNullException(nameof(apiSettings));
        }

        public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            if (!context.HttpContext.Request.Headers.ContainsKey("Authorization") || context.HttpContext.Request.Headers["Authorization"].FirstOrDefault() != _apiSettings.ApiKey)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            await next();
        }
    }
}
