using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.SitecoreExtensions.Logger;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Foundation.SitecoreExtensions.Commands
{
    [ExcludeFromCodeCoverage]
    public abstract class BaseProgressReportingContextMenuCommand<T> : BaseProgressReportingCommand<T>
    where T : class
    {
        protected virtual HashSet<ID> AllowedTemplates { get; } = new HashSet<ID>();

        protected virtual HashSet<ID> AllowedItems { get; } = new HashSet<ID>();

        protected internal override bool IsCommandContextValid(CommandContext context) => AllowedTemplates.Contains(context.Items[0].TemplateID) || AllowedItems.Contains(context.Items[0].ID);

        protected BaseProgressReportingContextMenuCommand(
            IDatabaseProvider databaseProvider,
            ILogger logger,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, logger, userCreationService, sitecoreUiService)
        {
        }
    }
}