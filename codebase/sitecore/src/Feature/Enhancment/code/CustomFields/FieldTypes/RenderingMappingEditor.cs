using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.UI;
using System.Xml.Linq;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Feature.SitecoreEnhancment.Services;
using easyJet.Feature.SitecoreEnhancment.Utils;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Shell.Applications.ContentEditor;
using Sitecore.Web.UI;
using Sitecore.Web.UI.HtmlControls;
using Sitecore.Web.UI.Sheer;
using Control = System.Web.UI.Control;
using LayoutField = Sitecore.Data.Fields.LayoutField;
using PresentationConstants = easyJet.Foundation.Presentation.Constants;

namespace easyJet.Feature.SitecoreEnhancment.CustomFields.FieldTypes
{
    public class RenderingMappingEditor : Input, IContentField
    {
        private readonly ISitecoreContextProvider contextProvider;
        private readonly IDatabaseProvider database;

        private readonly Dictionary<string, string> defaultDataSourceValues = new Dictionary<string, string>
        {
            { Identifiers.LabelKey, "Rendering to be replace" },
            { Identifiers.KeySource, Constants.RenderingMappingEditor.DefaultSource },
            { Identifiers.LabelValue, "Rendering to replace with" },
            { Identifiers.LabelUid, "Rendering Instance" },
            { Identifiers.ValueSource, Constants.RenderingMappingEditor.DefaultSource }
        };

        private readonly IHostingEnvironmentService hostingEnvironmentService;

        private readonly IRenderingMappingHtmlBuilder htmlBuilder;
        private readonly IHttpContextAccessor httpContextAccessor;
        private readonly IRenderingMappingLogger logger;
        private readonly IRenderingParameterEditorService parameterEditorService;
        private readonly IRenderingIdExtractionService renderingIdExtractionService;
        private readonly ISheerUiService sheerUi;

        public RenderingMappingEditor()
            : this(ResolveDependencies())
        {
        }

        /// <summary>
        ///     Initializes a new instance using the dependencies object to reduce parameter count.
        /// </summary>
        public RenderingMappingEditor(RenderingMappingEditorDependencies dependencies)
        {
            if (dependencies == null)
            {
                throw new ArgumentNullException(nameof(dependencies));
            }

            database = dependencies.DatabaseProvider;
            htmlBuilder = dependencies.HtmlBuilder;
            parameterEditorService = dependencies.ParameterEditorService;
            contextProvider = dependencies.ContextProvider;
            sheerUi = dependencies.SheerUiService;
            Activation = true;
            httpContextAccessor = dependencies.HttpContextAccessor;
            logger = dependencies.Logger ?? new RenderingMappingLogger();
            hostingEnvironmentService = dependencies.HostingEnvironmentService ?? new HostingEnvironmentService(logger);
            renderingIdExtractionService = dependencies.RenderingIdExtractionService;
        }

        public override string Class => "scContentControl";

        public string Source { get; set; }

        public string GetValue()
        {
            return Value;
        }

        public void SetValue(string value)
        {
            Assert.ArgumentNotNull(value, nameof(value));
            Value = value;
        }

        private static RenderingMappingEditorDependencies ResolveDependencies()
        {
            var logger = new RenderingMappingLogger();
            var dbProvider = new SitecoreDatabaseProvider();
            var enhancmentLogger = new SitecoreEnhancmentLogger();

            return new RenderingMappingEditorDependencies
            {
                DatabaseProvider = dbProvider,
                HtmlBuilder = new RenderingMappingHtmlBuilder(),
                ParameterEditorService = new RenderingParameterEditorService(
                    new FieldEditorUrlBuilder(dbProvider, logger),
                    new RenderingParameterService()),
                ContextProvider = new SitecoreContextProvider(),
                SheerUiService = new SheerUiService(),
                HttpContextAccessor = new HttpContextAccessor(),
                Logger = logger,
                HostingEnvironmentService = new HostingEnvironmentService(logger),
                RenderingIdExtractionService = new RenderingIdExtractionService(
                    enhancmentLogger,
                    dbProvider,
                    new FieldUtilsService())
            };
        }

