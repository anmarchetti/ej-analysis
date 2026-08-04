using System;
using System.Collections.Generic;
using System.Text;
using Newtonsoft.Json;

namespace easyJet.Feature.PushNotifications.Models.Domain
{
    /// <summary>
    /// Represents push subscription model.
    /// </summary>
    public class PushSubscription
    {
        /// <summary>
        /// Gets or sets subsctiption's endpoint.
        /// </summary>
        [JsonProperty("endpoint")]
        public string Endpoint { get; set; }

        /// <summary>
        /// Gets or sets subsctiption's keys.
        /// </summary>
        [JsonProperty("keys")]
        public Dictionary<string, string> Keys { get; set; }

        /// <summary>
        /// Gets or Sets Token for subsctiption.
        /// Using for support Safari push notifications.
        /// </summary>
        [JsonProperty("token")]
        public string Token { get; set; }

        public override string ToString()
        {
            StringBuilder sb = new StringBuilder();
            if (!string.IsNullOrEmpty(Endpoint))
            {
                sb.Append($"Endpoint: [{Endpoint}]{Environment.NewLine}");
            }

            if (!string.IsNullOrEmpty(Token))
            {
                sb.Append($"Token: {Token}{Environment.NewLine}");
            }

            return sb.ToString();
        }
    }
}