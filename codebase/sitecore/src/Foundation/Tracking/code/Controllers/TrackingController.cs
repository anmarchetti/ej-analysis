using System;
using System.Linq;
using System.Net;
using System.Web.Mvc;
using easyJet.Foundation.Analytics.Controllers;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.SitecoreExtensions.Attributes;
using easyJet.Foundation.Tracking.Logging;
using easyJet.Foundation.Tracking.Models.Requests;
using easyJet.Foundation.Tracking.Services;
using Newtonsoft.Json;
using Sitecore.Analytics;

namespace easyJet.Foundation.Tracking.Controllers
{
    public class TrackingController : BaseAnalyticsController
    {
        private readonly ITrackingDataService trackingUrlService;
        private readonly IUserSearchInteractionService userSearchInteractionService;
        private readonly IUserSearchProfileService userSearchProfileService;

        public TrackingController(
            ITrackerProvider trackerProviderService,
            IUserSearchInteractionService userSearchInteractionService,
            IUserSearchProfileService userSearchProfileService,
            ITrackingDataService trackingUrlService,
            ITrackingLogger logger)
            : base(logger, trackerProviderService)
        {
            this.userSearchInteractionService = userSearchInteractionService;
            this.userSearchProfileService = userSearchProfileService;
            this.trackingUrlService = trackingUrlService;
        }

        /// <summary>
        /// Track hotel data.
        /// </summary>
        /// <param name="request">Tracking data.</param>
        /// <returns>Http Status OK.</returns>
        [ActionName("hotel-data")]
        [HttpPost]
        public ActionResult TrackHotelData(TrackingHotelDataRequest request)
        {
            var actionResult = AssertTrackerOperational();
            if (actionResult != null)
            {
                return actionResult;
            }

            if (string.IsNullOrEmpty(request.Url))
            {
                var msg = $"Argument {nameof(request.Url)} can not be empty or null";
                Logger.Warn(msg, this);
                throw new ArgumentNullException(msg);
            }

            if (string.IsNullOrEmpty(request.AccId))
            {
                var msg = $"Argument {nameof(request.AccId)} can not be empty or null";
                Logger.Warn(msg, this);
                throw new ArgumentNullException(msg);
            }

            trackingUrlService.Update(request);

            Logger.Debug(
                $"DeviceProfileId: {TrackerProvider?.CurrentTracker?.Contact?.ContactId} interaction tracked. " +
                $"Url: {request.Url}, Code: {request.AccId}", this);

            return new HttpStatusCodeResult(HttpStatusCode.OK);
        }

        /// <summary>
        /// Track user search.
        /// </summary>
        /// <param name="request">User search data.</param>
        /// <returns>Http Status OK.</returns>
        [LogExecutionTime]
        [ActionName("user-search")]
        [HttpPost]
        public ActionResult TrackUserSearch(UserSearchRequest request)
        {
            var actionResult = AssertTrackerOperational();
            if (actionResult != null)
            {
                return actionResult;
            }

            if (request.From == null || !request.From.Any() || request.To == null || !request.To.Any())
            {
                throw new ArgumentNullException($"{nameof(request.From)} or {nameof(request.To)} cannot be null or empty.");
            }

            userSearchInteractionService.Add(request);

            userSearchProfileService.BoostDurationProfileValueByDays(request.StartDate, request.EndDate);

            Logger.Debug(
                $"User search interaction was added for contact [DeviceProfileId: {Tracker.Current?.Contact?.ContactId}]. " +
                $"User Search Request: {JsonConvert.SerializeObject(request)}", this);

            return new HttpStatusCodeResult(HttpStatusCode.OK);
        }

        /// <summary>
        /// Track Booking data.
        /// </summary>
        /// <param name="request">Recent booking data.</param>
        /// <returns>Http Status OK.</returns>
        [ActionName("booking-data")]
        [HttpPost]
        public ActionResult TrackRecentBooking(PushNotificationBookingRequest request)
        {
            var actionResult = AssertTrackerOperational();
            if (actionResult != null)
            {
                return actionResult;
            }

            if (request.Image == null || request.AccommodationId == null)
            {
                throw new ArgumentNullException(nameof(request), "Image and AccommodationId cannot be null.");
            }

            trackingUrlService.UpdateBooking(request);

            Logger.Debug(
                $"Booking Data was added for contact [DeviceProfileId: {Tracker.Current?.Contact?.ContactId}]. " +
                $"Booking Request: {JsonConvert.SerializeObject(request)}", this);

            return new HttpStatusCodeResult(HttpStatusCode.OK);
        }
    }
}