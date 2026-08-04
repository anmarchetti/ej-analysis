using System.Web.Mvc;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Controllers;

namespace easyJet.Foundation.Destinations.Controllers
{
    public class LuggageController : BaseServicesApiController
    {
        private readonly ILuggageService luggageService;

        public LuggageController(ILuggageService luggageService)
        {
            this.luggageService = luggageService;
        }

        /// <summary>
        /// Collects luggage settings from Sitecore.
        /// </summary>
        /// <param name="language">The language of the sitecore items</param>/>
        /// <returns>Luggage Settings</returns>
        [System.Web.Http.HttpGet]
        public ActionResult Get(string language)
        {
            var luggage = luggageService.GetLuggage(language);
            return Json(luggage, JsonRequestBehavior.AllowGet);
        }
    }
}
