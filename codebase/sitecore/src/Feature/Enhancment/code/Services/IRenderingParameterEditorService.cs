using System.Collections.Specialized;
using Sitecore.Data;
using Sitecore.Text;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    /// <summary>
    /// Service for handling rendering parameter editing operations.
    /// </summary>
    public interface IRenderingParameterEditorService
    {
        /// <summary>
        /// Parses metadata string from the edit parameters click event.
        /// </summary>
        /// <param name="metadata">Pipe-delimited metadata string.</param>
        /// <returns>Parsed metadata with hiddenFieldId, dropdownId, and hiddenFieldClientId.</returns>
        (string HiddenFieldId, string DropdownId, string HiddenFieldClientId) ParseEditParametersMetadata(string metadata);

        /// <summary>
        /// Creates the pipeline parameters for the edit parameters pipeline.
        /// </summary>
        /// <param name="hiddenFieldId">Hidden field ID.</param>
        /// <param name="dropdownId">Dropdown ID.</param>
        /// <param name="hiddenFieldClientId">Hidden field client ID.</param>
        /// <returns>NameValueCollection with pipeline parameters.</returns>
        NameValueCollection CreatePipelineParameters(string hiddenFieldId, string dropdownId, string hiddenFieldClientId);

        /// <summary>
        /// Validates and parses the rendering ID from a form value.
        /// </summary>
        /// <param name="renderingValue">The rendering value from the form.</param>
        /// <param name="renderingId">The parsed rendering ID if valid.</param>
        /// <returns>True if valid, false otherwise.</returns>
        bool TryParseRenderingId(string renderingValue, out ID renderingId);

        /// <summary>
        /// Gets the field editor URL options for a rendering.
        /// </summary>
        /// <param name="renderingId">The rendering ID.</param>
        /// <param name="currentParams">Current parameters string.</param>
        /// <returns>URL options including the URL and whether to use basic params.</returns>
        FieldEditorUrlOptions GetFieldEditorUrlOptions(ID renderingId, string currentParams);

        /// <summary>
        /// Processes the field editor result and extracts updated parameters.
        /// </summary>
        /// <param name="result">The field editor result handle.</param>
        /// <param name="renderingId">The rendering ID.</param>
        /// <param name="useBasicParams">Whether basic parameters were used.</param>
        /// <returns>Updated parameters string.</returns>
        string ProcessFieldEditorResult(string result, ID renderingId, bool useBasicParams);
    }

    /// <summary>
    /// Options for the field editor URL.
    /// </summary>
    public class FieldEditorUrlOptions
    {
        /// <summary>
        /// Gets or sets the URL for the field editor.
        /// </summary>
        public UrlString Url { get; set; }

        /// <summary>
        /// Gets or sets whether to use basic rendering properties.
        /// </summary>
        public bool UseBasicParams { get; set; }

        /// <summary>
        /// Gets or sets the dialog width.
        /// </summary>
        public string Width { get; set; }

        /// <summary>
        /// Gets or sets the dialog height.
        /// </summary>
        public string Height { get; set; }

        /// <summary>
        /// Gets or sets the dialog header title.
        /// </summary>
        public string Header { get; set; }
    }
}
