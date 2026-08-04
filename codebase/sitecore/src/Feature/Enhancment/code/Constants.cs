using System.Diagnostics.CodeAnalysis;
using Sitecore.Data;

namespace easyJet.Feature.SitecoreEnhancment
{
    [ExcludeFromCodeCoverage]
    public class Constants
    {
        public struct TemplateIds
        {
            public static readonly ID StandardRenderingParameters = new ID("{8CA06D6A-B353-44E8-BC31-B528C7306971}");
            public static readonly ID Rendering = new ID("{04646A89-996F-4EE7-878A-FFDBF1F0EF0D}");
            public static readonly ID RenderingFolder = new ID("{7EE0975B-0698-493E-B3A2-0B2EF33D0522}");
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

        public struct Link
        {
            public struct Attributes
            {
                public const string Anchor = "anchor";
                public const string Class = "class";
                public const string Id = "id";
                public const string LinkType = "linktype";
                public const string QueryString = "querystring";
                public const string Target = "target";
                public const string Text = "text";
                public const string Title = "title";
                public const string Url = "url";
                public const string Rel = "rel";
            }

            public struct RelValues
            {
                public const string NoFollow = "nofollow";
            }
        }

        public struct Dialog
        {
            public struct Parameters
            {
                public const string UseCustomFunctions = "usecustomfunctions";
                public const string CenterCrop = "centercrop";
            }
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

            public struct Devices
            {
                public const string Desktop = "Desktop";
                public const string Mobile = "Mobile";
            }

            public struct Actions
            {
                public const string PickFocalPointAction = "contentimage:focalpoint";
                public const string ClearFocalPointAction = "contentimage:clearfocalpoint";
            }
        }

        public struct Patterns
        {
            public const string GuidPattern = "[{(]?[0-9A-F]{8}[-]?(?:[0-9A-F]{4}[-]?){3}[0-9A-F]{12}[)}]";
        }

        public struct Fields
        {
            public const string OriginalItem = "__OriginalItem";
        }

        public struct FieldIds
        {
            public static readonly ID BoardDescriptionContent = ID.Parse("{AA915102-2E00-46DD-8436-4A1A8B50C115}");
        }

        public struct ItemIds
        {
            public static readonly ID GenerateContentSyncScriptID = ID.Parse("{58B6AF78-323D-443B-B988-BC636598F9AB}");
        }

        public struct Workbox
        {
            public const string WorkboxDictionaryXpathSettingsName = "Workbox.DictionaryXpath";
        }

        public struct Settings
        {
            public const string ExcludedFieldNamesSettingName = "Jss.ExcludedFieldNames";
        }

        public struct EnvironmentHint
        {
            public const string EnvironmentHintFontColorSettingsName = "EnvironmentHint.Font.Color";
            public const string EnvironmentHintBackgroundColorSettingsName = "EnvironmentHint.Background.Color";
            public const string EnvironmentHintEnvironmentNameSettingsName = "EnvironmentHint.EnvironmentName";
            public const string EnvironmentHintPathsSettingsName = "EnvironmentHint.Paths";
        }

        public struct RenderingMappingEditor
        {
            public const string DefaultSource = "/sitecore/layout/Renderings";
            public const string ScriptKey = "RenderingMappingEditor_Scripts";
            public const string NotSelectedText = "(not selected)";
            public const string UndefinedValue = "undefined";
            public const string EditParametersText = "Edit Parameters...";
            public const string DeleteText = "Delete";
            public const string ValueNotInListText = "Value not in the selection list.";
            public const string PleaseSelectRenderingText = "Please select a replacement rendering first.";
            public const string JustRemoveValue = "JUST_REMOVE";
            public const string JustRemoveText = "Just Remove";
            public const string EditRenderingParametersDialogTitle = "Edit Rendering Parameters";
            public const string EditRenderingPropertiesDialogTitle = "Edit Rendering Properties";
            public const string ResourcesNamespace = "easyJet.Feature.SitecoreEnhancment.Resources.";

            public struct FieldNames
            {
                public const string ComponentName = "componentName";
                public const string ParametersTemplate = "Parameters Template";
                public const string Placeholder = "Placeholder";
                public const string DataSource = "Data Source";
            }

            public struct ControlSuffixes
            {
                public const string Key = "_Key";
                public const string Value = "_Value";
                public const string Params = "_Params";
                public const string EditBtn = "_EditBtn";
                public const string Summary = "_Summary";
                public const string Expander = "_Expander";
                public const string Row = "_Row";
                public const string Uid = "_Uid";
            }

            public struct PipelineParameters
            {
                public const string HiddenFieldId = "hiddenFieldId";
                public const string DropdownId = "dropdownId";
                public const string HiddenFieldClientId = "hiddenFieldClientId";
                public const string RenderingId = "renderingId";
                public const string DatabaseName = "databaseName";
                public const string UseBasicParams = "usebasicparams";
                public const string Rendering = "rendering";
            }

            public struct DialogDimensions
            {
                public const string WidthFull = "720";
                public const string HeightFull = "480";
                public const string HeightBasic = "400";
            }

            public struct ResourceFileNames
            {
                public const string Css = "RenderingMappingEditor.css";
                public const string Js = "RenderingMappingEditor.js";
            }

            public struct ResourcePaths
            {
                public static string Css => $"/sitecore modules/RenderingMappingEditor/{ResourceFileNames.Css}";

                public static string Js => $"/sitecore modules/RenderingMappingEditor/{ResourceFileNames.Js}";

                public const string FieldEditor = "/sitecore/shell/Applications/Content Manager/Dialogs/field editor.aspx";
            }

            public struct TemplateNames
            {
                public const string HeaderTemplate = "RenderingMappingEditor.Header.html";
                public const string RowTemplate = "RenderingMappingEditor.Row.html";
                public const string RenderingDisplayTemplate = "RenderingMappingEditor.RenderingDisplay.html";
                public const string DropdownTemplate = "RenderingMappingEditor.Dropdown.html";
            }

            public struct TemplateKeys
            {
                public const string LabelKey = "label_key";
                public const string LabelValue = "label_value";
                public const string LabelUid = "label_uid";
            }
        }
    }
}