        /// <summary>
        ///     Builds a hierarchically ordered, labelled list of rendering instances from raw data.
        /// <summary>
        ///     Builds a labelled list of rendering instances from raw data.
        ///     Each label is "{displayName} -> {uid}" when uid is set, otherwise just "{displayName}".
        /// </summary>
        public static List<(string uid, string label, string renderingId)> BuildHierarchicalList(IEnumerable<(string uid, string displayName, string renderingId)> renderings)
        {
            var list = renderings?.ToList() ?? new List<(string, string, string)>();
            var result = new List<(string uid, string label, string renderingId)>(list.Count);

            foreach (var (uid, displayName, renderingId) in list)
            {
                var uidSuffix = string.IsNullOrEmpty(uid) ? string.Empty : $" -> {uid}";
                result.Add((uid, $"{displayName}{uidSuffix}", renderingId));
            }

            return result;
        }

        protected override void DoRender(HtmlTextWriter output)
        {
            Assert.ArgumentNotNull(output, nameof(output));
            SetWidthAndHeightStyle();
            output.Write($"<div{ControlAttributes}>");
            RenderChildren(output);
            output.Write("</div>");
        }

        protected override void OnLoad(EventArgs e)
        {
            Assert.ArgumentNotNull(e, nameof(e));
            base.OnLoad(e);

            if (contextProvider.IsClientPageEvent)
            {
                LoadValue();
            }

            BuildControl();
        }

        protected override void SetModified()
        {
            base.SetModified();
            if (TrackModified)
            {
                contextProvider.SetClientPageModified(true);
            }
        }

        [ProcessorMethod]
        protected void EditParametersClick(string metadata)
        {
            Assert.ArgumentNotNull(metadata, nameof(metadata));

            var (hiddenFieldId, dropdownId, hiddenFieldClientId) = parameterEditorService.ParseEditParametersMetadata(metadata);
            var parameters = parameterEditorService.CreatePipelineParameters(hiddenFieldId, dropdownId, hiddenFieldClientId);

            contextProvider.StartClientPage(this, nameof(RunEditParametersPipeline), new ClientPipelineArgs(parameters));
        }

        protected void RunEditParametersPipeline(ClientPipelineArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));

