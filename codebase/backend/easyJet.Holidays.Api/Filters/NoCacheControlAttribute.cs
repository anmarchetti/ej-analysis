using Microsoft.AspNetCore.Mvc.Filters;

namespace easyJet.Holidays.Api.Filters
{
    public class NoCacheControlAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuted(ActionExecutedContext context)
        {
            context.HttpContext.Response.Headers.Add("Cache-Control", "no-store, no-cache");
        }
    }
}
