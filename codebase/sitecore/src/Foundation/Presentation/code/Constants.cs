using Sitecore.Data;

namespace easyJet.Foundation.Presentation
{
    public class Constants
    {
        public const string RequestBeginArgsKey = "RequestBeginArgs";
        public const string PageDesignArgsKey = "PageDesignArgs";

        public struct QueryStringParams
        {
            public const string AccommadationId = "accId";
            public const string Theme = "theme";

            public const string ExperienceContextProvider = "ecp";
        }

        public struct Fields
        {
            public class RulesSettings
            {
                public const string Rules = "Rules";
            }

            public class BaseName
            {
                public const string Name = "Name";
            }

            public class BaseTrackingPageTitle
            {
                public const string TrackingPageTitle = "TrackingPageTitle";
            }

            public struct ExperienceContextProvider
            {
                public static readonly ID Identifier = ID.Parse("{B1F79CD9-9058-4AD3-8672-F7AC6FC43B79}");
                public static readonly ID Pages = ID.Parse("{8FE907E6-78B2-4AB8-B90C-C6E23DFE3C2A}");
            }

            public struct ExperienceContextProviderPage
            {
                public static readonly ID Page = ID.Parse("{43E82C89-5954-4B53-ABBC-D10B6D42D2F5}");
                public static readonly ID AllowedRenderings = ID.Parse("{5D3FBCC2-C6CE-4B65-8ABC-C4E41362A061}");
                public static readonly ID RenderingReplacements = ID.Parse("{69AC173C-FB60-4919-9AB7-D20AC497FC3A}");
            }

            public struct ExperienceContextProviderPageTemplate
            {
                public static readonly ID PageTemplate = ID.Parse("{6A9D0E1F-2A3B-44C5-AD6E-8A9B0C1D2E3F}");
                public static readonly ID AllowedRenderings = ID.Parse("{7B0E1F2A-3B4C-45D6-BE7F-9B0C1D2E3F4A}");
                public static readonly ID RenderingReplacements = ID.Parse("{8C1F2A3B-4C5D-46E7-8F8A-AB0C1D2E3F4A}");
            }

            public struct PageDesign
            {
                public const string PageTemplates = "PageTemplates";
                public const string ExperienceContextProviders = "ExperienceContextProviders";
                public static readonly ID PageTemplatesFieldId = ID.Parse("{F2DD7720-4A36-4B71-BD63-E3503415A11E}");

                public static readonly ID PartialDesignsFieldId = ID.Parse("{193A4C4F-3A13-45E4-AFF2-8AD81DE9B8CF}");
            }

            public struct ExperienceContextProvidersSettings
            {
                public static readonly ID EnableVerboseLogging = ID.Parse("{7F6F1650-A3D3-4F13-B45E-6A078F47749D}");
            }

            public struct ExperienceContextProviders
            {
                public static readonly ID ActiveProviders = ID.Parse("{7EF81129-9848-4F9B-979E-6B891FE8BFB1}");
            }
        }

        public struct ItemIds
        {
            public static readonly ID PageDesignsRoot = ID.Parse("{94573D5F-27B1-4681-B8BE-7C69B377DE47}");
            public static readonly ID ExperienceContextProvidersSettingsRoot = ID.Parse("{44A160C2-FDCE-4C39-B815-9815B121F4CB}");
        }

        public struct Workflows
        {
            public const string AnalyticsTestingId = "{2BAE793F-7392-4790-9E67-9C60B6BF7D7B}";
        }

        public struct TemplateIds
        {
            public static readonly ID BasePage = new ID("{168F65DC-9ECD-4A6E-AD93-A46464E45F79}");
            public static readonly ID ExperienceContextProviders = new ID("{5FC1338B-43B4-4196-815B-C777CFC496B3}");
            public static readonly ID ExperienceContextProvider = new ID("{CED83C22-67A3-40AE-AE32-2D1C587BFD14}");
            public static readonly ID ExperienceContextProviderPage = new ID("{800F3F0B-79B3-4AE8-A0EE-981DB968FE4D}");
            public static readonly ID ExperienceContextProviderPageTemplate = new ID("{4E7B8C9D-0E1F-4A3B-8C5D-6E7F8A9B0C1D}");
            public static readonly ID PageDesign = new ID("{4B960AA8-24C3-4A4E-A27F-F4718D189EF6}");
        }
    }
}
