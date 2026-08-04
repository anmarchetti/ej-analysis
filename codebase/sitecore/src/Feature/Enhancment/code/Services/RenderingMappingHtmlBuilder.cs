using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Hosting;
using Scriban;
using Scriban.Runtime;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    /// <summary>
    ///     Implementation of HTML building logic for RenderingMappingEditor field.
    /// </summary>
    public class RenderingMappingHtmlBuilder : IRenderingMappingHtmlBuilder
    {
        private readonly IRenderingItemService renderingItemService;
        private readonly IRenderingParameterService renderingParameterService;

        public RenderingMappingHtmlBuilder()
            : this(new RenderingItemService(), new RenderingParameterService())
        {
        }

        public RenderingMappingHtmlBuilder(IRenderingItemService renderingItemService)
            : this(renderingItemService, new RenderingParameterService())
        {
        }

        public RenderingMappingHtmlBuilder(
            IRenderingItemService renderingItemService,
            IRenderingParameterService renderingParameterService)
        {
            this.renderingItemService = renderingItemService;
            this.renderingParameterService = renderingParameterService;
        }

        public string BuildHeaderHtml(string labelKey, string labelValue, string labelUid)
        {
            return RenderTemplate(
                Constants.RenderingMappingEditor.TemplateNames.HeaderTemplate,
                new ScriptObject
                {
                    [Constants.RenderingMappingEditor.TemplateKeys.LabelKey] = HttpUtility.HtmlEncode(labelKey),
                    [Constants.RenderingMappingEditor.TemplateKeys.LabelValue] = HttpUtility.HtmlEncode(labelValue),
                    [Constants.RenderingMappingEditor.TemplateKeys.LabelUid] = HttpUtility.HtmlEncode(labelUid)
                });
        }

        public RenderingMappingRowContext BuildRowContext(
            string rowId,
            string parameters,
            string clientEvent,
            RenderingColumnConfig keyConfig,
            RenderingColumnConfig valueConfig)
        {
            var keyDropdownId = $"{rowId}{Constants.RenderingMappingEditor.ControlSuffixes.Key}";
            var valueDropdownId = $"{rowId}{Constants.RenderingMappingEditor.ControlSuffixes.Value}";

            var keyId = keyConfig?.RenderingId;
            var valueId = valueConfig?.RenderingId;

            var (standardParams, customParams) = renderingParameterService.ParseAndCategorizeParameters(parameters, valueId);

            return new RenderingMappingRowContext
            {
                RowId = rowId,
                KeyId = keyId,
                ValueId = valueId,
                KeyName = renderingItemService.GetItemDisplayName(keyId),
                ValueName = renderingItemService.GetItemDisplayName(valueId),
                KeyIconUrl = renderingItemService.GetRenderingIconUrl(keyId),
                ValueIconUrl = renderingItemService.GetRenderingIconUrl(valueId),
                KeyComponentName = renderingItemService.GetRenderingComponentName(keyId),
                ValueComponentName = renderingItemService.GetRenderingComponentName(valueId),
                KeyTypeName = renderingItemService.GetRenderingTypeName(keyId),
                ValueTypeName = renderingItemService.GetRenderingTypeName(valueId),
                Parameters = parameters,
                KeyDropdownHtml = BuildGroupedDropdownHtml(keyDropdownId, keyId, renderingItemService.GetSourceItemsFromCache(keyConfig?.Source), keyConfig?.AllowedRenderingIds),
                ValueDropdownHtml = BuildGroupedDropdownHtml(valueDropdownId, valueId, renderingItemService.GetSourceItemsFromCache(valueConfig?.Source), valueConfig?.AllowedRenderingIds, valueConfig?.AddJustRemoveOption ?? false),
                ClientEvent = clientEvent,
                StandardParams = standardParams
                    .Where(kvp => !string.IsNullOrWhiteSpace(kvp.Value))
                    .Select(kvp => new KeyValuePair<string, string>(kvp.Key, kvp.Value))
                    .ToList(),
                CustomParams = customParams
                    .Where(kvp => !string.IsNullOrWhiteSpace(kvp.Value))
                    .Select(kvp => new KeyValuePair<string, string>(kvp.Key, kvp.Value))
                    .ToList(),
                StandardFieldNames = (renderingParameterService.GetStandardFieldNames(valueId) ?? Enumerable.Empty<string>()).ToList()
            };
        }

        public string BuildRowHtml(RenderingMappingRowContext context)
        {
            if (context == null)
            {
                return string.Empty;
            }

            var hasValue = !string.IsNullOrWhiteSpace(context.ValueId) && context.ValueId != Constants.RenderingMappingEditor.JustRemoveValue;
            var hasKey = !string.IsNullOrWhiteSpace(context.KeyId);

            var paramsHiddenId = $"{context.RowId}{Constants.RenderingMappingEditor.ControlSuffixes.Params}";
            var editBtnId = $"{context.RowId}{Constants.RenderingMappingEditor.ControlSuffixes.EditBtn}";
            var summaryId = $"{context.RowId}{Constants.RenderingMappingEditor.ControlSuffixes.Summary}";
            var expanderBtnId = $"{context.RowId}{Constants.RenderingMappingEditor.ControlSuffixes.Expander}";

            var standardParamsList = context.StandardParams
                .Where(kvp => !string.IsNullOrWhiteSpace(kvp.Value))
                .Select(kvp => new
                {
                    key = HttpUtility.HtmlEncode(kvp.Key),
                    display_value = HttpUtility.HtmlEncode(kvp.Value)
                }).ToList();

            var customParamsList = context.CustomParams
                .Where(kvp => !string.IsNullOrWhiteSpace(kvp.Value))
                .Select(kvp => new
                {
                    key = HttpUtility.HtmlEncode(kvp.Key),
                    display_value = HttpUtility.HtmlEncode(kvp.Value)
                }).ToList();

            var templateSource = LoadTemplateFromFile(Constants.RenderingMappingEditor.TemplateNames.RowTemplate);
            if (string.IsNullOrEmpty(templateSource))
            {
                var summaryDisplay = hasKey || hasValue ? "block" : "none";
                var fallback = "{" +
                               $"\"row_id\": \"{HttpUtility.HtmlAttributeEncode(context.RowId)}\"," +
                               $"\"params_hidden_id\": \"{HttpUtility.HtmlAttributeEncode(paramsHiddenId)}\"," +
                               $"\"edit_btn_id\": \"{HttpUtility.HtmlAttributeEncode(editBtnId)}\"," +
                               $"\"summary_id\": \"{HttpUtility.HtmlAttributeEncode(summaryId)}\"," +
                               $"\"expander_btn_id\": \"{HttpUtility.HtmlAttributeEncode(expanderBtnId)}\"," +
                               $" \"summary_display\" : \"{summaryDisplay}\"" +
                               "}";

                return fallback;
            }

            return RenderTemplate(
                Constants.RenderingMappingEditor.TemplateNames.RowTemplate,
                new ScriptObject
                {
                    ["row_id"] = context.RowId,
                    ["key_icon_url"] = HttpUtility.HtmlAttributeEncode(context.KeyIconUrl ?? string.Empty),
                    ["value_icon_url"] = HttpUtility.HtmlAttributeEncode(context.ValueIconUrl ?? string.Empty),
                    ["key_dropdown_html"] = context.KeyDropdownHtml,
                    ["value_dropdown_html"] = context.ValueDropdownHtml,
                    ["params_hidden_id"] = paramsHiddenId,
                    ["params_value"] = HttpUtility.HtmlAttributeEncode(context.Parameters ?? string.Empty),
                    ["edit_btn_id"] = editBtnId,
                    ["client_event"] = context.ClientEvent,
                    ["has_value"] = hasValue,
                    ["edit_params_text"] = Translate.Text(Constants.RenderingMappingEditor.EditParametersText),
                    ["delete_text"] = Translate.Text(Constants.RenderingMappingEditor.DeleteText),
                    ["has_delete_button"] = hasKey,
                    ["summary_id"] = summaryId,
                    ["summary_display"] = hasKey || hasValue ? "block" : "none",
                    ["expander_btn_id"] = expanderBtnId,
                    ["key_id"] = HttpUtility.HtmlAttributeEncode(context.KeyId ?? string.Empty),
                    ["value_id"] = HttpUtility.HtmlAttributeEncode(context.ValueId ?? string.Empty),
                    ["key_display_html"] = BuildRenderingDisplayHtml(context.KeyId, context.KeyName),
                    ["value_display_html"] = BuildRenderingDisplayHtml(context.ValueId, context.ValueName),
                    ["has_component_row"] = !string.IsNullOrEmpty(context.KeyComponentName) || !string.IsNullOrEmpty(context.ValueComponentName),
                    ["key_component_name"] = HttpUtility.HtmlEncode(context.KeyComponentName ?? string.Empty),
                    ["value_component_name"] = HttpUtility.HtmlEncode(context.ValueComponentName ?? string.Empty),
                    ["has_type_row"] = !string.IsNullOrEmpty(context.KeyTypeName) || !string.IsNullOrEmpty(context.ValueTypeName),
                    ["key_type_name"] = HttpUtility.HtmlEncode(context.KeyTypeName ?? string.Empty),
                    ["value_type_name"] = HttpUtility.HtmlEncode(context.ValueTypeName ?? string.Empty),
                    ["has_parameters"] = context.StandardParams.Count > 0 || context.CustomParams.Count > 0,
                    ["standard_params"] = standardParamsList,
                    ["custom_params"] = customParamsList,
                    ["standard_field_names"] = HttpUtility.HtmlAttributeEncode(string.Join(",", (context.StandardFieldNames ?? new System.Collections.Generic.List<string>()).Select(s => s.ToLowerInvariant()))),
                    ["uid_dropdown_html"] = context.UidDropdownHtml ?? string.Empty,
                    ["uid_value"] = HttpUtility.HtmlAttributeEncode(context.Uid ?? string.Empty)
                });
        }

        public string BuildGroupedDropdownHtml(string controlId, string selectedValue, IEnumerable<Item> sourceItems, HashSet<ID> allowedRenderingIds = null, bool addJustRemoveOption = false)
        {
            var items = sourceItems?.ToArray() ?? new Item[0];
            var isJustRemoveSelected = addJustRemoveOption && selectedValue == Constants.RenderingMappingEditor.JustRemoveValue;
            var foundSelected = isJustRemoveSelected;

            var firstOptions = new List<object>();
            if (addJustRemoveOption)
            {
                firstOptions.Add(new
                {
                    value = Constants.RenderingMappingEditor.JustRemoveValue,
                    text = Constants.RenderingMappingEditor.JustRemoveText,
                    selected = isJustRemoveSelected
                });
            }

            var optionGroups = new List<object>();
            foreach (var parent in items)
            {
                var options = new List<object>();
                foreach (Item child in parent.Children)
                {
                    if (allowedRenderingIds != null && !allowedRenderingIds.Contains(child.ID))
                    {
                        continue;
                    }

                    var childValue = child.ID.ToString();
                    var isSelected = childValue == selectedValue;
                    if (isSelected)
                    {
                        foundSelected = true;
                    }

                    options.Add(
                        new
                        {
                            value = HttpUtility.HtmlAttributeEncode(childValue),
                            text = HttpUtility.HtmlEncode(child.DisplayName),
                            icon_url = HttpUtility.HtmlAttributeEncode(renderingItemService.GetRenderingIconUrl(childValue) ?? string.Empty),
                            selected = isSelected
                        });
                }

                if (options.Count == 0)
                {
                    continue;
                }

                optionGroups.Add(
                    new
                    {
                        label = HttpUtility.HtmlAttributeEncode(parent.DisplayName),
                        options
                    });
            }

            if (!string.IsNullOrEmpty(selectedValue) && !foundSelected)
            {
                optionGroups.Add(
                    new
                    {
                        label = HttpUtility.HtmlAttributeEncode(Translate.Text(Constants.RenderingMappingEditor.ValueNotInListText)),
                        options = new List<object>
                        {
                            new
                            {
                                value = HttpUtility.HtmlAttributeEncode(selectedValue),
                                text = HttpUtility.HtmlEncode(selectedValue),
                                selected = true
                            }
                        }
                    });
            }

            return RenderTemplate(
                Constants.RenderingMappingEditor.TemplateNames.DropdownTemplate,
                new ScriptObject
                {
                    ["control_id"] = controlId,
                    ["onchange_handler"] = string.Empty,
                    ["first_options"] = firstOptions,
                    ["option_groups"] = optionGroups
                });
        }

        public string BuildRenderingDisplayHtml(string itemId, string displayName)
        {
            var iconUrl = renderingItemService.GetRenderingIconUrl(itemId);
            return RenderTemplate(
                Constants.RenderingMappingEditor.TemplateNames.RenderingDisplayTemplate,
                new ScriptObject
                {
                    ["icon_url"] = HttpUtility.HtmlAttributeEncode(iconUrl ?? string.Empty),
                    ["display_name"] = HttpUtility.HtmlEncode(displayName ?? string.Empty)
                });
        }

        protected virtual string RenderTemplate(string templateName, ScriptObject model)
        {
            var templateSource = LoadTemplateFromFile(templateName);
            if (string.IsNullOrEmpty(templateSource))
            {
                return string.Empty;
            }

            var template = Template.Parse(templateSource);
            var context = new TemplateContext { MemberRenamer = member => member.Name };
            context.PushGlobal(model);
            return template.Render(context);
        }

        protected virtual string LoadTemplateFromFile(string resourceName)
        {
            var basePath = HostingEnvironment.MapPath("~/sitecore modules/RenderingMappingEditor");
            if (string.IsNullOrEmpty(basePath))
            {
                return null;
            }

            var filePath = Path.Combine(basePath, resourceName);
            if (!File.Exists(filePath))
            {
                return null;
            }

            return File.ReadAllText(filePath);
        }
    }
}
