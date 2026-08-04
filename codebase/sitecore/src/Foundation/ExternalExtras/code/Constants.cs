using System;
using System.Diagnostics.CodeAnalysis;
using Sitecore.Data;

namespace easyJet.Foundation.ExternalExtras
{
    [ExcludeFromCodeCoverage]
    public static class Constants
    {
        public const string SettingsPathSettingName = "easyJet.ExternalExtras.SettingsPath";

        public static class TemplateIds
        {
            public static TemplateID Settings => new TemplateID(ID.Parse("{BBAA7D4E-1E6D-4475-A1AB-AA48DE9BFE9F}"));
        }

        public struct FieldNames
        {
            public const string IsEnabled = "Is Enabled";
        }
    }
}
