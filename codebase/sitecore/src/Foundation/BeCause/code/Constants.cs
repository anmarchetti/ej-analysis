using System;
using Sitecore.Data;

namespace easyJet.Foundation.BeCause
{
    public static class Constants
    {
        public const int GetSearchStatusRetryCount = 30;
        public const string SettingsPathSettingName = "easyJet.BeCause.SettingsPath";
        public const string EndpointSettingName = "easyJet.BeCause.Endpoint";
        public const string JsonContentType = "application/json";
        public const string BecauseApiKeyName = "BeCause.ApiKey";
        public const string BecauseEnabledSettingName = "easyJet.BeCause.Enabled";
        public const string CustomIdentifierIdSettingsName = "easyJet.BeCause.CustomIdentifierId";
        public const string CertificationTagsSettingsName = "easyJet.BeCause.CertificationTags";
        public static readonly TimeSpan PollingDelay = TimeSpan.FromSeconds(60);

        public static class TemplateIds
        {
            public static TemplateID AccomodationFacilitiesFolder = new TemplateID(ID.Parse("{5C397782-6810-460A-AB57-84E9AB67514C}"));
            public static TemplateID AccomodationFacility = new TemplateID(ID.Parse("{803E75ED-804E-4900-97D6-7BCC046C8385}"));
            public static TemplateID Country = new TemplateID(ID.Parse("{5F03C6EF-EF52-4F2E-BC5A-B1F065A1E745}"));
            public static TemplateID Region = new TemplateID(ID.Parse("{2F42EC14-7E56-467A-B300-AB9723C74546}"));
            public static TemplateID RegionCity = new TemplateID(ID.Parse("{33B3542E-1316-40CA-8971-1CDB3C1D452D}"));
            public static TemplateID Resort = new TemplateID(ID.Parse("{538939B3-07EC-4C23-BF8C-3A68DE0FDC93}"));
            public static TemplateID Destinations = new TemplateID(ID.Parse("{41831D30-A4BD-4AD0-B5F2-A3D0A6F7828A}"));
            public static TemplateID Hotel = new TemplateID(ID.Parse("{28E5E169-8F72-4F90-A277-280A8302B607}"));
        }

        public struct Endpoints
        {
            public const string CompaniesSearch = "bulk/companies/search";
            public const string StandardsSearch = "bulk/standards/search";
            public const string Status = "bulk/status/";
            public const string CompanyMappings = "bulk/company-mappings";
        }

        public struct FieldNames
        {
            public const string Certificates = "Certificates";
            public const string SelectedResultFieldNames = "Selected Result Field Names";
            public const string IsEnabled = "Is Enabled";
        }

        public static class ItemIds
        {
            public static ID EcoCertifiedFacilityType = ID.Parse("{4B03F06C-9538-4591-9498-1802A71E382B}");
            public static ID Destinations = ID.Parse("{83C5C952-9286-489A-A351-77883CAF5F47}");
        }

        public static class FieldIds
        {
            public static ID FacilityType = ID.Parse("{2C6B2388-283D-45CD-B47A-1763F6FAD613}");
        }
    }
}
