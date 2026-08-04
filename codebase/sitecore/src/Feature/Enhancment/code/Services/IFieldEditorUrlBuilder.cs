using Sitecore.Data;
using Sitecore.Text;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    /// <summary>
    ///     Responsible for building URLs to open parameter editors for renderings.
    /// </summary>
    public interface IFieldEditorUrlBuilder
    {
        /// <summary>
        ///     Builds a Field Editor URL for the given rendering if an advanced parameters template is available.
        ///     Returns null if advanced editor cannot be used.
        /// </summary>
        UrlString BuildFieldEditorUrl(ID renderingId, string currentParams);

        /// <summary>
        ///     Builds a fallback URL for basic rendering properties editing.
        /// </summary>
        UrlString BuildBasicRenderingPropertiesUrl(string currentParams);
    }
}