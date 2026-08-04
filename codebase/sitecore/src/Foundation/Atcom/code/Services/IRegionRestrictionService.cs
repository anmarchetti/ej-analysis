using System.Collections.Generic;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Atcom.Services
{
    public interface IRegionRestrictionService
    {
        Item GetSettingsItem(string settingsPath);

        List<Item> GetRegionRestrictionItems(Item settingsItem);
    }
}