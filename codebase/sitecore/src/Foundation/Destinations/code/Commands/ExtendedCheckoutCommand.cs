using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Foundation.Destinations.Commands
{
    public class ExtendedCheckoutCommand : CheckOut
    {
        /// <summary>
        /// Create new version of locked item if item's version is last.
        /// </summary>
        /// <param name="context">Context data.</param>
        public override void Execute(CommandContext context)
        {
            var lockedItem = context.Items.FirstOrDefault();

            if (lockedItem != null && lockedItem.IsLatestVersion() && lockedItem.IsAccommodationChildItem())
            {
                var newLockedItem = lockedItem.Versions.AddVersion();
                context.Items[0] = newLockedItem;
            }

            base.Execute(context);
        }
    }
}