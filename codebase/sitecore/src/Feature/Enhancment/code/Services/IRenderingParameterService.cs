using System.Collections.Generic;
using Sitecore.Data;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    /// <summary>
    ///     Service for parsing and handling rendering parameters strings.
    /// </summary>
    public interface IRenderingParameterService
    {
        /// <summary>
        ///     Parses a parameters string and splits into standard (well-known) and custom buckets.
        /// </summary>
        /// <param name="parameters">Raw parameters string (query-string-like).</param>
        /// <param name="renderingId">Rendering ID used for context; may be empty.</param>
        /// <returns>Tuple of dictionaries (standard, custom) with case-insensitive keys.</returns>
        (Dictionary<string, string> standard, Dictionary<string, string> custom) ParseAndCategorizeParameters(string parameters, string renderingId);

        /// <summary>
        ///     Extracts the updated parameters string from a Field Editor result handle/return value.
        /// </summary>
        /// <param name="result">The string returned by the modal dialog pipeline.</param>
        /// <param name="renderingId">The rendering that was edited.</param>
        /// <param name="useBasicParams">Whether the basic editor was used.</param>
        /// <returns>Normalized parameters string.</returns>
        string ExtractParametersFromFieldEditorResult(string result, ID renderingId, bool useBasicParams);

        /// <summary>
        ///     Returns the set of standard field names for the given rendering (or global standard names when not available).
        /// </summary>
        /// <param name="renderingId">Rendering id string (may be empty)</param>
        /// <returns>Enumerable of standard field names (case preserved).</returns>
        IEnumerable<string> GetStandardFieldNames(string renderingId);
    }
}