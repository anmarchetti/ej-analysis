using System.Linq;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Foundation.Destinations.Commands
{
    public class RunBoardTypesExportCommand : ExportingCommand
    {
        public RunBoardTypesExportCommand(ISitecoreUIService sitecoreUIService, IDestinationsLogger logger)
            : base(sitecoreUIService, logger)
        {
        }

        /// <summary>
        /// Hide or show command in context menu.
        /// </summary>
        /// <param name="context">Cotnext item.</param>
        /// <returns>Command state.</returns>
        public override CommandState QueryState(CommandContext context)
        {
            var item = context.Items.FirstOrDefault();

            if (item == null)
            {
                return CommandState.Hidden;
            }

            return item.TemplateID.Equals(Multisite.Templates.Data.Id) && IsCommandContextValid(context) ? CommandState.Enabled : CommandState.Hidden;
        }
    }
}