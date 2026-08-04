using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using easyJet.Foundation.PushNotifications.Models.Domain;
using easyJet.Foundation.PushNotifications.Models.Options;
using easyJet.Foundation.PushNotifications.Models.Requests;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Sitecore.Framework.Conditions;

namespace easyJet.Foundation.PushNotifications.Services
{
    /// <summary>
    /// Push notification service contains method which sends notifications to remote server.
    /// </summary>
    public class PushNotificationService : IPushNotificationService
    {
        protected ILogger<PushNotificationService> Logger { get; }

        protected string Endpoint { get; set; }

        public PushNotificationService(IConfiguration configuration, ILogger<PushNotificationService> logger)
        {
            Condition.Requires(logger, nameof(logger)).IsNotNull();
            Condition.Requires(configuration, nameof(configuration)).IsNotNull();
            BindPropertiesFromOptions(configuration.As<PushNotificationServiceOptions>());

            Logger = logger;
        }

        /// <inheritdoc/>
        public void SendNotification(List<Facets.PushSubscription> subscriptions, NotificationMessage message)
        {
            var request = new PushNotificationRequest()
            {
                Data = new PushNotificationData()
                {
                    Subscriptions = subscriptions.Select(x => new PushSubscription()
                    {
                        Endpoint = x.Endpoint,
                        Keys = x.Keys,
                        Token = x.Token
                    }).ToList(),
                    Message = message
                }
            };

            Post(request);
        }

        /// <summary>
        /// Send post request.
        /// </summary>
        /// <typeparam name="TRequest">Type of reqeust derrived from <see cref="BaseRequest"/>.</typeparam>
        /// <param name="request">Request.</param>
        protected void Post<TRequest>(TRequest request)
            where TRequest : BaseRequest
        {
            try
            {
                var requestString = request.GetRequestString();

                using (var client = GetWebClient())
                {
                    var fullRequestString = $"{Endpoint}{requestString}";
                    Logger.LogInformation($"[PushNotificationService] Request: {fullRequestString}"); // TODO: Change to debug level

                    string body = request.Data != null ? JsonConvert.SerializeObject(request.Data) : string.Empty;
                    Logger.LogInformation($"[PushNotificationService] Request body: {body}"); // TODO: Change to debug level

                    var responseString = client.UploadString(fullRequestString, body);

                    Logger.LogInformation($"[PushNotificationService] Response: {responseString}"); // TODO: Change to debug level
                }
            }
            catch (WebException exc)
            {
                Logger.LogError(exc, $"Unable to send push notification: {exc.Message}");
            }
        }

        /// <summary>
        /// Get intance of web client.
        /// </summary>
        /// <returns>Web client instance.</returns>
        protected WebClient GetWebClient()
        {
            var client = new WebClient
            {
                Encoding = Encoding.UTF8
            };

            client.Headers.Add("content-type", "application/json");

            return client;
        }

        private void BindPropertiesFromOptions(PushNotificationServiceOptions options)
        {
            Condition.Requires(options, nameof(options)).IsNotNull();
            Endpoint = options.Endpoint;
        }
    }
}