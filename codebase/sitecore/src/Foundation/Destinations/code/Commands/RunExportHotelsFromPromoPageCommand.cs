using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Foundation.Destinations.Commands
{
    public class RunExportHotelsFromPromoPageCommand : ExportingCommand
    {
        public RunExportHotelsFromPromoPageCommand(ISitecoreUIService sitecoreUIService, IDestinationsLogger logger)
            : base(sitecoreUIService, logger)
        {
        }

        /// <inheritdoc />
        protected override bool IsCommandContextValid(CommandContext context)
        {
            var contextItem = context.Items[0];
            return !string.IsNullOrWhiteSpace(contextItem[Constants.Fields.PromoPage.Destination]);
        }
    }
}