using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;

namespace easyJet.Foundation.HotelBeds.Commands
{
    public class RunFacilitiesExportCommand : ExportingCommand
    {
        public RunFacilitiesExportCommand(ISitecoreUIService sitecoreUIService, IHotelBedsLogger logger)
            : base(sitecoreUIService, logger)
        {
        }
    }
}