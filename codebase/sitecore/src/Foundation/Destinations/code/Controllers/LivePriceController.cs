using System.Linq;
using System.Web.Mvc;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Controllers;

namespace easyJet.Foundation.Destinations.Controllers
{
    /// <summary>
    /// Live Price Controller.
    /// </summary>
    public class LivePriceController : BaseServicesApiController
    {
        private readonly ILivePriceRepository livePriceRepository;

        /// <summary>
        /// Initializes a new instance of the <see cref="LivePriceController"/> class.
        /// </summary>
        /// <param name="livePriceRepository">Live Price Repository.</param>
        public LivePriceController(ILivePriceRepository livePriceRepository)
        {
            this.livePriceRepository = livePriceRepository;
        }

        /// <summary>
        /// Collects market Live price settings and Periods settings from Sitecore.
        /// </summary>
        /// <param name="request">Request containing code of a market to get Live prices for.</param>/>
        /// <returns>Collection of NamedSearches.</returns>
        [HttpGet]
        public ActionResult Get(LivePriceSettingsRequest request)
        {
            var marketLivePriceSettings = livePriceRepository.GetLivePriceSettings(request.MarketCode);

            var response = new LivePriceSettingsResponse()
            {
                NamedSearches = marketLivePriceSettings.Select(x => new NamedSearchResponse(x)).ToList()
            };
            return Json(response, JsonRequestBehavior.AllowGet);
        }
    }
}