using System;
using System.Collections.Generic;
using System.Web;

namespace easyJet.Foundation.WebApi.Exceptions
{
    /// <summary>
    /// Base BaseWebApiException which recived from web api side.
    /// </summary>
    public class BaseWebApiException
    {
        /// <summary>
        /// Gets or sets error.
        /// </summary>
        public string Error { get; set; }

        /// <summary>
        /// Gets or sets code.
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Gets or sets correlation id.
        /// </summary>
        public string CorrelationId { get; set; }

        /// <summary>
        /// Gets or sets additional data.
        /// </summary>
        public string AdditionalData { get; set; }

        /// <summary>
        /// Gets or sets inner errors.
        /// </summary>
        public string InnerErrors { get; set; }

        /// <summary>
        /// Gets or sets stack trace.
        /// </summary>
        public string StackTrace { get; set; }
    }
}