using System;
using System.Web.Mvc;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Controllers;

namespace easyJet.Foundation.Destinations.Controllers
{
    public class AirportsController : BaseServicesApiController
    {
        private readonly IAirportsService repository;

        public AirportsController(IAirportsService repository, IDestinationsLogger logger)
            : base(logger)
        {
            this.repository = repository;
        }

        /// <summary>
        /// Search for Airport by country code, if country code is not provided, return all airports.
        /// </summary>
        /// <param name="countryCode">Country Code.</param>
        /// <returns>Collection of Airports.</returns>
        [HttpGet]
        public ActionResult Get(string countryCode)
        {
            var data = repository.GetAirportsByCountryCodes(string.IsNullOrEmpty(countryCode) ? Array.Empty<string>() : new[] { countryCode });
            return Json(data, JsonRequestBehavior.AllowGet);
        }
    }
}