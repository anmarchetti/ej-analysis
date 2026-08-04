using System.Net;

namespace easyJet.Holidays.External.SmartSeer.Models
{
    public class SmartSeerException : Exception
    {
        /// <summary>
        /// Response status code
        /// </summary>
        public HttpStatusCode StatusCode;

        /// <summary>
        /// Response content
        /// </summary>
        public HttpContent Content;

        public SmartSeerException(HttpStatusCode code, HttpContent content, Exception ex) : base("Failed to fetch SmartSeer api", ex)
        {
            StatusCode = code;
            Content = content;
        }
    }
}
