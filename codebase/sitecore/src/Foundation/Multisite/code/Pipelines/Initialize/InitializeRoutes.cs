using System.Web.Mvc;
using System.Web.Routing;
using Sitecore.Pipelines;

namespace easyJet.Foundation.Multisite.Pipelines.Initialize
{
    public class InitializeRoutes
    {
        public virtual void Process(PipelineArgs args)
        {
            RouteTable.Routes.MapRoute("easyJet.Api", "api/{controller}/{action}");
            RouteTable.Routes.MapRoute("easyJet.Api.Settings", "api/sitesettings", new { controller = "SiteSettings", action = "Index" });
        }
    }
}
