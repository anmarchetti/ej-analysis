using System.Diagnostics.CodeAnalysis;
using Sitecore.Data;

namespace easyJet.Foundation.SitecoreExtensions
{
    [ExcludeFromCodeCoverage]
    public class Constants
    {
        public const string JobFailedIdentifier = "JobFailed";
        public const string CacheExpiredInMinutesSettingName = "easyJet.SimpleCacheExpiredInMinutes";
        public const string EnvironmentHintEnvironmentNameSettingsName = "EnvironmentHint.EnvironmentName";

        public struct UserName
        {
            public static readonly string Anonymous = "Anonymous";
        }

        public struct TemplateIds
        {
            public static readonly ID BaseObjectTemplate = new ID("{EE53D1AE-11DA-4003-B4A5-B64A611C6D84}");
            public static readonly TemplateID BasePageTemplate = new TemplateID(new ID("{168F65DC-9ECD-4A6E-AD93-A46464E45F79}"));
        }

        public struct Common
        {
            public const string CheckboxTrueValue = "1";
            public const string CheckboxFalseValue = "0";
        }

        public struct ContentTypes
        {
            public const string ExcelResponse = "application/vnd.ms-excel";
        }

        public struct DialogSettings
        {
            public const int KeepDialogOpenForMilliSeconds = 7000;
            public const int KeepDialogOpenForMilliSecondsOnError = 100000;
        }

        public struct Fields
        {
            public struct Common
            {
                public const string WorkflowState = "__Workflow state";
                public const string OriginalItem = "__OriginalItem";
            }
        }

        public struct QueryStringParams
        {
            public const string ItemId = "id";
            public const string Endpoint = "endpoint";
            public const string DataBase = "database";
            public const string Language = "lang";
            public const string Value = "value";
            public const string ContainerId = "containerId";
            public const string FieldId = "fieldId";
        }

        public struct FocalPoint
        {
            public struct Attributes
            {
                public const string MediaId = "mediaid";
                public const string DesktopFocalX = "dfx";
                public const string DesktopFocalY = "dfy";
                public const string MoblieFocalX = "mfx";
                public const string MobileFocalY = "mfy";
                public const string OnFocus = "onfocus";
            }
        }

        public struct JobStatuses
        {
            public const string InProgress = "In progress";
            public const string Success = "Success";
            public const string Failed = "Fail";
        }

        public struct Databases
        {
            public const string Master = "master";
        }

        public struct Index
        {
            public const string CoreIndex = "sitecore_core_index";
            public const string MasterIndex = "sitecore_master_index";
            public const string WebIndex = "sitecore_web_index";
            public const string MarketingDefinitionsMasterIndex = "sitecore_marketingdefinitions_master";
            public const string MarketingDefinitionsWebIndex = "sitecore_marketingdefinitions_web";
            public const string MarketingAssetMasterIndex = "sitecore_marketing_asset_index_master";
            public const string MarketingAssetWebIndex = "sitecore_marketing_asset_index_web";
            public const string TestingIndex = "sitecore_testing_index";
            public const string SuggestedTestIndex = "sitecore_suggested_test_index";
            public const string PersonalizationIndex = "sitecore_personalization_index";
            public const string FxmMasterIndex = "sitecore_fxm_master_index";
            public const string FxmWebIndex = "sitecore_fxm_web_index";
            public const string DestinationsMasterIndex = "sitecore_destinations_master_index";
            public const string DestinationsWebIndex = "sitecore_destinations_web_index";
            public const string PublishingIndex = "sitecore_publishing_index";
            public const string TransferInfoMasterIndex = "sitecore_transferinfo_master_index";
            public const string TransferInfoWebIndex = "sitecore_transferinfo_web_index";
            public const string PromotionsMasterIndex = "sitecore_promotions_master_index";
            public const string PromotionsWebIndex = "sitecore_promotions_web_index";
            public const string ArticlesMasterIndex = "sitecore_articles_master_index";
            public const string ArticlesWebIndex = "sitecore_articles_web_index";
        }
    }
}