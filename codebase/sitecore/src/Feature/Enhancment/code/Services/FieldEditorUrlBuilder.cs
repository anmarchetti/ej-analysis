using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Shell.Applications.WebEdit;
using Sitecore.Text;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    /// <summary>
    ///     Default implementation that builds URLs for rendering parameter editing.
    /// </summary>
    public class FieldEditorUrlBuilder : IFieldEditorUrlBuilder
    {
        private readonly IDatabaseProvider databaseProvider;
        private readonly IRenderingMappingLogger logger;
        private readonly ITemplateService templateService;

        /// <summary>
        /// Initializes a new instance of the <see cref="FieldEditorUrlBuilder"/> class.
        /// </summary>
        public FieldEditorUrlBuilder(IDatabaseProvider databaseProvider, IRenderingMappingLogger logger)
            : this(databaseProvider, logger, new TemplateService(logger))
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="FieldEditorUrlBuilder"/> class with template service injection.
        /// </summary>
        public FieldEditorUrlBuilder(IDatabaseProvider databaseProvider, IRenderingMappingLogger logger, ITemplateService templateService)
        {
            this.databaseProvider = databaseProvider ?? throw new ArgumentNullException(nameof(databaseProvider));
            this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
            this.templateService = templateService ?? throw new ArgumentNullException(nameof(templateService));
        }

        /// <inheritdoc/>
        public UrlString BuildFieldEditorUrl(ID renderingId, string currentParams)
        {
            if (renderingId.IsNull)
            {
                return null;
            }

            var renderingItem = databaseProvider.GetItem(renderingId, DatabaseType.Master);
            if (renderingItem == null)
            {
                return null;
            }

            var parametersTemplateItem = GetParametersTemplateItem(renderingItem);
            if (parametersTemplateItem == null)
            {
                return null;
            }

            var parsedParams = HttpUtility.ParseQueryString(currentParams ?? string.Empty);
            var fieldDescriptors = new List<FieldDescriptor>();
            var addedFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            var masterDb = databaseProvider.GetDatabase(DatabaseType.Master);
            var stdParamsDbItem = masterDb.GetItem(Constants.TemplateIds.StandardRenderingParameters);
            if (stdParamsDbItem != null)
            {
                fieldDescriptors.AddRange(BuildDescriptorsFromTemplateService(stdParamsDbItem, parsedParams, addedFields));
            }

            fieldDescriptors.AddRange(BuildDescriptorsFromTemplateService(parametersTemplateItem, parsedParams, addedFields));

            if (fieldDescriptors.Count == 0)
            {
                return null;
            }

            var options = new RenderingParametersFieldEditorOptions(fieldDescriptors)
            {
                DialogTitle = Constants.RenderingMappingEditor.EditRenderingParametersDialogTitle,
                SaveItem = false,
                PreserveSections = true,
                Parameters =
                {
                    [Constants.RenderingMappingEditor.PipelineParameters.Rendering] = renderingItem.Uri?.ToString() ?? string.Empty
                }
            };

            return options.ToUrlString();
        }

        /// <inheritdoc/>
        public UrlString BuildBasicRenderingPropertiesUrl(string currentParams)
        {
            var parsedParams = HttpUtility.ParseQueryString(currentParams ?? string.Empty);

            var masterDb = databaseProvider.GetDatabase(DatabaseType.Master);
            var stdParamsDbItem = masterDb.GetItem(Constants.TemplateIds.StandardRenderingParameters);

            var fieldDescriptors = new List<FieldDescriptor>();

            if (stdParamsDbItem != null)
            {
                var addedFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                fieldDescriptors.AddRange(BuildDescriptorsFromTemplateService(stdParamsDbItem, parsedParams, addedFields));
            }

            if (fieldDescriptors.Count == 0)
            {
                var url = new UrlString(Constants.RenderingMappingEditor.ResourcePaths.FieldEditor)
                {
                    [Constants.RenderingMappingEditor.FieldNames.Placeholder] = parsedParams[Constants.RenderingMappingEditor.FieldNames.Placeholder] ?? string.Empty,
                    [Constants.RenderingMappingEditor.FieldNames.DataSource] = parsedParams[Constants.RenderingMappingEditor.FieldNames.DataSource] ?? string.Empty
                };
                return url;
            }

            var options = new RenderingParametersFieldEditorOptions(fieldDescriptors)
            {
                DialogTitle = Constants.RenderingMappingEditor.EditRenderingPropertiesDialogTitle,
                SaveItem = false,
                PreserveSections = false
            };

            return options.ToUrlString();
        }

        private IEnumerable<FieldDescriptor> BuildDescriptorsFromTemplateService(
            Item templateItem,
            System.Collections.Specialized.NameValueCollection parsedParams,
            HashSet<string> addedFields)
        {
            var descriptorInfos = templateService.BuildFieldDescriptors(templateItem, parsedParams, addedFields);

            foreach (var info in descriptorInfos)
            {
                if (info.ContextItem == null || string.IsNullOrEmpty(info.FieldName))
                {
                    continue;
                }

                FieldDescriptor descriptor;
                try
                {
                    descriptor = new FieldDescriptor(info.ContextItem, info.FieldName)
                    {
                        Value = info.Value,
                        ContainsStandardValue = info.ContainsStandardValue
                    };
                }
                catch (Exception ex)
                {
                    // Log and skip fields that cannot be turned into descriptors
                    // This can happen if the field doesn't exist on the item
                    logger?.Warn("Failed creating field descriptor.", ex, this);
                    continue;
                }

                yield return descriptor;
            }
        }

        private Item GetParametersTemplateItem(Item renderingItem)
        {
            var parametersTemplateField = renderingItem.Fields[Constants.RenderingMappingEditor.FieldNames.ParametersTemplate];
            if (parametersTemplateField == null || string.IsNullOrEmpty(parametersTemplateField.Value))
            {
                return null;
            }

            if (ID.TryParse(parametersTemplateField.Value, out var templateId))
            {
                return databaseProvider.GetItem(templateId, DatabaseType.Master) ?? renderingItem.Database?.GetItem(templateId);
            }

            return null;
        }
    }
}
