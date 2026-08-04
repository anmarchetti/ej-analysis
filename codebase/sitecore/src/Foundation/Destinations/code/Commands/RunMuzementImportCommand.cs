using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Extensions;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Domain.Muzement;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Helper;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Commands
{
    public class RunMuzementImportCommand : BaseCsvCommand
    {
        private readonly IDestinationsSearchService destinationsSearch;

        public RunMuzementImportCommand(
            ICsvUtilsService csvUtilsService,
            IDatabaseProvider databaseProvider,
            IDestinationsLogger logger,
            IDestinationsSearchService destinationsSearch,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, csvUtilsService, logger, userCreationService, sitecoreUiService)
        {
            this.destinationsSearch = destinationsSearch;
        }

        /// <summary>
        /// Synchronize items from supplied file.
        /// </summary>
        /// <param name="contextItem">Context item.</param>
        /// <returns>Updated regions items.</returns>
        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            var uploadData = GetFileData<DestinationMappingRow>(contextItem)
                .Where(x => !string.IsNullOrWhiteSpace(x.Region) && !string.IsNullOrWhiteSpace(x.RegionId) && !(x.RegionId.Equals("0") && x.ResortId.Equals("0")))
                .Distinct(new DestinationMappingRowComparer())
                .GroupBy(x => x.Region)
                .Select(x => new MuzementRegionData(x))
                .ToList();

            var codes = uploadData.SelectMany(x => x.Codes).ToArray();

            var destinations = destinationsSearch.GetDestinationsByCodes(codes, true).Select(x => DatabaseProvider.GetItem(x.Uri));
            var resortsByRegions = destinations.GroupBy(x => x.Parent.ID).ToDictionary(x => x.First().Parent, x => x.ToList());

            var processedItems = new List<Item>();
            contextItem.ExecuteItemFieldAction(Constants.Fields.Message.Output, field => field.Value = ItemContextJobHelper.GetLogMessage("Job started"));

            foreach (var resortsByRegion in resortsByRegions)
            {
                try
                {
                    var regionItem = resortsByRegion.Key;
                    var resortItems = resortsByRegion.Value.ToList();

                    var data = uploadData.FirstOrDefault(x => x.RegionName.Equals(regionItem.Name, StringComparison.OrdinalIgnoreCase));

                    if (data == null)
                    {
                        continue;
                    }

                    // update resorts if there is any to update
                    if (data.ResortDataByCodes.Any())
                    {
                        foreach (var resortItem in resortItems)
                        {
                            var muzementId = data.ResortDataByCodes[resortItem[Constants.Fields.DatasourceItem.Code]];
                            resortItem.ExecuteItemFieldAction(Constants.Fields.Region.MuzementId, field => field.Value = muzementId.musementId);
                            processedItems.Add(resortItem);
                        }
                    }

                    // update region
                    regionItem.ExecuteItemFieldAction(Constants.Fields.Region.MuzementId, field => field.Value = data.GetRegionMusement());
                    processedItems.Add(regionItem);
                }
                catch (Exception ex)
                {
                    contextItem.ExecuteItemFieldAction(
                        Constants.Fields.Message.Output,
                        field => field.Value += ItemContextJobHelper.GetLogMessage($"Something goes wrong during the muzement import command. Please contact the administrator"));
                    Logger.Error($"Error {ex.Message} while processing destination mapping command.", ex, this);
                    return processedItems;
                }
            }

            contextItem.ExecuteItemFieldAction(Constants.Fields.Message.Output, field => field.Value += ItemContextJobHelper.GetLogMessage("Job finished"));

            return processedItems;
        }
    }
}