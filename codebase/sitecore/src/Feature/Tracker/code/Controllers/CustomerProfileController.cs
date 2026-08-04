using System;
using System.Net;
using System.Web.Mvc;
using easyJet.Feature.Tracker.Logging;
using easyJet.Feature.Tracker.Models.Requests;
using easyJet.Feature.Tracker.Services;
using easyJet.Foundation.Analytics.Controllers;
using easyJet.Foundation.Analytics.Services;

namespace easyJet.Feature.Tracker.Controllers
{
    public class CustomerProfileController : BaseAnalyticsController
    {
        private readonly ICustomerProfileService customerProfileService;
        private readonly ITrackerProvider trackerProvider;

        public CustomerProfileController(
            ITrackerProvider trackerProvider,
            ITrackerLogger logger,
            ICustomerProfileService customerProfileService)
            : base(logger, trackerProvider)
        {
            this.customerProfileService = customerProfileService;
            this.trackerProvider = trackerProvider;
        }

        [HttpPost]
        public ActionResult TrackLogIn(TrackCustomerLogInRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            var actionResult = AssertTrackerOperational();
            if (actionResult != null)
            {
                return actionResult;
            }

            try
            {
                customerProfileService.TrackLogIn(request);
                return new HttpStatusCodeResult(HttpStatusCode.OK);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpPost]
        public ActionResult EndTracking()
        {
            var actionResult = AssertTrackerOperational();
            if (actionResult != null)
            {
                return actionResult;
            }

            trackerProvider.CurrentTracker.EndVisit(true);
            Session.Abandon();
            return new HttpStatusCodeResult(HttpStatusCode.OK);
        }
    }
}