using easyJet.Holidays.Api.Domain.Data.Settings;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Filters
{
    public class CallCentreAuthorizedAttribute : ActionFilterAttribute
    {
        private readonly CallCentreSettings _callSentreSettings;

        public CallCentreAuthorizedAttribute(IOptions<CallCentreSettings> callSentreSettings)
        {
            _callSentreSettings = callSentreSettings?.Value;
        }

        public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var auth = context.HttpContext.Request.Headers["Authorization"];
            if (!_callSentreSettings.Enabled)
            {
                context.Result = new ForbidResult();
                return;
            }
            if (auth != _callSentreSettings.Key)
            {
                context.Result = new UnauthorizedObjectResult(string.Empty);
                return;
            }
            await next();
        }
    }
}
