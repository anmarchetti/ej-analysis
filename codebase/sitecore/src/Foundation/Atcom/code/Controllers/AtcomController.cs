using System.Linq;
using System.Web.Mvc;
using easyJet.Foundation.Atcom.Models;
using easyJet.Foundation.Atcom.Services;

namespace easyJet.Foundation.Atcom.Controllers
{
    public class AtcomController : Controller
    {
        private readonly IMasterDataService service;

        public AtcomController(IMasterDataService service)
        {
            this.service = service;
        }

        public ActionResult GetRoomCodes()
        {
            return Json(service.GetRoomCodes(), JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetRoomFacilities()
        {
            return Json(service.GetRoomFacilities(), JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetCountryCodes()
        {
            return Json(service.GetCountryCodes(), JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetLocationCodes(string countryCode)
        {
            return Json(service.GetLocationCodes(countryCode), JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetResortCodes(string locationCode)
        {
            return Json(service.GetResortCodes(locationCode), JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetAirports(string countryCode)
        {
            return Json(service.GetAirports(countryCode), JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Get accommodations codes by resort code.
        /// </summary>
        /// <param name="resortCode">Resort code.</param>
        /// <returns>Accommodations codes.</returns>
        public ActionResult GetAccommodationCodes(string resortCode)
        {
            return Json(service.GetAccommodations(resortCode)?.Select(x => (DataObject)x), JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetStarRatingCodes()
        {
            return Json(service.GetStarRatingCodes(), JsonRequestBehavior.AllowGet);
        }
    }
}