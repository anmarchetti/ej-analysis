using System;
using System.Linq;
using easyJet.Foundation.PushNotifications.Extensions;
using easyJet.Foundation.PushNotifications.Facets;
using easyJet.Foundation.PushNotifications.Models.Domain;
using easyJet.Foundation.PushNotifications.Services;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Sitecore.Xdb.MarketingAutomation.Core.Activity;
using Sitecore.Xdb.MarketingAutomation.Core.Processing.Plan;

namespace easyJet.Foundation.PushNotifications.Activities
{
    /// <summary>
    /// Marketing Automation activity type which sends push notification.
    /// </summary>
    public class PushNotification : IActivity
    {
        private const string LastVisitedHotelPlaceholder = "{lastVisitedHotel}";
        private const string LastBookedHotelPlaceholder = "{lastBookedHotel}";
        private const string RegionUrlPlaceholder = "{regionUrl}";
        private const string ResortUrlPlaceholder = "{resortUrl}";
        private const string CountryUrlPlaceholder = "{countryUrl}";

        public string Body { get; set; }

        public string Title { get; set; }

        public string Image { get; set; }

        public string Icon { get; set; }

        public string CTA { get; set; }

        public string CtaLabel { get; set; }

        public string UtmCampaing { get; set; }

        public string UtmContent { get; set; }

        public string MessageId { get; set; }

        public IActivityServices Services { get; set; }

        protected ILogger<IActivity> Logger { get; }

        private IPushNotificationService PushNotificationService { get; set; }

        private IUtmParamsService UtmParamsService { get; set; }

        public PushNotification(IUtmParamsService utmParamsService, IPushNotificationService pushNotificationService, ILogger<PushNotification> logger)
        {
            PushNotificationService = pushNotificationService;
            UtmParamsService = utmParamsService;
            Logger = logger;
        }

        /// <inheritdoc/>
        public ActivityResult Invoke(IContactProcessingContext context)
        {
            try
            {
                Logger.LogDebug($"[Push Notification] Start activity for contact {context.Contact?.Id}");
                var subscriptions = context.Contact?.GetFacet<PushSubscriptions>();

                if (subscriptions == null)
                {
                    Logger.LogDebug($"[Push Notification] There are no subscriptions facet for contact {context.Contact?.Id}.");
                    return new SuccessMove("default");
                }

                var notification = new NotificationMessage()
                {
                    Title = Title.TrimDoubleQuotes(),
                    Body = Body.TrimDoubleQuotes(),
                    Image = GetImage(context),
                    Icon = Icon.TrimDoubleQuotes(),
                    Data = BuildNotificationData(context)
                };

                Logger.LogDebug($"[Push Notification] Notification message: {JsonConvert.SerializeObject(notification)} for contact {context.Contact.Id}.");

                try
                {
                    var pushSubscriptions = subscriptions.Subscriptions.Select(x => x.Value).ToList();

                    PushNotificationService.SendNotification(pushSubscriptions, notification);
                }
                catch (Exception ex)
                {
                    Logger.LogError(ex, $"Failed to send Push Notification {ex.Message}");
                }

                Logger.LogDebug($"[Push Notification] End activity for contact {context.Contact.Id}.");

                return new SuccessMove("default");
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, $"Failed sending notifications: {ex.Message} for contact {context?.Contact?.Id}");
                return new SuccessMove("default");
            }
        }

        /// <summary>
        /// Build notification message data model from <see cref="TrackingData"/> facet.
        /// If <see cref="TrackingData.Endpoint"/> is empty, gets fallback CTA from Activity parameter.
        /// </summary>
        /// <param name="context">Contact context.</param>
        /// <returns>Notification data.</returns>
        private NotificationMessageData BuildNotificationData(IContactProcessingContext context)
        {
            var trackingData = context.Contact.GetFacet<TrackingData>();

            var data = new NotificationMessageData()
            {
                Url = BuildCTA(trackingData),
                AccommodationCode = trackingData?.AccommodationId,
                ContactId = context.Contact?.Id.ToString(),
                CtaLabel = CtaLabel.TrimDoubleQuotes()
            };

            return data;
        }

        /// <summary>
        /// Build CTA link.
        /// If the CTA link has <see cref="LastVisitedHotelPlaceholder"/> placeholder, the CTA link will be taken from <see cref="TrackingData.Endpoint"/> facet.
        /// Otherwise the CTA link data will be taken from the marketing automation field.
        /// </summary>
        /// <param name="trackingData">Tacking data facet.</param>
        /// <returns>CTA link.</returns>
        private string BuildCTA(TrackingData trackingData)
        {
            var url = CTA.TrimDoubleQuotes();

            if (string.IsNullOrWhiteSpace(url) || (string.IsNullOrWhiteSpace(trackingData?.Endpoint) && url.Contains(LastVisitedHotelPlaceholder)))
            {
                return string.Empty;
            }

            if (url.Contains(CountryUrlPlaceholder) || url.Contains(RegionUrlPlaceholder) || url.Contains(ResortUrlPlaceholder))
            {
                return UtmParamsService.SetUtmParamsForTokenizedUrl(url, UtmContent.TrimDoubleQuotes(), UtmCampaing.TrimDoubleQuotes());
            }

            if (url.Contains(LastVisitedHotelPlaceholder))
            {
                url = trackingData?.Endpoint;
            }

            return UtmParamsService.SetUtmParams(url, UtmContent.TrimDoubleQuotes(), UtmCampaing.TrimDoubleQuotes());
        }

        /// <summary>
        /// Gets image url or replace placeholder with one correct one.
        /// </summary>
        /// <param name="context">Contact context.</param>
        /// <returns>Image urlg</returns>
        private string GetImage(IContactProcessingContext context)
        {
            if (Image == null)
            {
                return string.Empty;
            }

            if (!Image.Contains(LastBookedHotelPlaceholder))
            {
                return Image.TrimDoubleQuotes();
            }

            var bookingData = context.Contact.GetFacet<PushNotificationBooking>(PushNotificationBooking.DefaultFacetKey);
            return bookingData?.Image == null ? string.Empty : bookingData.Image.TrimDoubleQuotes();
        }
    }
}