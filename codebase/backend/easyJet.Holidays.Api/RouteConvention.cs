using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.AspNetCore.Mvc.Routing;

namespace easyJet.Holidays.Api
{
    /// <summary>
    /// Global routing prefix configuration
    /// </summary>
    public class RouteConvention : IApplicationModelConvention
    {
        /// <summary>
        /// Define a routing prefix variable
        /// </summary>
        private readonly AttributeRouteModel _centralPrefix;
        /// <summary>
        /// Input the specified routing prefix when invoked
        /// </summary>
        /// <param name="routeTemplateProvider"></param>
        public RouteConvention(IRouteTemplateProvider routeTemplateProvider)
        {
            _centralPrefix = new AttributeRouteModel(routeTemplateProvider);
        }

        // Apply Method of Interface
        public void Apply(ApplicationModel application)
        {
            // Traversing through all Controllers
            foreach (var controller in application.Controllers)
            {
                // 1. Controller that has marked RouteAttribute
                // It is important to note that if a routing has been marked in the controller, the specified routing content will be added before the routing.

                var matchedSelectors = controller.Selectors.Where(x => x.AttributeRouteModel != null).ToList();
                if (matchedSelectors.Any())
                {
                    foreach (var selectorModel in matchedSelectors)
                    {
                        // Add another routing prefix to the current routing
                        selectorModel.AttributeRouteModel = AttributeRouteModel.CombineAttributeRouteModel(_centralPrefix,
                          selectorModel.AttributeRouteModel);
                    }
                }

                // 2. Controller without RouteAttribute tag
                var unmatchedSelectors = controller.Selectors.Where(x => x.AttributeRouteModel == null).ToList();
                if (unmatchedSelectors.Any())
                {
                    foreach (var selectorModel in unmatchedSelectors)
                    {
                        // Add a routing prefix
                        selectorModel.AttributeRouteModel = _centralPrefix;
                    }
                }
            }
        }
    }
}
