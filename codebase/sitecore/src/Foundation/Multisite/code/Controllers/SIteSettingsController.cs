using System.Web.Mvc;
using easyJet.Foundation.Multisite.Logging;
using easyJet.Foundation.Multisite.Models;
using easyJet.Foundation.Multisite.Services;
using easyJet.Foundation.SitecoreExtensions.Controllers;
using Sitecore.Configuration;

namespace easyJet.Foundation.Multisite.Controllers
{
    public class SiteSettingsController : BaseServicesApiController
    {
        private readonly ISettingsService service;
        private readonly IMarketSettingsService marketSettingsService;
        private readonly IExperimentSettingsService experimentSettingsService;

        public SiteSettingsController(
            ISettingsService service,
            IMultisiteLogger logger,
            IMarketSettingsService marketSettingsService,
            IExperimentSettingsService experimentSettingsService)
            : base(logger)
        {
            this.service = service;
            this.marketSettingsService = marketSettingsService;
            this.experimentSettingsService = experimentSettingsService;
        }

        /// <summary>
        /// Gets all items under the Site Settings folder and
        /// returns all custom fields with values.
        /// </summary>
        /// <returns>Collection of field-value pair grouped by items in JSON format.</returns>
        [HttpGet]
        public ActionResult Index()
        {
            var settings = experimentSettingsService.GetAllSettingsWithExperiments();
            return Json(settings, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Get cache busting query for promo.
        /// </summary>
        /// <returns>Promo pages cache busting response in JSON format.</returns>
        [HttpGet]
        public ActionResult GetPromoCacheBustingSetting()
        {
            var settingPath = Settings.GetSetting("PromoPagesCacheBustingSetting.Path");
            var cacheBustingQueryValue = service.GetSettingField(settingPath, Constants.Fields.PromoCacheBustingSetting.QueryValue);
            var promoCacheBustingResponse = new PromoCacheBustingResponse() { QueryValue = cacheBustingQueryValue };
            return Json(promoCacheBustingResponse, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public ActionResult GetAllMarketSettings()
        {
            return Json(marketSettingsService.GetAllMarkets(), JsonRequestBehavior.AllowGet);
        }
    }
}