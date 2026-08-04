using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;

namespace easyJet.Foundation.Destinations.Commands
{
    public class RunThemesExportCommand : ExportingCommand
    {
        public RunThemesExportCommand(ISitecoreUIService sitecoreUIService, IDestinationsLogger logger)
            : base(sitecoreUIService, logger)
        {
        }
    }
}