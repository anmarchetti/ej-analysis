using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Commands;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Feature.SitecoreEnhancment.Commands
{
    public class ForceRepublishSubMenuContainerTreeCommand : BaseSubMenuContainerCommand
    {
        protected override bool IsCommandContextValid(CommandContext context)
            => context.Items.Any() && context.Items[0].HasChildren;
    }
}