using System.Net;
using System.Web.Mvc;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.SitecoreExtensions.Controllers;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.Analytics.Controllers
{
    public abstract class BaseAnalyticsController : BaseServicesApiController
    {
        protected ITrackerProvider TrackerProvider { get; }

        protected BaseAnalyticsController(ILogger logger, ITrackerProvider trackerProvider)
            : base(logger)
        {
            TrackerProvider = trackerProvider;
        }

        /// <summary>
        /// Assert is tracking is enabled or active.
        /// Force start even when cookie consent is not given.
        /// </summary>
        /// <returns><see langword="null" /> if tracker is active and contact is assigned to tracker, otherwise <see langword="BadRequest"/>.</returns>
        protected ActionResult AssertTrackerOperational()
        {
            if (TrackerProvider == null || !TrackerProvider.Enabled)
            {
                Logger.Warn("[tracker] Tracker is disabled.", this);
                return BadRequest("Tracker is disabled.");
            }

            if (TrackerProvider.CurrentTracker == null || !TrackerProvider.CurrentTracker.IsActive)
            {
                if (TrackerProvider.CurrentTracker == null)
                {
                    Logger.Warn("[tracker] Current tracker doesn't have any contact.", this);
                }

                Logger.Warn("[tracker] Tracker is not active or correctly initialized.", this);
                return BadRequest("Tracker is inactive.");
            }

            if (TrackerProvider.CurrentTracker.Contact == null)
            {
                Logger.Warn("[tracker] Current tracker doesn't have any contact.", this);
                return BadRequest("No contact");
            }

            if (TrackerProvider.CurrentTracker.Interaction == null)
            {
                Logger.Warn("[tracker] Current tracker doesn't have any contact.", this);
                return BadRequest("No interaction");
            }

            return null;
        }

        /// <summary>
        /// Returns bad request.
        /// </summary>
        /// <param name="description">Error description.</param>
        /// <returns>BadRequest status.</returns>
        protected ActionResult BadRequest(string description)
        {
            Response.TrySkipIisCustomErrors = true;
            return new HttpStatusCodeResult(HttpStatusCode.BadRequest, description);
        }

        /// <summary>
        /// Returns bad request.
        /// </summary>
        /// <param name="json">Error json.</param>
        /// <returns>BadRequest status.</returns>
        protected ActionResult BadRequest(object json)
        {
            Response.StatusCode = (int)HttpStatusCode.BadRequest;
            Response.TrySkipIisCustomErrors = true;
            return Json(json);
        }
    }
}