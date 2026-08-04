using System;
using System.Net;
using System.Web.Mvc;
using easyJet.Feature.PushNotifications.Logging;
using easyJet.Feature.PushNotifications.Mappers;
using easyJet.Feature.PushNotifications.Models.Requests;
using easyJet.Feature.PushNotifications.Services;
using easyJet.Foundation.Analytics.Controllers;
using easyJet.Foundation.Analytics.Services;

namespace easyJet.Feature.PushNotifications.Controllers
{
    /// <summary>
    /// Push notification controller
    /// Contains enpoints for performing push notifications.
    /// </summary>
    public class PushNotificationsController : BaseAnalyticsController
    {
        private readonly IPushSubscriptionService pushSubscriptionService;
        private readonly IListSubscriptionService listSubscriptionService;

        public PushNotificationsController(
            ITrackerProvider trackerProviderService,
            IPushSubscriptionService pushSubscriptionService,
            IListSubscriptionService listSubscriptionService,
            IPushNotificationsLogger logger)
            : base(logger, trackerProviderService)
        {
            this.pushSubscriptionService = pushSubscriptionService;
            this.listSubscriptionService = listSubscriptionService;
        }

        /// <summary>
        /// Save subscription and trigger nedeed Sitecore Goal.
        /// </summary>
        /// <param name="request">Subscriptions with goal ID.</param>
        /// <returns>Http Status OK.</returns>
        [HttpPost]
        public ActionResult Subscribe(SubscriptionRequest request)
        {
            var actionResult = AssertTrackerOperational();
            if (actionResult != null)
            {
                return actionResult;
            }

            if (request?.Subscription == null)
            {
                var msg = $"{nameof(request.Subscription)} can not be null";
                Logger.Warn(msg, this);
                throw new ArgumentNullException(msg);
            }

            Logger.Debug($"DeviceProfileId: [{TrackerProvider.CurrentTracker.Contact.ContactId}] trying subscribe to push notification. [{request.Subscription}]", this);

            // Save subscription
            pushSubscriptionService.Update(TrackerProvider.CurrentTracker.Interaction.DeviceId, FacetMapper.MapFromPushSubscriptionRequest(request.Subscription));

            Logger.Info(
                $"DeviceProfileId: [{TrackerProvider.CurrentTracker.Contact.ContactId}] successfully subscribed to push notification. " +
                $"Subscription: {request.Subscription}", this);

            return new HttpStatusCodeResult(HttpStatusCode.OK);
        }

        /// <summary>
        /// Unsubscribe from Push Notification.
        /// </summary>
        /// <param name="request">Subscriptions with contact id.</param>
        /// <returns>Http Status OK.</returns>
        [HttpPost]
        public ActionResult Unsubscribe(UnsubscriptionRequest request)
        {
            var actionResult = AssertTrackerOperational();
            if (actionResult != null)
            {
                return actionResult;
            }

            if (request?.Subscription == null)
            {
                var msg = $"{nameof(request.Subscription)} can not be null";
                Logger.Warn(msg, this);
                throw new ArgumentNullException(msg);
            }

            Guid.TryParse(request.ContactId, out Guid contactId);

            pushSubscriptionService.Remove(contactId, FacetMapper.MapFromPushSubscriptionRequest(request.Subscription));
            listSubscriptionService.Unsubscribe(contactId);

            return new HttpStatusCodeResult(HttpStatusCode.OK);
        }

        /// <summary>
        /// Unsubscribe from Push Notification.
        /// </summary>
        /// <param name="token">Safari token.</param>
        /// <returns>Http Status OK.</returns>
        [HttpPost]
        public ActionResult SafariUnsubscribe(string token)
        {
            if (string.IsNullOrEmpty(token))
            {
                var msg = $"{nameof(token)} can not be null";
                Logger.Warn(msg, this);
                throw new ArgumentNullException(msg);
            }

            var searchResult = pushSubscriptionService.Search(token);

            if (searchResult.Keys.Count == 0)
            {
                return HttpNotFound($"Can not find contact with token: [{token}]");
            }

            pushSubscriptionService.Remove(searchResult);

            listSubscriptionService.Unsubscribe(searchResult.Keys);

            return new HttpStatusCodeResult(HttpStatusCode.OK);
        }
    }
}