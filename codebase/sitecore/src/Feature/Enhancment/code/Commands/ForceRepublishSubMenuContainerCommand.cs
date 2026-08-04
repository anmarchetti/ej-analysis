using System.Linq;
using easyJet.Feature.SitecoreEnhancment.Services;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Configuration;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Feature.SitecoreEnhancment.Commands
{
    public class ForceRepublishSubMenuContainerCommand : BaseSubMenuContainerCommand
    {
        private readonly IAdminService adminService;
        private readonly string rootPath = Settings.GetSetting("ForceRepublish.RootPath");

        public ForceRepublishSubMenuContainerCommand(IAdminService adminService)
        {
            this.adminService = adminService;
        }

        protected override bool IsCommandContextValid(CommandContext context)
        {
            var isAdmin = adminService.IsAdmin();
            var contextItem = context.Items.Any()
                ? context.Items[0]
                : null;
            var isMasterDb = contextItem != null && contextItem.Database.Name == "master";
            var isSupportedRootPath = contextItem != null && contextItem.Paths.Path.StartsWith(rootPath);

            return isAdmin && isMasterDb && isSupportedRootPath;
        }
    }
}