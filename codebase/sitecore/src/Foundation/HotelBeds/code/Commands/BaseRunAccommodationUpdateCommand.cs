using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Foundation.HotelBeds.Commands
{
    public abstract class BaseRunAccommodationUpdateCommand : BaseItemProgressReportingCommand
    {
        protected readonly ISyncDataService SyncDataService;

        protected override bool IsCommandContextValid(CommandContext context)
        {
            return context.Items[0].TemplateID.Equals(Destinations.Constants.TemplateIds.Accommodation)
                   && !string.IsNullOrEmpty(context.Items[0].Fields[Destinations.Constants.Fields.AccommodationItem.HotelBedsCode]?.Value);
        }

        protected BaseRunAccommodationUpdateCommand(
            ISyncDataService syncDataService,
            IHotelBedsLogger logger,
            IDatabaseProvider databaseProvider,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, logger, userCreationService, sitecoreUiService)
        {
            SyncDataService = syncDataService;
        }
    }
}