using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.Destinations.Repositories;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Atcom.Services
{
    [Service(typeof(IRegionRestrictionService), Lifetime = Lifetime.Singleton)]
    public class RegionRestrictionService : IRegionRestrictionService
    {
        private readonly ISearchDatasourceRepository searchDatasource;

        public RegionRestrictionService(ISearchDatasourceRepository searchDatasource)
        {
            this.searchDatasource = searchDatasource;
        }

        public Item GetSettingsItem(string settingsPath) => Database.GetDatabase("master").GetItem(settingsPath);

        /// <summary>
        /// returns items that restrict the sync to certain regions, if empty the restriction will be skipped
        /// </summary>
        /// <param name="settingsItem">settings item</param>
        /// <returns>region page items configured in the given settings item</returns>
        public List<Item> GetRegionRestrictionItems(Item settingsItem)
        {
            Sitecore.Data.Fields.MultilistField multilistField = settingsItem?.Fields[Constants.Atcom.Fields.RoomTypeFacilitiesSyncRegionRestriction];
            var codes = multilistField?.GetItems().Select(i => i[Constants.Fields.DatasourceItem.Code]).ToList() ?? new List<string>();
            return codes.Select(c => searchDatasource.GetItemByCode(c, Constants.TemplateIds.RegionPage, false)).Where(region => region != null).ToList();
        }
    }
}