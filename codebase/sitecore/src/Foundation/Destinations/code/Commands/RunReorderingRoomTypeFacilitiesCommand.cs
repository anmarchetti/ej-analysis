using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Commands
{
    public class RunReorderingRoomTypeFacilitiesCommand : BaseCsvCommand
    {
        private readonly IDatasourceRepository datasourceRepository;

        public RunReorderingRoomTypeFacilitiesCommand(
           ICsvUtilsService csvUtilsService,
           IDatasourceRepository datasourceRepository,
           IDestinationsLogger logger,
           IDatabaseProvider databaseProvider,
           IUserCreationService userCreationService,
           ISitecoreUIService sitecoreUiService)
           : base(databaseProvider, csvUtilsService, logger, userCreationService, sitecoreUiService)
        {
            this.datasourceRepository = datasourceRepository;
        }

        /// <summary>
        /// Synchronize items from supplied file.
        /// </summary>
        /// <param name="contextItem">Context item.</param>
        /// <returns>Updated facility types items.</returns>
        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            var roomTypeFacilityReorderingData = GetFileData<RoomTypeFacilityReorderRow>(contextItem)
                .Where(row => !string.IsNullOrWhiteSpace(row.Code) && !string.IsNullOrWhiteSpace(row.Name))
                .GroupBy(x => x.Code).Select(x => x.First()).OrderBy(x => x.Order).ThenBy(x => x.Name);

            foreach (var data in roomTypeFacilityReorderingData)
            {
                var item = datasourceRepository.GetOrCreateItemByCode(data.Name, data.Code, Constants.TemplateIds.FacilityType, contextItem);
                item.Editing.BeginEdit();
                item.Fields[Constants.Fields.StandardFields.SortOrder].Value = data.Order;
                item.Fields[Constants.Fields.DatasourceItem.Name].Value = data.Name;
                item.Fields[Constants.Fields.DatasourceItem.Code].Value = data.Code;
                item.Editing.EndEdit();

                yield return item;
            }
        }
    }
}