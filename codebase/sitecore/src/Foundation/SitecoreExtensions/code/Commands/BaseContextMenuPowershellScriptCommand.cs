using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.SitecoreExtensions.Commands
{
    public abstract class BaseContextMenuPowershellScriptCommand : BaseAsyncCommand
    {
        protected abstract bool RequiresAdminUser { get; }

        private readonly ISitecoreUIService sitecoreUiService;
        private readonly IAdminService adminService;

        protected BaseContextMenuPowershellScriptCommand(IAdminService adminService, ISitecoreUIService sitecoreUiService, IUserCreationService userCreationService)
            : base(userCreationService)
        {
            this.adminService = adminService;
            this.sitecoreUiService = sitecoreUiService;
        }

        protected abstract bool IsEnabled { get; }

        protected abstract ID ScriptId { get; }

        protected abstract string Database { get; }

        protected virtual HashSet<ID> AllowedTemplates { get; } = null;

        protected virtual HashSet<ID> AllowedItems { get; } = null;

        protected virtual HashSet<string> AllowedPaths { get; } = null;

        public override void Execute(CommandContext context)
        {
            Item contextItem = context.GetContextItem();
            sitecoreUiService.ClientPage_SendMessage(this, $"item:executescript(id={contextItem.ID},db={contextItem.Database.Name},script={ScriptId},scriptDb={Database})");
        }

        protected internal override bool IsCommandContextValid(CommandContext context)
        {
            return IsEnabled
                   && (!RequiresAdminUser || adminService.IsAdmin())
                   && (AllowedTemplates?.Contains(context.Items[0].TemplateID) ?? true)
                   && (AllowedItems?.Contains(context.Items[0].ID) ?? true)
                   && (AllowedPaths?.Any(i => context.Items[0].Paths.Path.StartsWith(i)) ?? true)
                   && (context.GetContextItem()?.Database.Name.Equals(Database) ?? false);
        }

        protected override void Action(ClientPipelineArgs args)
        {
            sitecoreUiService.ClientPage_SendMessage(this, $"item:refreshchildren(id={args.Parameters[SourceId]})");
        }

        protected override void PostAction(ClientPipelineArgs args)
        {
            sitecoreUiService.ClientPage_SendMessage(this, $"item:refreshchildren(id={args.Parameters[SourceId]})");
        }
    }
}