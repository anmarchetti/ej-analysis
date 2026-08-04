using System;
using System.Net;
using System.Web.Mvc;
using easyJet.Foundation.Analytics.Controllers;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Services;
using Sitecore.Analytics;

namespace easyJet.Foundation.Destinations.Controllers
{
    public class HotelThemeController : BaseAnalyticsController
    {
        private readonly IHotelThemesService hotelThemesService;
        private readonly ITrackerProvider trackerProvider;

        public HotelThemeController(IHotelThemesService hotelThemesService, IDestinationsLogger logger, ITrackerProvider trackerProvider)
            : base(logger, trackerProvider)
        {
            this.hotelThemesService = hotelThemesService;
            this.trackerProvider = trackerProvider;
        }

        /// <summary>
        /// Trigger Hotel Theme pattern card.
        /// </summary>
        /// <param name="hotelType">Hotel type.</param>
        /// <returns>Http Status OK.</returns>
        [HttpPost]
        public ActionResult TriggerPatternCard(string hotelType)
        {
            if (string.IsNullOrEmpty(hotelType))
            {
                var msg = $"{nameof(hotelType)} can not be null or empty.";
                Logger.Warn(msg, this);
                throw new ArgumentNullException(msg);
            }

            if (Tracker.Current == null)
            {
                trackerProvider.StartTracking(true);
            }

            var actionResult = AssertTrackerOperational();
            if (actionResult != null)
            {
                return actionResult;
            }

            hotelThemesService.BoostHotelThemePatternCard(hotelType);
            return new HttpStatusCodeResult(HttpStatusCode.OK);
        }
    }
}