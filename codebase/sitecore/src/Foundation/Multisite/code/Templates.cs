using Sitecore.Data;

namespace easyJet.Foundation.Multisite
{
    public static class Templates
    {
        public struct PublishDiagnostic
        {
            public static readonly ID Id = new ID("{2AAB567B-9A66-4063-99B9-5902E705F45F}");

            public struct Fields
            {
                public const string Field = "Field";
                public const string SharedField = "Shared Field";
                public const string SharedUnversionedField = "Shared Unversioned Field";
                public const string UnversionedField = "Unversioned Field";
            }
        }

        public struct Tenant
        {
            public static readonly ID Id = ID.Parse("{C21E2C41-F74D-452C-8B09-7FF1D522E512}");
        }

        public struct Site
        {
            public static readonly ID Id = ID.Parse("{836C6200-091F-4BD3-9B0A-007C9AE39231}");
        }

        public struct Home
        {
            public static readonly ID Id = ID.Parse("{4BA97791-87BA-4DB3-A5B8-3E7D4A9C55D5}");
        }

        public struct Data
        {
            public static readonly ID Id = ID.Parse("{81BF68AE-91FD-4535-9D77-989773789AB6}");
        }

        public struct Media
        {
            public static readonly ID Id = ID.Parse("{F2FC8AB6-E14C-4EDC-8E11-469425C5E0FC}");
        }

        public struct Settings
        {
            public static readonly ID Id = ID.Parse("{38B64494-C7F8-4D9E-B375-55EE30904F53}");

            public struct Fields
            {
                public const string ItemNotFoundPage = "Item Not Found Page";
            }
        }

        public struct Presentation
        {
            public static readonly ID Id = ID.Parse("{93163EE8-F2E0-4FA3-97D8-74682EF76982}");
        }

        public struct IndexRebuildSchedule
        {
            public static readonly ID Id = ID.Parse("{84050120-F77E-432C-9311-740E8C6BB850}");
        }

        public struct BasePage
        {
            public static readonly ID ID = ID.Parse("{168F65DC-9ECD-4A6E-AD93-A46464E45F79}");

            public struct Fields
            {
                public static readonly ID OriginalItem = ID.Parse("{21A6A8C6-7EAF-4662-804A-3623DB484CA4}");
            }
        }

        public struct SharedSitesSettings
        {
            public static readonly ID ID = ID.Parse("{A337C599-0872-42A5-8423-D9EA028406AE}");

            public struct Fields
            {
                public static ID DelegatedAreas { get; } = new ID("{86CAD11F-C68A-41D0-BE2E-883BD369558D}");
            }
        }

        public struct DestinationPages
        {
            public const string Country = "{5F03C6EF-EF52-4F2E-BC5A-B1F065A1E745}";
            public const string VirtualRegion = "{799ECB20-C605-4A6C-A32B-27222BDBB91E}";
            public const string Region = "{2F42EC14-7E56-467A-B300-AB9723C74546}";
            public const string RegionCity = "{33B3542E-1316-40CA-8971-1CDB3C1D452D}";
            public const string Resort = "{538939B3-07EC-4C23-BF8C-3A68DE0FDC93}";
            public const string Hotel = "{28E5E169-8F72-4F90-A277-280A8302B607}";
        }

        public struct MarketSettings
        {
            public static readonly ID Id = ID.Parse("{575F1DD2-A3FD-4322-8D65-D6B5DBC1668F}");

            public struct Fields
            {
                public const string Market = "Market";
            }
        }

        public struct Market
        {
            public static readonly ID Id = ID.Parse("{F9653205-D2BA-441F-A0EF-526068CA493B}");

            public struct Fields
            {
                public const string Code = "Code";
                public const string CountryCode = "CountryCode";
                public const string Currency = "Currency";
                public const string DepartureAirports = "DepartureAirports";
                public const string DepartureAirportCode = "Code";
                public const string DefaultDepositPrice = "DefaultDepositPrice";
            }
        }
    }
}
