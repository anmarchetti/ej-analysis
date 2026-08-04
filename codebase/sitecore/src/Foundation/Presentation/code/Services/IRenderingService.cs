using Sitecore.Data.Items;

namespace easyJet.Foundation.Presentation.Services
{
    public interface IRenderingService
    {
        /// <summary>
        /// Should rendering be hidden accross all pages.
        /// </summary>
        /// <param name="renderingItem">Rendering Item.</param>
        /// <returns>True if rendering should be hidden.</returns>
        bool ShouldRenderingBeHidden(Item renderingItem);
    }
}
