using System.Linq;
using System.Web.Mvc;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Controllers;

namespace easyJet.Foundation.Destinations.Controllers
{
    public class RequestedSearchesController : BaseServicesApiController
    {
        private readonly IRequestedSearchesService requestedSearchesService;

        public RequestedSearchesController(IRequestedSearchesService requestedSearchesService)
        {
            this.requestedSearchesService = requestedSearchesService;
        }

        /// <summary>
        /// Collects market specific Requested Searches and Time Periods from Sitecore based on marketCode.
        /// </summary>
        /// <param name="request">Request containing code of a market to get Requested Searches for.</param>/>
        /// <returns>Collection of RequestedSearches.</returns>
        [HttpGet]
        public ActionResult Get(RequestedSearchesRequest request)
        {
            var requestedSearches = requestedSearchesService.GetRequestedSearches(request.MarketCode);
            var response = new RequestedSearchesResponse
            {
                RequestedSearches = requestedSearches?.Select(x => new RequestedSearchResponse(x)).ToList(),
            };

            return Json(response, JsonRequestBehavior.AllowGet);
        }
    }
}