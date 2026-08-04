namespace easyJet.Foundation.PushNotifications.Models.Requests
{
    /// <summary>
    /// Base class for 'request' model.
    /// Contains base methods and properties representing the request.
    /// </summary>
    public abstract class BaseRequest
    {
        /// <summary>
        /// Gets or sets data for post request.
        /// </summary>
        public object Data { get; set; }

        /// <summary>
        /// Gets request string.
        /// </summary>
        /// <returns>Request string.</returns>
        public abstract string GetRequestString();

        /// <summary>
        /// Gets query string.
        /// </summary>
        /// <returns>Query string.</returns>
        protected virtual string GetQueryString()
        {
            return string.Empty;
        }
    }
}