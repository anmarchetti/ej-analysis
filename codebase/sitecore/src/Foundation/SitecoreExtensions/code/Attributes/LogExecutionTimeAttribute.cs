using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Web.Mvc;

namespace easyJet.Foundation.SitecoreExtensions.Attributes
{
    [ExcludeFromCodeCoverage]
    public class LogExecutionTimeAttribute : ActionFilterAttribute
    {
        private readonly Stopwatch stopWatch;

        public LogExecutionTimeAttribute()
        {
            stopWatch = new Stopwatch();
        }

        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            stopWatch.Stop();
            stopWatch.Reset();
            stopWatch.Start();
        }

        public override void OnActionExecuted(ActionExecutedContext filterContext)
        {
            stopWatch.Stop();

            var controllerName = filterContext.RouteData.Values["controller"];
            var actionName = filterContext.RouteData.Values["action"];

            Sitecore.Diagnostics.Log.Debug($"Execution time of {controllerName}.{actionName}: {stopWatch.Elapsed}", this);
        }
    }
}