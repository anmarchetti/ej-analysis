using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite
{
    [Service(typeof(IMultiSiteContext), Lifetime = Lifetime.Singleton)]
    public class MultiSiteContext : IMultiSiteContext
    {
        public Item TenantItem => GetTenantItem(Sitecore.Context.Item);

        public Item GetTenantItem(Item item)
        {
            return item.GetParentOfTemplate(Templates.Tenant.Id);
        }

        public Item SiteItem => GetSiteItem(Sitecore.Context.Item);

        public Item GetSiteItem(Item item)
        {
            return item.GetParentOfTemplate(Templates.Site.Id);
        }

        public Item DataItem => GetDataItem(Sitecore.Context.Item);

        public Item GetDataItem(Item item)
        {
            return GetSiteSpecificItemByTemplateId(item, Templates.Data.Id);
        }

        public Item SettingsItem => GetSettingsItem(Sitecore.Context.Item);

        public Item GetSettingsItem(Item item)
        {
            return GetSiteSpecificItemByTemplateId(item, Templates.Settings.Id);
        }

        public Item SiteMediaItem => GetSiteMediaItem(Sitecore.Context.Item);

        public Item GetSiteMediaItem(Item item)
        {
            return GetSiteSpecificItemByTemplateId(item, Templates.Media.Id);
        }

        public Item HomeItem => GetHomeItem(Sitecore.Context.Item);

        public Item GetHomeItem(Item item)
        {
            return GetSiteSpecificItemByTemplateId(item, Templates.Home.Id);
        }

        public Item SharedSitesSettingsItem => GetSharedSitesSettingsItem(Sitecore.Context.Item);

        public Item GetSharedSitesSettingsItem(Item item)
        {
            Item settingsItem = GetSettingsItem(item);
            return settingsItem?.FirstChildHasTemplate(Templates.SharedSitesSettings.ID);
        }

        private Item GetSiteSpecificItemByTemplateId(Item item, ID id)
        {
            var site = GetSiteItem(item);
            return site?.FirstChildHasTemplate(id);
        }
    }
}