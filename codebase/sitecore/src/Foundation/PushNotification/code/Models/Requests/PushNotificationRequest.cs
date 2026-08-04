namespace easyJet.Foundation.PushNotifications.Models.Requests
{
    /// <summary>
    /// Repsresents model of push notification request.
    /// </summary>
    public class PushNotificationRequest : BaseRequest
    {
        /// <inheritdoc/>
        public override string GetRequestString()
        {
            return "/send";
        }
    }
}