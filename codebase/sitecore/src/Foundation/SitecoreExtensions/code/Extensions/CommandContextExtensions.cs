using System.Linq;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Foundation.SitecoreExtensions.Extensions
{
    public static class CommandContextExtensions
    {
        public static Item GetContextItem(this CommandContext instance)
            => instance.Items.Any() ? instance.Items[0] : null;
    }
}
