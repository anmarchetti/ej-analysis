using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Items;
using Sitecore.Shell.Applications.ContentEditor.Gutters;

namespace easyJet.Foundation.Destinations.Gutters
{
    public class DestinationsLanguageGutter : GutterRenderer
    {
        private const string IconPath = "Applications/32x32/document_delete.png";

        /// <summary>
        /// Get gutter icon for destinations which does not contain language version in current language context.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <returns>Gutter icon.</returns>
        protected override GutterIconDescriptor GetIconDescriptor(Item item)
        {
            if (item.IsDestinationItem()
                || item.IsVirtualDestinationItem())
            {
                if (!item.HasVersion())
                {
                    GutterIconDescriptor iconDescriptor = new GutterIconDescriptor
                    {
                        Icon = IconPath,
                        Tooltip = $"Missing {item.Language.CultureInfo.EnglishName} version"
                    };

                    return iconDescriptor;
                }
            }

            return null;
        }
    }
}