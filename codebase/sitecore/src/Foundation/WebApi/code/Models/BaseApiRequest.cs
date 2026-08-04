using System;
using System.Collections.Generic;
using System.IO;
using Sitecore;
using Sitecore.Configuration;

namespace easyJet.Foundation.WebApi.Models
{
    public class BaseApiRequest
    {
        public Dictionary<string, string> Headers { get; set; } = new Dictionary<string, string>();

        public string Endpoint { get; set; }

        public string Host { get; private set; }

        public string ApiVersion { get; private set; }

        /// <summary>
        /// Gets or sets data for post request.
        /// </summary>
        public object Data { get; set; }

        public BaseApiRequest()
        {
            Host = Settings.GetSetting("WebApi.Host");
            ApiVersion = Settings.GetSetting("WebApi.ApiVersion");
        }

        public virtual string GetQueryString()
        {
            var host = StringUtil.EnsurePostfix('/', Host);
            var endpoint = StringUtil.EnsurePrefix('/', Endpoint);
            return $"{host}v{ApiVersion}{endpoint}";
        }
    }
}