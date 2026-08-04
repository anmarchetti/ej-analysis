using Sitecore.Configuration;
using Sitecore.Data;

namespace easyJet.Foundation.Multisite
{
    public struct Constants
    {
        public struct TemplateIds
        {
            public static readonly ID SitemapSetting = ID.Parse("{F579182D-33F1-4045-BA15-A05D87D6AAA3}");
            public static ID SitemapBase = new ID("{980C1B75-FFCD-4E92-9788-1CDB4687DD55}");
            public static ID NotFoundPage = new ID("{AE0776FB-F0AE-4FA8-8ABA-676AE82CC6CF}");
        }

        public struct Fields
        {
            public struct SitecoreProperty
            {
                public const string Value = "Value";
            }

            public struct BaseSetting
            {
                public const string IsPublic = "IsPublic";
                public const string AutoTranslate = "AutoTranslate";
                public const string SkipTranslate = "SkipTranslate";
                public const string LanguagesWithDisabledFallback = "LanguagesWithDisabledFallback";
            }

            public struct SitemapBlock
            {
                public const string Sections = "Sections";
            }

            public struct SitemapBase
            {
                public const string ChangeFrequency = "ChangeFrequency";
                public const string Priority = "Priority";
                public const string PageTemplates = "PageTemplates";
                public const string Pages = "Pages";
                public const string Roots = "Roots";
                public const string Title = "Title";
                public const string IsGroupedAlphabetically = "IsGroupedAlphabetically";
                public const string IsSorted = "IsSorted";
            }

            public struct BasePdf
            {
                public const string NoIndex = "NoIndex";
            }

            public struct BasePage
            {
                public const string Robots = "Robots";
                public const string CanonicalUrl = "CanonicalUrl";
                public const string RedirectUrl = "RedirectUrl";
                public const string Name = "Name";
                public const string Title = "PageTitle";
            }

            public struct DatasourceItem
            {
                public const string Name = "Name";
            }

            public class IndexRebuildSchedule
            {
                public const string IndexName = "IndexName";
            }

            public struct PromoCacheBustingSetting
            {
                public const string QueryValue = "QueryValue";
            }

            public struct SitemapSetting
            {
                public const string PageTemplatesExclude = "PageTemplatesExclude";
            }
        }

        public struct SitemapTypeKeys
        {
            public const string Countries = "countries";
            public const string Regions = "regions";
            public const string Resorts = "resorts";
            public const string Hotels = "hotels";
        }

        public struct WorkflowsStateIds
        {
            public static readonly ID DestinationsWorkflowApprovedId = new ID("{A47E8B4F-A0EE-40F2-B1A1-B3CE91C0F79A}");
            public static readonly ID DestinationsWorkflowScheduledId = new ID("{0A3F74B4-1671-404D-ACFA-284B23327E69}");
        }
    }
}
