using System.Collections.Generic;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Abstractions;
using Sitecore.Data;

namespace easyJet.Feature.SitecoreEnhancment.Commands
{
    public class GenerateContentSyncScriptCommand : BaseContextMenuPowershellScriptCommand
    {
        private readonly BaseSettings baseSettings;

        public GenerateContentSyncScriptCommand(IAdminService adminService, BaseSettings baseSettings, ISitecoreUIService sitecoreUiService, IUserCreationService userCreationService)
            : base(adminService, sitecoreUiService, userCreationService)
        {
            this.baseSettings = baseSettings;
        }

        protected override HashSet<string> AllowedPaths => new HashSet<string> { baseSettings.GetSetting("GenerateContentSyncScripts.RootPath") };

        protected override bool RequiresAdminUser => true;

        protected override bool IsEnabled => baseSettings.GetBoolSetting("GenerateContentSyncScripts.IsEnabled", false);

        protected override ID ScriptId => Constants.ItemIds.GenerateContentSyncScriptID;

        protected override string Database => "master";
    }
}