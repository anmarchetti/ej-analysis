using System;
using System.Linq;
using System.Web.Mvc;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Controllers;

namespace easyJet.Foundation.Destinations.Controllers
{
    public class DestinationsSearchFiltersController : BaseServicesApiController
    {
        private readonly IDestinationsSearchFiltersService service;
        private readonly ISearchFiltersService searchFiltersService;

        public DestinationsSearchFiltersController(IDestinationsSearchFiltersService service, ISearchFiltersService searchFiltersService, IDestinationsLogger logger)
            : base(logger)
        {
            this.service = service;
            this.searchFiltersService = searchFiltersService;
        }

        [HttpPost]
        public ActionResult GetAllFilters(HotelsByIdsRequest request)
        {
            if (request.AtcomIds == null || !request.AtcomIds.Any())
            {
                throw new ArgumentException($"Argument {nameof(request.AtcomIds)} cannot be null or empty");
            }

            var ids = request.AtcomIds.Distinct().ToArray();
            var data = service.GetFilters(ids);

            return UnlimitedJson(data, JsonRequestBehavior.DenyGet);
        }

        [HttpGet]
        public ActionResult GetSearchFilters()
        {
            var response = searchFiltersService.GetSearchFilters(Sitecore.Context.Database);
            return Json(response, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public ActionResult GetFacilityMatrixConfiguration()
        {
            var response = searchFiltersService.GetFacilityMatrixConfigurations();
            return Json(response, JsonRequestBehavior.AllowGet);
        }
    }
}