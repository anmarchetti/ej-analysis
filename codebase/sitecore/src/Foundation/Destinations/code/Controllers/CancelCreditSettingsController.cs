using System.Web.Mvc;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Controllers;

namespace easyJet.Foundation.Destinations.Controllers
{
    public class CancelCreditSettingsController : BaseServicesApiController
    {
        private readonly ICancelCreditSettingsService service;

        public CancelCreditSettingsController(ICancelCreditSettingsService service)
        {
            this.service = service;
        }

        /// <summary>
        /// Get all cancel and credit settigns.
        /// </summary>
        /// <returns>Collection of cancel and credit settings.</returns>
        [HttpGet]
        public ActionResult Get()
        {
            var response = service.GetCancelCreditSetting();

            return Json(response, JsonRequestBehavior.AllowGet);
        }
    }
}