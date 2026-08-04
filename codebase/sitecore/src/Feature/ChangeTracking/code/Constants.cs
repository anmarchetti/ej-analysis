using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using Sitecore.Data;

namespace easyJet.Feature.ChangeTracking
{
    [ExcludeFromCodeCoverage]
    public struct Constants
    {
        public const string SettingsPathSettingName = "easyJet.ChangeTracking.SettingsPath";
        public const string CacheExpiredInMinutesSettingName = "easyJet.ChangeTracking.CacheExpiredInMinutes";

        public struct Fields
        {
            public const string ChangeTrackingTemplates = "Templates";
            public const string ChangeTrackingExcludedFields = "Excluded Fields";
            public const string ChangeTrackingIsEnabled = "Is Enabled";

            public const string ReportColumnField = "Field";
            public const string ReportColumnSelect = "Select";
        }

        public struct SelectableColumnValues
        {
            public const string Date = "Date";
            public const string Author = "Author";
            public const string NewValue = "Value";
            public const string OldValue = "OldValue";
            public const string FieldId = "FieldId";
            public const string ItemId = "ItemId";
            public const string Path = "Path";
            public const string Icon = "Icon";
            public const string Version = "Version";
        }

        public static class Ids
        {
            public static readonly ID ChangeTrackingEditorTab = ID.Parse("{86C2A548-CC39-464F-97E3-B6FD2D680110}");
            public static readonly ID EditorsField = ID.Parse("{A0CB3965-8884-4C7A-8815-B6B2E5CED162}");
        }

        public static Dictionary<ID, string> SelectDropDownValues = new Dictionary<ID, string>()
        {
            { new ID("{5F1A4EAB-5793-4865-872D-192C1B05D272}"), SelectableColumnValues.Date },
            { new ID("{E2900E2C-9CB0-44B9-8726-2CCD5A0A8629}"), SelectableColumnValues.Author },
            { new ID("{36A85EE5-B0C6-430D-8CCB-EF69BA2451C6}"), SelectableColumnValues.NewValue },
            { new ID("{BD9FB47E-A850-4A05-8D2D-B7E44536F73E}"), SelectableColumnValues.OldValue },
        };
    }
}