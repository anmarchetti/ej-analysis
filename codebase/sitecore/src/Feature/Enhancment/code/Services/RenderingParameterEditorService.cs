using System;
using System.Collections.Specialized;
using Sitecore.Data;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    /// <summary>
    /// Implementation of rendering parameter editor operations.
    /// </summary>
    public class RenderingParameterEditorService : IRenderingParameterEditorService
    {
        private readonly IFieldEditorUrlBuilder fieldEditorUrlBuilder;
        private readonly IRenderingParameterService renderingParameterService;

        public RenderingParameterEditorService(
            IFieldEditorUrlBuilder fieldEditorUrlBuilder,
            IRenderingParameterService renderingParameterService)
        {
            this.fieldEditorUrlBuilder = fieldEditorUrlBuilder;
            this.renderingParameterService = renderingParameterService;
        }

        public (string HiddenFieldId, string DropdownId, string HiddenFieldClientId) ParseEditParametersMetadata(string metadata)
        {
            var parts = (metadata ?? string.Empty).Split(new[] { '|' }, StringSplitOptions.None);
            return (HiddenFieldId: parts.Length > 0 ? parts[0] : string.Empty,
                    DropdownId: parts.Length > 1 ? parts[1] : string.Empty,
                    HiddenFieldClientId: parts.Length > 2 ? parts[2] : string.Empty);
        }

        public NameValueCollection CreatePipelineParameters(string hiddenFieldId, string dropdownId, string hiddenFieldClientId)
        {
            return new NameValueCollection
            {
                { Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldId, hiddenFieldId },
                { Constants.RenderingMappingEditor.PipelineParameters.DropdownId, dropdownId },
                { Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldClientId, hiddenFieldClientId }
            };
        }

        public bool TryParseRenderingId(string renderingValue, out ID renderingId)
        {
            if (ID.TryParse(renderingValue, out renderingId) && !renderingId.IsNull)
            {
                return true;
            }

            renderingId = ID.Null;
            return false;
        }

        public FieldEditorUrlOptions GetFieldEditorUrlOptions(ID renderingId, string currentParams)
        {
            var fieldEditorUrl = fieldEditorUrlBuilder.BuildFieldEditorUrl(renderingId, currentParams);

            if (fieldEditorUrl != null)
            {
                return new FieldEditorUrlOptions
                {
                    Url = fieldEditorUrl,
                    UseBasicParams = false,
                    Width = Constants.RenderingMappingEditor.DialogDimensions.WidthFull,
                    Height = Constants.RenderingMappingEditor.DialogDimensions.HeightFull,
                    Header = Constants.RenderingMappingEditor.EditRenderingParametersDialogTitle
                };
            }

            var basicFieldEditorUrl = fieldEditorUrlBuilder.BuildBasicRenderingPropertiesUrl(currentParams);
            return new FieldEditorUrlOptions
            {
                Url = basicFieldEditorUrl,
                UseBasicParams = true,
                Width = Constants.RenderingMappingEditor.DialogDimensions.WidthFull,
                Height = Constants.RenderingMappingEditor.DialogDimensions.HeightBasic,
                Header = Constants.RenderingMappingEditor.EditRenderingPropertiesDialogTitle
            };
        }

        public string ProcessFieldEditorResult(string result, ID renderingId, bool useBasicParams)
        {
            return renderingParameterService.ExtractParametersFromFieldEditorResult(result, renderingId, useBasicParams);
        }
    }
}
