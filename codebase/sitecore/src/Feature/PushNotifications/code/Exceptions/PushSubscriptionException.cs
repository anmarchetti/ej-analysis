using System;

namespace easyJet.Feature.PushNotifications.Exceptions
{
    public class PushSubscriptionException : Exception
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="PushSubscriptionException"/> class.
        /// </summary>
        /// <param name="message">The error message that explains the reason for the exception.</param>
        /// <param name="endpoint">The Push subscription endpoint.</param>
        /// <param name="token">The Push subscription token.</param>
        /// <param name="contactId">The Contact ID.</param>
        public PushSubscriptionException(string message, string endpoint, string token, string contactId)
            : base(message)
        {
            Endpoint = endpoint;
            Token = token;
            ContactId = contactId;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="PushSubscriptionException"/> class.
        /// </summary>
        /// <param name="message">The error message that explains the reason for the exception.</param>
        /// <param name="endpoint">The Push subscription endpoint.</param>
        /// <param name="token">The Push subscription token.</param>
        /// <param name="contactId">The Contact ID.</param>
        /// <param name="innerException">The exception that is the cause of the current exception.</>
        public PushSubscriptionException(string message, string endpoint, string token, string contactId, Exception innerException)
            : base(message, innerException)
        {
            Endpoint = endpoint;
            Token = token;
            ContactId = contactId;
        }

        public string Endpoint { get; set; }

        public string Token { get; set; }

        public string ContactId { get; set; }
    }
}