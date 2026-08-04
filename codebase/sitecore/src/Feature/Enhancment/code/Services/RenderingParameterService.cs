using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Shell.Applications.WebEdit;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    /// <summary>
    ///     Default parsing and normalization for rendering parameters.
    /// </summary>
    public class RenderingParameterService : IRenderingParameterService
    {
        private readonly IDatabaseProvider databaseProvider;
        private readonly IRenderingMappingLogger logger;
        private readonly ITemplateService templateService;

        // Lazy-loaded set of standard parameter keys. Built from the StandardRenderingParameters template when available,
        // with a fallback list of common aliases to support environments where the template is not present (tests/CD).
        private readonly Lazy<HashSet<string>> standardKeysLazy;

        /// <summary>
        /// Initializes a new instance of the <see cref="RenderingParameterService"/> class.
        /// </summary>
        public RenderingParameterService()
            : this(new SitecoreDatabaseProvider(), new RenderingMappingLogger())
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="RenderingParameterService"/> class.
        /// </summary>
        public RenderingParameterService(IDatabaseProvider databaseProvider)
            : this(databaseProvider, new RenderingMappingLogger())
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="RenderingParameterService"/> class.
        /// </summary>
        public RenderingParameterService(IDatabaseProvider databaseProvider, IRenderingMappingLogger logger)
            : this(databaseProvider, logger, new TemplateService(logger))
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="RenderingParameterService"/> class with template service injection.
        /// </summary>
        public RenderingParameterService(IDatabaseProvider databaseProvider, IRenderingMappingLogger logger, ITemplateService templateService)
        {
            this.databaseProvider = databaseProvider ?? throw new ArgumentNullException(nameof(databaseProvider));
            this.logger = logger ?? new RenderingMappingLogger();
            this.templateService = templateService ?? throw new ArgumentNullException(nameof(templateService));
            standardKeysLazy = new Lazy<HashSet<string>>(BuildStandardKeys, true);
        }

        /// <inheritdoc/>
        public (Dictionary<string, string> standard, Dictionary<string, string> custom) ParseAndCategorizeParameters(string parameters, string renderingId)
        {
            var std = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            var cust = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            foreach (var kv in ParseParameterString(parameters))
            {
                if (IsStandardKey(kv.Key))
                {
                    std[kv.Key] = kv.Value;
                }
                else
                {
                    cust[kv.Key] = kv.Value;
                }
            }

            return (std, cust);
        }

        /// <inheritdoc/>
        public string ExtractParametersFromFieldEditorResult(string result, ID renderingId, bool useBasicParams)
        {
            if (string.IsNullOrWhiteSpace(result))
            {
                return string.Empty;
            }

            // First, try to parse as a Sitecore Field Editor handle to map field IDs to field names.
            var fieldEditorResult = TryProcessFieldEditorOptions(result, renderingId, useBasicParams);
            if (fieldEditorResult != null)
            {
                return fieldEditorResult;
            }

            // Fallback: Normalize query-string-like results
            return NormalizeQueryStringParameters(result);
        }

        /// <inheritdoc/>
        public IEnumerable<string> GetStandardFieldNames(string renderingId)
        {
            var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            AddGlobalStandardKeys(set);

            if (string.IsNullOrWhiteSpace(renderingId))
            {
                return set;
            }

            AddRenderingSpecificFieldNames(renderingId, set);

            return set;
        }

        private static IEnumerable<KeyValuePair<string, string>> ParseParameterString(string parameters)
        {
            if (string.IsNullOrWhiteSpace(parameters))
            {
                yield break;
            }

            // Normalize separators
            var normalized = parameters.Replace("&amp;", "&").Replace(';', '&');
            foreach (var part in normalized.Split(new[] { '&' }, StringSplitOptions.RemoveEmptyEntries))
            {
                var idx = part.IndexOf('=');
                if (idx < 0)
                {
                    var key = HttpUtility.UrlDecode(part.Trim());
                    if (!string.IsNullOrEmpty(key))
                    {
                        yield return new KeyValuePair<string, string>(key, "true");
                    }

                    continue;
                }

                var rawKey = part.Substring(0, idx).Trim();
                var rawVal = part.Substring(idx + 1).Trim();
                var k = HttpUtility.UrlDecode(rawKey);
                var v = HttpUtility.UrlDecode(rawVal);
                if (!string.IsNullOrEmpty(k))
                {
                    yield return new KeyValuePair<string, string>(k, v ?? string.Empty);
                }
            }
        }

        private string TryProcessFieldEditorOptions(string result, ID renderingId, bool useBasicParams)
        {
            try
            {
                var options = RenderingParametersFieldEditorOptions.Parse(result);
                if (options?.Fields == null || options.Fields.Count == 0)
                {
                    return null;
                }

                var db = databaseProvider.GetDatabase(DatabaseType.Master);
                var templateItem = GetParametersTemplateItem(renderingId, useBasicParams);
                var fieldNameMap = templateService.GetFieldIdToNameMap(templateItem);
                var parsed = HttpUtility.ParseQueryString(string.Empty);

                foreach (var field in options.Fields)
                {
                    var fieldName = ResolveFieldName(field.FieldID, fieldNameMap, db);
                    if (!string.IsNullOrEmpty(fieldName))
                    {
                        parsed[fieldName] = field.Value ?? string.Empty;
                    }
                }

                var qs = parsed.ToString();
                return string.IsNullOrEmpty(qs) ? string.Empty : qs;
            }
            catch (Exception ex)
            {
                logger.Warn("Failed parsing field editor options; falling back to query-string parsing.", ex, this);
                return null;
            }
        }

        private Item GetParametersTemplateItem(ID renderingId, bool useBasicParams)
        {
            var db = databaseProvider.GetDatabase(DatabaseType.Master);
            if (useBasicParams)
            {
                return db.GetItem(Constants.TemplateIds.StandardRenderingParameters);
            }

            if (renderingId.IsNull)
            {
                return null;
            }

            var renderingItem = db.GetItem(renderingId);
            if (renderingItem == null)
            {
                return null;
            }

            var parametersTemplateField = renderingItem.Fields[Constants.RenderingMappingEditor.FieldNames.ParametersTemplate];
            if (parametersTemplateField == null || !ID.TryParse(parametersTemplateField.Value, out var templateId))
            {
                return null;
            }

            return db.GetItem(templateId);
        }

        private string ResolveFieldName(ID fieldId, IDictionary<ID, string> fieldNameMap, Database db)
        {
            if (fieldId.IsNull)
            {
                return null;
            }

            if (fieldNameMap.TryGetValue(fieldId, out var mappedName))
            {
                return mappedName;
            }

            // Fallback: resolve field item name directly
            try
            {
                var fieldItem = db.GetItem(fieldId);
                if (fieldItem != null && !fieldItem.Name.StartsWith("__"))
                {
                    return fieldItem.Name;
                }
            }
            catch (Exception ex)
            {
                logger.Warn("Failed resolving field item name for rendering parameter field.", ex, this);
            }

            return null;
        }

        private string NormalizeQueryStringParameters(string result)
        {
            try
            {
                var db = databaseProvider.GetDatabase(DatabaseType.Master);
                var pairs = ParseParameterString(result)
                    .Select(kv => FormatParameterPair(kv.Key, kv.Value, db))
                    .ToList();

                return string.Join("&", pairs);
            }
            catch (Exception ex)
            {
                logger.Warn("Failed normalizing parameters; returning best-effort encoded pairs.", ex, this);
                var pairs = ParseParameterString(result)
                    .Select(kv => $"{HttpUtility.UrlEncode(kv.Key)}={HttpUtility.UrlEncode(kv.Value)}");
                return string.Join("&", pairs);
            }
        }

        private string FormatParameterPair(string key, string value, Database db)
        {
            var keyName = TranslateGuidKeyToFieldName(key, db);
            return $"{HttpUtility.UrlEncode(keyName)}={HttpUtility.UrlEncode(value)}";
        }

        private string TranslateGuidKeyToFieldName(string key, Database db)
        {
            if (!ID.TryParse(key, out var fieldId))
            {
                return key;
            }

            try
            {
                var fieldItem = db.GetItem(fieldId);
                if (fieldItem != null && !fieldItem.Name.StartsWith("__"))
                {
                    return fieldItem.Name;
                }
            }
            catch (Exception ex)
            {
                logger.Warn("Failed resolving field item for GUID key during fallback normalization.", ex, this);
            }

            return key;
        }

        private void AddGlobalStandardKeys(HashSet<string> set)
        {
            try
            {
                foreach (var k in standardKeysLazy.Value)
                {
                    set.Add(k);
                }
            }
            catch (Exception ex)
            {
                logger.Warn("Failed retrieving global standard keys.", ex, this);
            }
        }

        private void AddRenderingSpecificFieldNames(string renderingId, HashSet<string> set)
        {
            try
            {
                if (!ID.TryParse(renderingId, out var rid))
                {
                    return;
                }

                var db = databaseProvider?.GetDatabase(DatabaseType.Master);
                var renderingItem = db?.GetItem(rid);
                var templateItem = GetRenderingParametersTemplateItem(renderingItem);

                if (templateItem != null)
                {
                    foreach (var name in templateService.GetFieldNames(templateItem))
                    {
                        set.Add(name);
                    }
                }
            }
            catch (Exception ex)
            {
                logger.Warn("Failed building standard field names for rendering.", ex, this);
            }
        }

        private Item GetRenderingParametersTemplateItem(Item renderingItem)
        {
            var db = databaseProvider.GetDatabase(DatabaseType.Master);
            if (renderingItem == null)
            {
                return null;
            }

            var parametersTemplateField = renderingItem.Fields[Constants.RenderingMappingEditor.FieldNames.ParametersTemplate];
            if (parametersTemplateField == null || string.IsNullOrEmpty(parametersTemplateField.Value))
            {
                return null;
            }

            if (!ID.TryParse(parametersTemplateField.Value, out var templateId))
            {
                return null;
            }

            // Use the provided database instead of renderingItem.Database to support testing
            return (db ?? renderingItem.Database)?.GetItem(templateId);
        }

        private HashSet<string> BuildStandardKeys()
        {
            var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // Fallback aliases when the standard template isn't available
            var fallback = new[]
            {
                "Placeholder", "placeholder", "ph",
                "Data Source", "data source", "datasource", "sc_datasource", "ds",
                "Caching", "Cacheable", "VaryByData", "VaryByDevice", "VaryByLogin", "VaryByParm", "VaryByQueryString", "VaryByUser",
                "ClearOnIndexUpdate", "DisableLazyLoading", "SxaTags"
            };

            foreach (var f in fallback)
            {
                set.Add(f);
            }

            try
            {
                var db = databaseProvider?.GetDatabase(DatabaseType.Master);
                if (db == null)
                {
                    return set;
                }

                var stdParamsDbItem = db.GetItem(Constants.TemplateIds.StandardRenderingParameters);
                if (stdParamsDbItem == null)
                {
                    return set;
                }

                foreach (var name in templateService.GetFieldNames(stdParamsDbItem))
                {
                    set.Add(name);
                }
            }
            catch (Exception ex)
            {
                logger.Warn("Failed building standard parameter keys from template.", ex, this);
            }

            return set;
        }

        private bool IsStandardKey(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                return false;
            }

            return standardKeysLazy.Value.Contains(key);
        }
    }
}
