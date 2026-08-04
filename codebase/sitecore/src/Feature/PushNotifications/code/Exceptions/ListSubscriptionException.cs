using System;

namespace easyJet.Feature.PushNotifications.Exceptions
{
    public class ListSubscriptionException : Exception
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="ListSubscriptionException"/> class.
        /// </summary>
        /// <param name="message">The error message that explains the reason for the exception.</param>
        public ListSubscriptionException(string message)
            : base(message)
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="ListSubscriptionException"/> class.
        /// </summary>
        /// <param name="message">The error message that explains the reason for the exception.</param>
        /// <param name="innerException">The exception that is the cause of the current exception.</>
        public ListSubscriptionException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}