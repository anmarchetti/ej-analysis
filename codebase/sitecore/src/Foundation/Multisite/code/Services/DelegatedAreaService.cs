using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Multisite.Logging;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Services
{
    [Service(typeof(IDelegatedAreaService), Lifetime = Lifetime.Singleton)]
    public class DelegatedAreaService : IDelegatedAreaService
    {
        private readonly IMultiSiteContext multisiteContext;
        private readonly IMultisiteLogger logger;

        public DelegatedAreaService(IMultiSiteContext multisiteContext, IMultisiteLogger logger)
        {
            this.multisiteContext = multisiteContext;
            this.logger = logger;
        }

        /// <inheritdoc/>
        public bool CheckForDelegatedArea(Item item)
        {
            if (!item.IsItemClone)
            {
                return false;
            }

            Item sitesSettingsItem = multisiteContext.GetSharedSitesSettingsItem(item);
            if (sitesSettingsItem == null)
            {
                return false;
            }

            ID[] delegatedAreas = ((MultilistField)sitesSettingsItem.Fields[Templates.SharedSitesSettings.Fields.DelegatedAreas]).TargetIDs;
            return delegatedAreas.Length != 0 && item.Axes.SelectItems("ancestor-or-self::*").Any(i => delegatedAreas.Contains(i.ID));
        }

        /// <inheritdoc/>
        public bool AddToDelegatedArea(Item sharedItem, Item targetItem)
        {
            Item sitesSettingsItem = multisiteContext.GetSharedSitesSettingsItem(targetItem);
            if (sitesSettingsItem == null)
            {
                logger.Error("Shared Sites Settings item for " + multisiteContext.GetSiteItem(targetItem)?.Paths.Path + " site is not defined.", this);
                return false;
            }

            MultilistField field = sitesSettingsItem.Fields[Templates.SharedSitesSettings.Fields.DelegatedAreas];
            using (new EditContext(sitesSettingsItem))
            {
                field.Add(sharedItem.ID.ToString());
            }

            return true;
        }
    }
}