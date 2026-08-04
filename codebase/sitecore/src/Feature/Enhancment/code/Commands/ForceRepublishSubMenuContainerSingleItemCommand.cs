using easyJet.Foundation.SitecoreExtensions.Commands;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Feature.SitecoreEnhancment.Commands
{
    public class ForceRepublishSubMenuContainerSingleItemCommand : BaseSubMenuContainerCommand
    {
        protected override bool IsCommandContextValid(CommandContext context)
            => true;
    }
}