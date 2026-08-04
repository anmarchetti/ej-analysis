using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Services;
using easyJet.Foundation.Atcom.Services.Sync;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Foundation.Atcom.Commands
{
    public class RunAccommodationsSyncCommand : BaseItemProgressReportingCommand
    {
        private readonly ISyncDataService service;
        private readonly IVrpWebService vrpWebservice;
        private readonly ISearchService searchService;

        public RunAccommodationsSyncCommand(
            ISyncDataService service,
            IVrpWebService vrpWebservice,
            ISearchService searchService,
            IAtcomLogger logger,
            IDatabaseProvider databaseProvider,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, logger, userCreationService, sitecoreUiService)
        {
            this.service = service;
            this.vrpWebservice = vrpWebservice;
            this.searchService = searchService;
        }

        /// <inheritdoc />
        protected override bool IsCommandContextValid(CommandContext context)
        {
            return context.Items[0].TemplateID.Equals(Constants.TemplateIds.Resort);
        }

        /// <inheritdoc />
        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            var code = contextItem.Fields[Constants.Fields.DatasourceItem.Code]?.Value;

            if (!string.IsNullOrEmpty(code))
            {
                Sitecore.Jobs.ContextJob.AddMessage($"Requesting data from {nameof(vrpWebservice)}");
                var vrpDataByCode = vrpWebservice.GetDataCollection();
                Sitecore.Jobs.ContextJob.AddMessage($"Requesting data from {nameof(searchService)}");
                var accommodationsByCode = searchService.GetDataCollection();

                return service.SyncAccommodations(code, Constants.TemplateIds.Accommodation, contextItem, vrpDataByCode, accommodationsByCode);
            }
            else
            {
                return Enumerable.Empty<Item>();
            }
        }
    }
}