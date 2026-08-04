using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite
{
    public interface IMultiSiteContext
    {
        Item TenantItem { get; }

        Item GetTenantItem(Item item);

        Item SiteItem { get; }

        Item GetSiteItem(Item item);

        Item DataItem { get; }

        Item GetDataItem(Item item);

        Item SettingsItem { get; }

        Item GetSettingsItem(Item item);

        Item SiteMediaItem { get; }

        Item GetSiteMediaItem(Item item);

        Item HomeItem { get; }

        Item GetHomeItem(Item item);

        Item SharedSitesSettingsItem { get; }

        Item GetSharedSitesSettingsItem(Item item);
    }
}