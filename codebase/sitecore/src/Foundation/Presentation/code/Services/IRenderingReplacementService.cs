using System.Linq;
using System.Xml.Linq;
using easyJet.Foundation.Presentation.Models;
using Sitecore.Data;

namespace easyJet.Foundation.Presentation.Services
{
    public interface IRenderingReplacementService
    {
        /// <summary>
        /// Replaces the attributes of a rendering XML element with values derived from a rendering mapping.
        /// </summary>
        /// <param name="renderingElement">The rendering XML element to update.</param>
        /// <param name="mapping">The mapping containing the replacement values and parameters.</param>
        void ReplaceRendering(XElement renderingElement, RenderingMapping mapping);

        /// <summary>
        /// Resolves the appropriate replacement mapping for the given rendering element and applies it.
        /// Performs a UID-aware lookup: prefers an entry whose UID matches the element's uid attribute,
        /// falling back to a wildcard entry (Uid == Guid.Empty). Verifies the replacement item exists
        /// in the context database before applying.
        /// </summary>
        /// <param name="renderingElement">The rendering XML element to update in-place.</param>
        /// <param name="renderingId">The source rendering item ID.</param>
        /// <param name="replacements">The lookup of available replacement mappings keyed by source rendering ID.</param>
        /// <returns><c>true</c> if a replacement was found and applied; otherwise <c>false</c>.</returns>
        bool TryApplyReplacement(XElement renderingElement, ID renderingId, ILookup<ID, RenderingMapping> replacements);
    }
}