            var hiddenFieldId = args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldId];
            var dropdownId = args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.DropdownId];
            var hiddenFieldClientId = args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldClientId];

            if (string.IsNullOrEmpty(hiddenFieldId) || string.IsNullOrEmpty(dropdownId))
            {
                return;
            }

            if (args.IsPostBack)
            {
                ProcessFieldEditorPostBack(args, hiddenFieldId, hiddenFieldClientId);
                return;
            }

            var form = httpContextAccessor.GetCurrent()?.Request.Form;
            var renderingValue = form?[dropdownId] ?? string.Empty;

            if (!parameterEditorService.TryParseRenderingId(renderingValue, out var renderingId))
            {
                sheerUi.Alert(Constants.RenderingMappingEditor.PleaseSelectRenderingText);
                return;
            }

            var currentParams = form?[hiddenFieldId] ?? string.Empty;

            ShowFieldEditorDialog(args, renderingId, currentParams, hiddenFieldId, hiddenFieldClientId);
        }

        [ProcessorMethod]
        protected void AutoRefreshUidDropdowns(string ecrItemId)
        {
            if (string.IsNullOrEmpty(ecrItemId) || !Sitecore.Data.ID.TryParse(ecrItemId, out var itemId))
            {
                return;
            }

            var db = database.GetDatabase(DatabaseType.Master);
            if (db == null)
            {
                return;
            }

            var item = db.GetItem(itemId);
            if (item == null)
            {
                return;
            }

            var pageFieldValue = item[PresentationConstants.Fields.ExperienceContextProviderPage.Page];
            if (Sitecore.Data.ID.TryParse(pageFieldValue, out _))
            {
                RefreshUidDropdowns(pageFieldValue);
                return;
            }

            var templateFieldValue = item[PresentationConstants.Fields.ExperienceContextProviderPageTemplate.PageTemplate];
            if (Sitecore.Data.ID.TryParse(templateFieldValue, out _))
            {
                RefreshUidDropdowns(templateFieldValue);
            }
        }

        [ProcessorMethod]
        protected void RefreshUidDropdowns(string pageOrTemplateId)
        {
            if (string.IsNullOrEmpty(pageOrTemplateId) || !Sitecore.Data.ID.TryParse(pageOrTemplateId, out var itemId))
            {
                return;
            }

            var db = database.GetDatabase(DatabaseType.Master);
            if (db == null)
            {
                return;
            }

            var refItem = db.GetItem(itemId);
            if (refItem == null)
            {
                return;
            }

            List<(string uid, string label, string renderingId)> uidOptions;
            var isTemplate = refItem.TemplateName?.EndsWith("Template", StringComparison.OrdinalIgnoreCase) == true
                             || refItem.Paths?.FullPath?.IndexOf("/templates/", StringComparison.OrdinalIgnoreCase) >= 0;

            if (isTemplate)
            {
                var items = renderingIdExtractionService?.GetItemsForTemplateId(itemId)
                            ?? new List<Item>();
                uidOptions = ExtractRenderingInstancesFromItems(items.ToList(), db);
            }
            else
            {
                var pageItems = renderingIdExtractionService?.GetItemsForPageId(itemId)
                                ?? new List<Item>();
                uidOptions = ExtractRenderingInstancesFromItems(pageItems.ToList(), db);

                if (uidOptions.Count == 0 && refItem.TemplateID != Sitecore.Data.ID.Null)
                {
                    var templateItems = renderingIdExtractionService?.GetItemsForTemplateId(refItem.TemplateID)
                                        ?? new List<Item>();
                    uidOptions = ExtractRenderingInstancesFromItems(templateItems.ToList(), db);
                }
            }

            var optionsJson = new StringBuilder("[");
            for (var i = 0; i < uidOptions.Count; i++)
            {
                if (i > 0)
                {
                    optionsJson.Append(',');
                }

                optionsJson.AppendFormat(
                    CultureInfo.InvariantCulture,
                    "{{\"uid\":\"{0}\",\"label\":\"{1}\",\"renderingId\":\"{2}\"}}",
                    HttpUtility.JavaScriptStringEncode(uidOptions[i].uid),
                    HttpUtility.JavaScriptStringEncode(uidOptions[i].label),
                    HttpUtility.JavaScriptStringEncode(uidOptions[i].renderingId ?? string.Empty));
            }

            optionsJson.Append(']');

            sheerUi.Eval($"if(typeof scRmRefreshUidDropdowns==='function'){{scRmRefreshUidDropdowns({optionsJson});}}");
        }

        private static string ExtractRowId(string targetHiddenId)
        {
            var rowId = targetHiddenId;
            if (!rowId.Contains(Constants.RenderingMappingEditor.ControlSuffixes.Row) ||
                !rowId.EndsWith(Constants.RenderingMappingEditor.ControlSuffixes.Params))
            {
                return rowId;
            }

            var lastUnderscoreIndex = rowId.LastIndexOf('_');
            return lastUnderscoreIndex > 0 ? rowId.Substring(0, lastUnderscoreIndex) : rowId;
        }

        private static string BuildUpdateSummaryScript(string rowId, string updatedParameters, string hiddenFieldId = null)
        {
            var hiddenFieldUpdate = string.IsNullOrEmpty(hiddenFieldId)
                ? string.Empty
                : $@"try {{
        var hf = document.getElementById('{HttpUtility.JavaScriptStringEncode(hiddenFieldId)}');
        if (hf) {{ hf.value = pars; hf.setAttribute('value', pars); }}
    }} catch(e){{}}";

            return $@"
    (function() {{
        try {{ if (window.scForm) {{ scForm.setModified(true); }} }} catch(e){{}}
        try {{ if (window.initRenderingMappingButtons) {{ window.initRenderingMappingButtons(); }} }} catch(e){{}}
        var rowId = '{HttpUtility.JavaScriptStringEncode(rowId)}';
        var pars = '{HttpUtility.JavaScriptStringEncode(updatedParameters)}';
        {hiddenFieldUpdate}
        try {{ if (window.scRmUpdateSummary) {{ scRmUpdateSummary(rowId); }} }} catch(e){{}}
        try {{ if (window.scRmUpdateParamsDetails) {{ scRmUpdateParamsDetails(rowId, pars); }} }} catch(e){{}}
    }})();";
        }

        private static void AddLiteralIfMissing(Control target, string marker, string html)
        {
            if (target == null)
            {
                return;
            }

            if (target.Controls.OfType<LiteralControl>().Any(c => c.Text?.Contains(marker) == true))
            {
                return;
            }

            html = $"<!--{marker}-->{html}";
            target.Controls.Add(new LiteralControl(html));
        }

        private static string BuildUidDropdownHtml(string controlId, string selectedUid, List<(string uid, string label, string renderingId)> uidOptions)
        {
            var sb = new StringBuilder();
            sb.Append($"<select name=\"{HttpUtility.HtmlAttributeEncode(controlId)}\" id=\"{HttpUtility.HtmlAttributeEncode(controlId)}\" class=\"scContentControl\">");
            var anySelected = string.IsNullOrEmpty(selectedUid);
            sb.Append($"<option value=\"\"{(anySelected ? " selected=\"selected\"" : string.Empty)}>{HttpUtility.HtmlEncode("-- Any instance --")}</option>");
            foreach (var (uid, label, renderingId) in uidOptions ?? Enumerable.Empty<(string, string, string)>())
            {
                var isSelected = string.Equals(uid, selectedUid, StringComparison.OrdinalIgnoreCase);
                var ridAttr = string.IsNullOrEmpty(renderingId) ? string.Empty : $" data-rendering-id=\"{HttpUtility.HtmlAttributeEncode(renderingId)}\"";
                sb.Append($"<option value=\"{HttpUtility.HtmlAttributeEncode(uid)}\" title=\"{HttpUtility.HtmlAttributeEncode(uid)}\"{ridAttr}{(isSelected ? " selected=\"selected\"" : string.Empty)}>{HttpUtility.HtmlEncode(label)}</option>");
            }

            if (!string.IsNullOrEmpty(selectedUid) && uidOptions?.Any(o => string.Equals(o.uid, selectedUid, StringComparison.OrdinalIgnoreCase)) != true)
            {
                sb.Append($"<option value=\"{HttpUtility.HtmlAttributeEncode(selectedUid)}\" title=\"{HttpUtility.HtmlAttributeEncode(selectedUid)}\" selected=\"selected\">{HttpUtility.HtmlEncode(selectedUid)}</option>");
            }

            sb.Append("</select>");
            return sb.ToString();
        }

        private static string TryGetLayoutValue(Item pageItem)
        {
            try
            {
                var layoutValue = LayoutField.GetFieldValue(pageItem.Fields[FieldIDs.FinalLayoutField]);

                if (string.IsNullOrEmpty(layoutValue))
                {
                    layoutValue = LayoutField.GetFieldValue(pageItem.Fields[FieldIDs.LayoutField]);
                }

                return layoutValue;
            }
            catch (Exception)
            {
                // LayoutField.GetFieldValue may throw on corrupt/inaccessible layout data; skip this item.
                return null;
            }
        }

        private static string ResolveRenderingDisplayName(XElement renderingElement, string uid, Database db)
        {
            var rendId = renderingElement.Attribute("id")?.Value;
            if (!string.IsNullOrEmpty(rendId) && Sitecore.Data.ID.TryParse(rendId, out var rendItemId))
            {
                var rendItem = db.GetItem(rendItemId);
                return rendItem != null ? rendItem.DisplayName : uid;
            }

            return uid;
        }

        private void ShowFieldEditorDialog(ClientPipelineArgs args, ID renderingId, string currentParams, string hiddenFieldId, string hiddenFieldClientId)
        {
            var urlOptions = parameterEditorService.GetFieldEditorUrlOptions(renderingId, currentParams);

            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldClientId] = hiddenFieldClientId;
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldId] = hiddenFieldId;
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.RenderingId] = renderingId.ToString();
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.DatabaseName] = database.GetDatabase(DatabaseType.Master).Name;
            args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.UseBasicParams] = urlOptions.UseBasicParams.ToString().ToLowerInvariant();

            sheerUi.ShowModalDialog(
                new ModalDialogOptions(urlOptions.Url.ToString())
                {
                    Width = urlOptions.Width,
                    Height = urlOptions.Height,
                    Response = true,
                    Header = urlOptions.Header
                });

            args.WaitForPostBack();
        }

        private void ProcessFieldEditorPostBack(ClientPipelineArgs args, string hiddenFieldId, string hiddenFieldClientId)
        {
            if (!args.HasResult || args.Result == Constants.RenderingMappingEditor.UndefinedValue)
            {
                return;
            }

            var renderingIdResult = Sitecore.Data.ID.Parse(args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.RenderingId]);
            var useBasicParams = args.Parameters[Constants.RenderingMappingEditor.PipelineParameters.UseBasicParams] == "true";

            var updatedParameters = parameterEditorService.ProcessFieldEditorResult(args.Result, renderingIdResult, useBasicParams);
            var targetHiddenId = string.IsNullOrEmpty(hiddenFieldClientId) ? hiddenFieldId : hiddenFieldClientId;
            sheerUi.SetAttribute(targetHiddenId, "value", updatedParameters);

            var rowId = ExtractRowId(targetHiddenId);
            var updateSummaryScript = BuildUpdateSummaryScript(rowId, updatedParameters, targetHiddenId);
            sheerUi.Eval(updateSummaryScript);
        }

        private void BuildControl()
        {
            Controls.Clear();

            var headerHtml = htmlBuilder.BuildHeaderHtml(
                ExtractParam(Identifiers.LabelKey),
                ExtractParam(Identifiers.LabelValue),
                ExtractParam(Identifiers.LabelUid));
            Controls.Add(new LiteralControl(headerHtml));

            if (string.IsNullOrWhiteSpace(Value))
            {
                var uidOptions = GetPageRenderingInstances();
                Controls.Add(new LiteralControl(BuildRowHtml(string.Empty, string.Empty, string.Empty, string.Empty, 0, uidOptions)));
                EnsureClientScripts();
                return;
            }

            var rowIndex = BuildExistingRows();

            Controls.Add(new LiteralControl(BuildRowHtml(string.Empty, string.Empty, string.Empty, string.Empty, rowIndex, GetPageRenderingInstances())));

            EnsureClientScripts();
        }

        private int BuildExistingRows()
        {
            var uidOptions = GetPageRenderingInstances();
            var entries = Value.Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries);
            var rowIndex = 0;
            foreach (var entry in entries)
            {
                var parts = entry.Split(new[] { ':' }, 4);
                var key = parts.Length > 0 ? parts[0] : string.Empty;
                var v1 = parts.Length > 1 ? parts[1] : string.Empty;
                var parameters = parts.Length > 2 ? RenderingMappingValueEscaper.UnescapeValue(parts[2]) : string.Empty;
                var uid = parts.Length > 3 ? parts[3] : string.Empty;
                Controls.Add(new LiteralControl(BuildRowHtml(key, v1, parameters, uid, rowIndex, uidOptions)));
                rowIndex++;
            }

            return rowIndex;
        }

        private string BuildRowHtml(string keyId, string valueId, string parameters, string uid, int rowIndex, List<(string uid, string label, string renderingId)> uidOptions)
        {
            var uniqueId = GetUniqueID($"{ID}_Row{rowIndex}");
            contextProvider.SetServerProperty($"{ID}_LastRowID", uniqueId);

            var keySource = ExtractParam(Identifiers.KeySource);
            var valueSource = ExtractParam(Identifiers.ValueSource);

            var valueDropdownId = $"{uniqueId}{Constants.RenderingMappingEditor.ControlSuffixes.Value}";
            var paramsHiddenId = $"{uniqueId}{Constants.RenderingMappingEditor.ControlSuffixes.Params}";
            var uidDropdownId = $"{uniqueId}{Constants.RenderingMappingEditor.ControlSuffixes.Uid}";

            var metadata = $"{paramsHiddenId}|{valueDropdownId}|{paramsHiddenId}";
            var clientEvent = contextProvider.GetClientEvent($"{ID}.EditParametersClick(\"{HttpUtility.JavaScriptStringEncode(metadata)}\")");

            var allowedRenderingIds = new HashSet<ID>(
                uidOptions
                    .Where(o => Sitecore.Data.ID.IsID(o.renderingId))
                    .Select(o => new ID(o.renderingId)));

            var context = htmlBuilder.BuildRowContext(
                uniqueId,
                parameters,
                clientEvent,
                new RenderingColumnConfig(keyId, keySource, allowedRenderingIds.Count > 0 ? allowedRenderingIds : null),
                new RenderingColumnConfig(valueId, valueSource, allowedRenderingIds.Count > 0 ? allowedRenderingIds : null, true)) ?? new RenderingMappingRowContext();

            context.Uid = uid ?? string.Empty;
            context.UidDropdownHtml = BuildUidDropdownHtml(uidDropdownId, uid ?? string.Empty, uidOptions);

            return htmlBuilder.BuildRowHtml(context);
        }

        private void EnsureClientScripts()
        {
            var cssPhysical = hostingEnvironmentService.MapPath(Constants.RenderingMappingEditor.ResourcePaths.Css);
            if (!string.IsNullOrEmpty(cssPhysical) && hostingEnvironmentService.FileExists(cssPhysical))
            {
                AddLiteralIfMissing(this, Constants.RenderingMappingEditor.ResourceFileNames.Css, $"<link rel='stylesheet' type='text/css' href='{Constants.RenderingMappingEditor.ResourcePaths.Css}' />");
            }

            var jsPhysical = hostingEnvironmentService.MapPath(Constants.RenderingMappingEditor.ResourcePaths.Js);
            if (!string.IsNullOrEmpty(jsPhysical) && hostingEnvironmentService.FileExists(jsPhysical))
            {
                try
                {
                    var scriptContent = hostingEnvironmentService.ReadAllText(jsPhysical);
                    var inlineScript = $"<script type=\"text/javascript\">{scriptContent}</script>";
                    AddLiteralIfMissing(this, Constants.RenderingMappingEditor.ResourceFileNames.Js, inlineScript);
                }
                catch (Exception ex)
                {
                    // Log and fall back to including a script tag
                    logger?.Warn("Failed inlining rendering mapping JS resource; falling back to script tag.", ex, this);
                    var scriptTag = $"<script type=\"text/javascript\" src=\"{Constants.RenderingMappingEditor.ResourcePaths.Js}\"></script>";
                    AddLiteralIfMissing(this, Constants.RenderingMappingEditor.ResourceFileNames.Js, scriptTag);
                }
            }
        }

        private List<(string uid, string label, string renderingId)> GetPageRenderingInstances()
        {
            try
            {
                var request = httpContextAccessor.GetCurrent()?.Request;
                var fo = request?.QueryString["fo"];
                if (string.IsNullOrEmpty(fo))
                {
                    return new List<(string, string, string)>();
                }

                var db = database.GetDatabase(DatabaseType.Master);
                if (db == null)
                {
                    return new List<(string, string, string)>();
                }

                var match = Regex.Match(fo, @"\{[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\}");
                if (!match.Success || !Sitecore.Data.ID.TryParse(match.Value, out var currentItemId))
                {
                    return new List<(string, string, string)>();
                }

                var currentItem = db.GetItem(currentItemId);
                if (currentItem == null)
                {
                    return new List<(string, string, string)>();
                }

                var items = renderingIdExtractionService?.GetItemsForEcpRuleItem(currentItem)
                            ?? new List<Item>();
                return ExtractRenderingInstancesFromItems(items.ToList(), db);
            }
            catch (Exception ex)
            {
                logger?.Warn("Failed to load page rendering instances for UID dropdown", ex, this);
            }

            return new List<(string, string, string)>();
        }

        private List<(string uid, string label, string renderingId)> ExtractRenderingInstancesFromItems(List<Item> pageItems, Database db)
        {
            var raw = new List<(string uid, string displayName, string renderingId)>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var pageItem in pageItems)
            {
                var layoutValue = TryGetLayoutValue(pageItem);
                if (string.IsNullOrEmpty(layoutValue))
                {
                    continue;
                }

                try
                {
                    var xml = XDocument.Parse(layoutValue);
                    foreach (var r in xml.Descendants("r").Where(el => el.Attribute("uid") != null))
                    {
                        var uid = r.Attribute("uid").Value;
                        if (!seen.Add(uid))
                        {
                            continue;
                        }

                        raw.Add((uid, ResolveRenderingDisplayName(r, uid, db), r.Attribute("id")?.Value ?? string.Empty));
                    }
                }
                catch (Exception ex)
                {
                    logger?.Warn("Failed to parse layout XML for UID dropdown", ex, this);
                }
            }

            return BuildHierarchicalList(raw);
        }

        private string ExtractParam(string name)
        {
            Assert.ArgumentNotNullOrEmpty(name, nameof(name));
            var src = string.IsNullOrWhiteSpace(Source) ? Constants.RenderingMappingEditor.DefaultSource : Source;
            var val = StringUtil.ExtractParameter(name, src).Trim();
            return string.IsNullOrWhiteSpace(val) ? defaultDataSourceValues[name] : val;
        }

        private void LoadValue()
        {
            if (ReadOnly || Disabled)
            {
                return;
            }

            var form = httpContextAccessor.GetCurrent()?.Request.Form;
            if (form == null)
            {
                return;
            }

            var keySuffixLength = Constants.RenderingMappingEditor.ControlSuffixes.Key.Length;
            var valueSuffix = Constants.RenderingMappingEditor.ControlSuffixes.Value;
            var paramsSuffix = Constants.RenderingMappingEditor.ControlSuffixes.Params;
            var uidSuffix = Constants.RenderingMappingEditor.ControlSuffixes.Uid;
            var result = new StringBuilder();
            var isFirstEntry = true;

            foreach (string key in form.Keys)
            {
                if (string.IsNullOrEmpty(key) || !key.Contains(Constants.RenderingMappingEditor.ControlSuffixes.Key))
                {
                    continue;
                }

                var baseId = key.Substring(0, key.Length - keySuffixLength);
                var keyValue = (form[key] ?? string.Empty).Trim();

                if (string.IsNullOrEmpty(keyValue))
                {
                    continue;
                }

                var value = (form[$"{baseId}{valueSuffix}"] ?? string.Empty).Trim();
                var parameters = RenderingMappingValueEscaper.EscapeValue((form[$"{baseId}{paramsSuffix}"] ?? string.Empty).Trim());
                var uid = (form[$"{baseId}{uidSuffix}"] ?? string.Empty).Trim();

                if (!isFirstEntry)
                {
                    result.Append('|');
                }

                if (!string.IsNullOrEmpty(uid))
                {
                    result.AppendFormat(CultureInfo.InvariantCulture, "{0}:{1}:{2}:{3}", keyValue, value, parameters, uid);
                }
                else
                {
                    result.AppendFormat(CultureInfo.InvariantCulture, "{0}:{1}:{2}", keyValue, value, parameters);
                }

                isFirstEntry = false;
            }

            var newValue = result.ToString();
            if (!string.Equals(Value, newValue, StringComparison.Ordinal))
            {
                Value = newValue;
                SetModified();
            }
        }

        private static class Identifiers
        {
            public const string LabelKey = nameof(LabelKey);
            public const string LabelValue = nameof(LabelValue);
            public const string LabelUid = nameof(LabelUid);
            public const string KeySource = nameof(KeySource);
            public const string ValueSource = nameof(ValueSource);
        }
    }
}