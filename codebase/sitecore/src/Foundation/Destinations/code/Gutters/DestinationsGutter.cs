using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.Shell.Applications.ContentEditor.Gutters;

namespace easyJet.Foundation.Destinations.Gutters
{
    public class DestinationsGutter : GutterRenderer
    {
        private readonly string recentlyAddedDestinationIcon;

        public DestinationsGutter()
        {
            recentlyAddedDestinationIcon = Settings.GetSetting("Destinations.RecentlyAddedDestinationIcon");
        }

        /// <summary>
        /// Get gutter icon for destinations which does not contain page components folder or child folders.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <returns>Gutter icon.</returns>
        protected override GutterIconDescriptor GetIconDescriptor(Item item)
        {
            if (item.IsDestinationItem())
            {
                // Recently added destination when destination does not contain page components folder or other folders.
                var isRecentlyAddedDestination = !item.Children.Any() || item.Children.Count(x => x.TemplateID.Equals(Constants.TemplateIds.PageComponentsFolder)) == item.Children.Count;

                // Check that destination (NOT Hotel) item does not contain any folders in page components folder.
                if (!item.TemplateID.Equals(Constants.TemplateIds.Accommodation) && isRecentlyAddedDestination)
                {
                    isRecentlyAddedDestination = !item.Children
                        .Any(x => x.TemplateID.Equals(Constants.TemplateIds.PageComponentsFolder) && x.Children.Any());
                }

                if (isRecentlyAddedDestination)
                {
                    return new GutterIconDescriptor()
                    {
                        Icon = recentlyAddedDestinationIcon
                    };
                }
            }

            return base.GetIconDescriptor(item);
        }
    }
}