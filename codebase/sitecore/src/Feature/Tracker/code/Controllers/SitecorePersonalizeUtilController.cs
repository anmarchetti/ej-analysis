using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using System.Web.Mvc;
using easyJet.Feature.Tracker.Models.Personalize;
using easyJet.Feature.Tracker.Services;
using easyJet.Foundation.Destinations.Services;

namespace easyJet.Feature.Tracker.Controllers
{
    public class SitecorePersonalizeUtilController : Controller
    {
        private readonly IAirportsService airportsService;
        private readonly ITrackingDatabaseService trackingDatabaseService;

        public SitecorePersonalizeUtilController(IAirportsService airportsService, ITrackingDatabaseService trackingDatabaseService)
        {
            this.airportsService = airportsService;
            this.trackingDatabaseService = trackingDatabaseService;
        }

        [System.Web.Http.HttpGet]
        public ActionResult GetAirportsEnumValues(string[] airportCodes)
        {
            var airports = airportsService.GetAirportsByCountryCodes(airportCodes);
            var enumNames = new List<string> { "Please Select Airport" };
            var enumValues = new List<string> { "null" };

            foreach (var airport in airports)
            {
                enumNames.Add(airport.Name);
                enumValues.Add(airport.Code);
            }

            var namesString = string.Join(",", enumNames);
            var valuesString = string.Join(",", enumValues);

            return Json(new { labels = namesString, values = valuesString }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public async Task<ActionResult> OrderCheckoutReference(PersonalizationOrderCheckout orderCheckout)
        {
            await trackingDatabaseService.Save(orderCheckout);
            return new HttpStatusCodeResult(HttpStatusCode.OK);
        }
    }
}
