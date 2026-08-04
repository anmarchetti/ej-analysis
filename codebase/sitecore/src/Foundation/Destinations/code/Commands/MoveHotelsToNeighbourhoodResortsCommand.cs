using System.Collections.Generic;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;

namespace easyJet.Foundation.Destinations.Commands
{
    public class MoveHotelsToNeighbourhoodResortsCommand : BaseContextMenuPowershellScriptCommand
    {
        protected override string CommandTitle => "Move Hotels";

        public MoveHotelsToNeighbourhoodResortsCommand(IAdminService adminService, ISitecoreUIService sitecoreUiService, IUserCreationService userCreationService)
            : base(adminService, sitecoreUiService, userCreationService)
        {
        }

        protected override bool RequiresAdminUser => true;

        protected override bool IsEnabled => true;

        protected override ID ScriptId => Constants.ItemIds.MoveHotelsToNeighbourhoodResortsScript;

        protected override string Database => "master";

        protected override HashSet<ID> AllowedTemplates => new HashSet<ID>
        {
            Constants.TemplateIds.Resort,
        };
    }
}