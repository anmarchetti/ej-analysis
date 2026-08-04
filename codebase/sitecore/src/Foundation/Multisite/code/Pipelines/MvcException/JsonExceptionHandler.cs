using System.Web.Mvc;
using easyJet.Foundation.Multisite.Logging;
using Sitecore.Mvc.Pipelines.MvcEvents.Exception;

namespace easyJet.Foundation.Multisite.Pipelines.MvcException
{
    public class JsonExceptionHandler : ExceptionProcessor
    {
        private readonly IMultisiteLogger logger;

        public JsonExceptionHandler(IMultisiteLogger logger)
        {
            this.logger = logger;
        }

        public override void Process(ExceptionArgs args)
        {
            var filterContext = args.ExceptionContext;

            filterContext.Result = new JsonResult
            {
                JsonRequestBehavior = JsonRequestBehavior.AllowGet,
                Data = new
                {
                    Success = false,
                    Error = filterContext.Exception.Message,
                    StackTrace = filterContext.Exception.StackTrace,
                    Controller = filterContext.Controller.GetType().Name,
                }
            };

            filterContext.ExceptionHandled = true;
            filterContext.HttpContext.Response.StatusCode = 500;

            logger.Error($"MVC exception processing {Sitecore.Context.RawUrl}", args.ExceptionContext.Exception, this);
        }
    }
}
