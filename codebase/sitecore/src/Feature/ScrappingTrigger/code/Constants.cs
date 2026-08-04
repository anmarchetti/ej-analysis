using System.Diagnostics.CodeAnalysis;

namespace easyJet.Feature.ScrappingTrigger
{
    [ExcludeFromCodeCoverage]
    public struct Constants
    {
        public const string ScrapingTriggerSettingsPathName = "ScrapingTrigger.SettingsPath";
        public const string ScrapingTriggerSettingsQueueArn = "ScrapingTrigger.Queue.Arn";
        public const string ScrapingTriggerSettingsSupportedLanguage = "ScrapingTrigger.Filter.SupportedLanguage";
        public const string ScrapingTriggerSettingsSupportedRootPath = "ScrapingTrigger.Filter.SupportedRootPath";
        public const string ScrapingTriggerSettingsProfileArn = "ScrapingTrigger.Profile.Iam.Arn";
        public const string ScrapingTriggerSettingsSessionDuration = "ScrapingTrigger.Profile.SessionDuration";
        public const string ScrapingTriggerSettingsSessionName = "ScrapingTrigger.Profile.SessionName";
        public const string ScrapingTriggerEnabled = "ScrapingTrigger.Enabled";
        public const string ScrapingTriggerBaseUrl = "ScrapingTrigger.BaseUrl";
        public const string ScrapingTriggerMessagesPerBatch = "ScrapingTrigger.Sqs.MessagesPerBatch";

        public struct Fields
        {
            public const string ScrapingTriggerEnabledTemplates = "Enabled Templates";
            public const string ScrapingTriggerIsEnabled = "Is Enabled";
            public const string RedirectUrl = "RedirectUrl";
        }
    }
}