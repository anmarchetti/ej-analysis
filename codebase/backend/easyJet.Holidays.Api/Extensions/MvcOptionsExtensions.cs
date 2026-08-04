using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;

namespace easyJet.Holidays.Api.Extensions
{
    public static class MvcOptionsExtensions
    {
        /// <summary>
        /// Extension method
        /// </summary>
        /// <param name="opts"></param>
        /// <param name="routeAttribute"></param>
        public static void UseCentralRoutePrefix(this MvcOptions opts, IRouteTemplateProvider routeAttribute)
        {
            // Add our custom OuteConvention to implement the IApplication Model Convention
            opts.Conventions.Insert(0, new RouteConvention(routeAttribute));
        }
    }
}
