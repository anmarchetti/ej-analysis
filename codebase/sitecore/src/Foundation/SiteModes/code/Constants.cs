using Sitecore.Data;

namespace easyJet.Foundation.SiteModes
{
    public class Constants
    {
        public const string RequestBeginArgsKey = "RequestBeginArgs";

        public struct Common
        {
            public const string CheckboxTrueValue = "1";
            public const string CheckboxFalseValue = "0";
        }

        public struct TemplateIds
        {
            public static readonly ID NoMarketingModeSettings = new ID("{7C81F9E5-B208-41C2-85EE-0455F8F99381}");
            public static readonly ID GlobalMaintenanceMode = new ID("{C0DD1FCB-D677-4E93-B7C0-8F36B5A882A0}");
        }

        public struct Fields
        {
            public class NoMarketingModeSettings
            {
                public const string Title = "Title";
                public const string SelectingLanguageTitle = "SelectingLanguageTitle";
                public const string SelectingLanguageDescription = "SelectingLanguageDescription";
                public const string NoMarketingModeIsSet = "NoMarketingModeIsSet";
                public const string StagingButtonText = "StagingButtonText";
                public const string ConfirmChangesCheckBoxText = "ConfirmChangesCheckBoxText";
                public const string PublishToLiveButtonText = "PublishToLiveButtonText";
                public const string StagingTitle = "StagingTitle";
                public const string StagingDescription = "StagingDescription";
                public const string LiveTitle = "LiveTitle";
                public const string LiveDescription = "LiveDescription";
                public const string SelectedLanguagesStatusText = "SelectedLanguagesStatusText";
            }

            public struct MaintenanceModeSettings
            {
                public const string SoftFrom = "SoftFrom";
                public const string SoftTo = "SoftTo";
                public const string FullFrom = "FullFrom";
                public const string FullTo = "FullTo";
                public const string Market = "Market";
            }

            public struct Market
            {
                public const string Code = "Code";
            }
        }
    }
}