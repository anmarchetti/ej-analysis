using System.Collections.Generic;
using Sitecore.Data;
using Sitecore.Globalization;

namespace easyJet.Feature.ScrappingTrigger.Settings
{
    public class ScrapingTriggerSettings
    {
        public HashSet<ID> Templates { get; set; } = new HashSet<ID>();

        public Language SupportedLanguage { get; set; }

        public string SupportedRootPath { get; set; }

        public bool IsEnabled { get; set; }

        public string QueueArn { get; set; }

        public string ProfileArn { get; set; }

        public int SessionDuration { get; set; }

        public string SessionName { get; set; }

        public string VpcEndpoint { get; set; }

        public string BaseUrl { get; set; }

        public int MessagesPerBatch { get; set; }
    }
}