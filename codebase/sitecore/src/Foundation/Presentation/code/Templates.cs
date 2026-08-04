using Sitecore.Data;

namespace easyJet.Foundation.Presentation
{
    public struct Templates
    {
        public struct Presentation
        {
            public static readonly ID Id = new ID("{65573CA8-AA0A-45F1-84BA-3F116D06A2E4}");
        }

        public struct PageDesignsFolder
        {
            public static readonly ID Id = new ID("{01F86519-E213-4658-9752-1A077D310E03}");
        }

        public struct PageDesign
        {
            public static readonly ID Id = new ID("{4B960AA8-24C3-4A4E-A27F-F4718D189EF6}");

            public struct Fields
            {
                public const string PartialDesigns = "PartialDesigns";
                public const string PageTemplates = "PageTemplates";
                public const string ExperienceContextProviders = "ExperienceContextProviders";
                public const string RootItem = "RootItem";
                public static readonly ID RootItemFieldId = new ID("{5C14F963-513D-4806-B5CF-3A971CB44638}");
            }
        }

        public struct PartialDesign
        {
            public static readonly ID Id = new ID("{7C12F137-9A9F-40B6-96A8-4F37F8CBC632}");

            public struct Fields
            {
                public const string BasePartialDesign = "BasePartialDesign";
            }
        }

        public struct HotelDesignsFolder
        {
            public static readonly ID Id = new ID("{6C3BE833-C6AB-4DD7-ACD0-C161EA267F44}");
        }

        public struct HotelThemeDesign
        {
            public static readonly ID Id = new ID("{DC4CDB71-135F-42FB-8FE3-FB4890A17491}");

            public struct Fields
            {
                public const string Theme = "Theme";
            }
        }

        public struct HotelDesign
        {
            public static readonly ID Id = new ID("{47DA800A-71A9-40D7-8C79-56721BD1C665}");

            public struct Fields
            {
                public const string Hotels = "Hotels";
            }
        }

        public struct TradeHotelDesign
        {
            public static readonly ID Id = new ID("{b05ac1d3-0002-4c9f-adff-84627c4f5a06}");

            public struct Fields
            {
                public const string Hotels = "Hotels";
            }
        }

        public struct HotelDetailsPage
        {
            public static readonly ID Id = new ID("{757936EF-C946-447F-9E37-90140EE1D938}");
        }

        public struct TradePortalHotelDetailsPage
        {
            public static readonly ID Id = new ID("{2B3E79FB-A982-417B-AE47-8754E986D3DE}");
        }

        public struct MultivatiantPageDesignFolder
        {
            public static readonly ID Id = new ID("{747283AC-92A9-4F61-A668-837175CB6982}");
        }

        public struct MultivatiantPageDesign
        {
            public static readonly ID Id = new ID("{E361C02E-7348-4C65-BA6B-FA9086FD8661}");

            public struct Fields
            {
                public const string PageTemplates = "PageTemplates";
            }
        }

        public struct HideRendering
        {
            public static readonly ID Id = new ID("{EC254E18-5F91-437B-B11B-14D349E8ED11}");

            public struct Fields
            {
                public const string Renderings = "Renderings";
            }
        }
    }
}