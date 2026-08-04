using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using easyJet.Foundation.Analytics.Helpers;
using easyJet.Foundation.Analytics.Logging;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Text;
using DestinationTemplates = easyJet.Foundation.Destinations.Constants.TemplateIds;

[assembly: InternalsVisibleTo("easyJet.Feature.Tracker.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Feature.Tracker.Commands.Profiles
{
    public class RunDestinationProfileCardExportCommand : ExportingCommand
    {
        private const string Delimiter = ",";

        private readonly IDestinationsRepository destinationsRepository;
        private readonly ICustomCacheRepository cacheRepository;
        private readonly ICsvUtilsService csvUtilsService;
        private readonly IDatabaseProvider databaseProvider;

        public RunDestinationProfileCardExportCommand(
            IDestinationsRepository destinationsRepository,
            ICustomCacheRepository cacheRepository,
            ICsvUtilsService csvUtilsService,
            IDatabaseProvider databaseProvider,
            ISitecoreUIService sitecoreUIService,
            IAnalyticsLogger logger)
            : base(sitecoreUIService, logger)
        {
            this.destinationsRepository = destinationsRepository;
            this.cacheRepository = cacheRepository;
            this.csvUtilsService = csvUtilsService;
            this.databaseProvider = databaseProvider;
        }

        public override void Execute(CommandContext context)
        {
            var item = context.Items.FirstOrDefault();
            var endpoint = context.Parameters.Get(Foundation.SitecoreExtensions.Constants.QueryStringParams.Endpoint);
            CacheExportData(item);
            SitecoreUIService.SheerResponse_Eval($"window.open('{new UrlString(endpoint)}');");
        }

        private static LocationProfileTypeCsv MapItemToCsvModel(Item item)
        {
            var itemHotelThemeProfile = ProfileCardHelper.GetHotelThemeProfile(item);

            return new LocationProfileTypeCsv
            {
                Name = item[Foundation.Destinations.Constants.Fields.DatasourceItem.Name],
                Code = item[Foundation.Destinations.Constants.Fields.DatasourceItem.Code],
                Beach = itemHotelThemeProfile.Beach,
                City = itemHotelThemeProfile.City,
                Lakes = itemHotelThemeProfile.Lakes
            };
        }

        private static bool IsResortTemplate(Item item) =>
            item.TemplateID.Equals(DestinationTemplates.Resort) ||
            item.TemplateID.Equals(DestinationTemplates.VirtualResort);

        private void CacheExportData(Item contextItem)
        {
            var exportResortsData = new CheckboxField(contextItem.Fields[Constants.Profiles.Fields.ExportResortsCheckbox]).Checked;
            var regions = destinationsRepository.GetAllRegions();
            var dataToExport = new List<LocationProfileTypeCsv>();

            foreach (var regionItem in regions.Select(region => databaseProvider.GetItem(region.Document.Uri)))
            {
                dataToExport.Add(MapItemToCsvModel(regionItem));
                if (!exportResortsData)
                {
                    continue;
                }

                var resorts = regionItem.Children.Where(IsResortTemplate).Select(MapItemToCsvModel).ToList();
                dataToExport.AddRange(resorts);
            }

            var data = csvUtilsService.WriteToCsv(dataToExport, Delimiter);
            cacheRepository.StoreItem(Constants.Profiles.HotelThemesProfileExportCacheKey, data, 5);
        }
    }
}