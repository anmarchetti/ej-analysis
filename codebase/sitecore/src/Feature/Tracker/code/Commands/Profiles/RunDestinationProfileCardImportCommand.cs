using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Analytics.Logging;
using easyJet.Foundation.Analytics.Models.Profiles;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Items;
using DestinationTemplates = easyJet.Foundation.Destinations.Constants.TemplateIds;

namespace easyJet.Feature.Tracker.Commands.Profiles
{
    public class RunDestinationProfileCardImportCommand : BaseCsvCommand
    {
        private static readonly ID[] TemplateIds = { DestinationTemplates.Resort, DestinationTemplates.VirtualResort };

        private readonly IDestinationsRepository destinationsRepository;
        private readonly IProfileService profileService;
        private readonly IDatabaseProvider databaseProvider;

        internal virtual List<T> GetFileDataFromItem<T>(Item item)
            where T : class, new() => GetFileData<T>(item);

        public RunDestinationProfileCardImportCommand(
            IDestinationsRepository destinationsRepository,
            ICsvUtilsService csvUtilsService,
            IProfileService profileService,
            IDatabaseProvider databaseProvider,
            IAnalyticsLogger logger,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, csvUtilsService, logger, userCreationService, sitecoreUiService)
        {
            this.destinationsRepository = destinationsRepository;
            this.profileService = profileService;
            this.databaseProvider = databaseProvider;
        }

        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            var itemsToUpdate = GetFileDataFromItem<LocationProfileTypeCsv>(contextItem);
            var itemsByCode = itemsToUpdate.ToDictionary(item => item.Code, item => item);
            var regions = destinationsRepository.SearchByCodes(itemsByCode.Keys.ToList()).Hits.Select(x => x.Document);

            foreach (var regionHit in regions)
            {
                var importData = itemsByCode[regionHit.Code];
                var regionItem = databaseProvider.GetItem(regionHit.Uri);
                profileService.TagGenericProfile(regionItem, new HotelThemesProfile(importData.Beach, importData.City, importData.Lakes), new TagChildrenSettings(true, TemplateIds));
                yield return regionItem;
            }
        }
    }
}