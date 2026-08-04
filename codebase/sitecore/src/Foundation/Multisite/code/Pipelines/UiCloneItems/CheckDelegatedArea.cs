using System.Collections.Generic;
using System.Linq;
using EasyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Globalization;
using Sitecore.Text;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.Multisite.Pipelines.UiCloneItems
{
    public class CheckDelegatedArea
    {
        private readonly BaseFactory factory;
        private readonly BaseTemplateManager templateManager;
        private readonly IMultiSiteContext multisiteContext;

        public CheckDelegatedArea(
            BaseTemplateManager templateManager,
            BaseFactory factory,
            IMultiSiteContext multisiteContext)
        {
            this.templateManager = templateManager;
            this.factory = factory;
            this.multisiteContext = multisiteContext;
        }

        /// <summary>
        /// Check if item should be added to delegated area.
        /// </summary>
        /// <param name="args">ClientPipelineArgs args.</param>
        public void Process(ClientPipelineArgs args)
        {
            Item destinationItem = GetDatabase(args)?.GetItem(args.Parameters["destination"]);
            if (destinationItem == null)
            {
                return;
            }

            IList<Item> items = GetItems(args);
            if (!items.Any())
            {
                return;
            }

            Item item = items.FirstOrDefault();
            if (item != null && !HasBaseTemplate(item, new TemplateID(Templates.BasePage.ID)))
            {
                SheerResponse.Alert($"Cannot clone datasource item '{item.Name}' as only page item can be cloned.");
                return;
            }

            if (!BelongsToSameTenant(item, destinationItem, multisiteContext) || !DestinationIsUnderSite(destinationItem, multisiteContext))
            {
                return;
            }

            args.Parameters.Add("delegatedArea", "true");
        }

        /// <summary>
        /// Get items that need to be added to delegated area.
        /// </summary>
        /// <param name="args">Arguments.</param>
        /// <returns>Collection of items.</returns>
        protected IList<Item> GetItems(ClientPipelineArgs args)
        {
            List<Item> itemList = new List<Item>();
            Database database = GetDatabase(args);
            foreach (string path in new ListString(args.Parameters["items"], '|'))
            {
                Item item = database.GetItem(path, Language.Parse(args.Parameters["language"]));
                if (item != null)
                {
                    itemList.Add(item);
                }
            }

            return itemList;
        }

        /// <summary>
        /// Get Database from arguments.
        /// </summary>
        /// <param name="args">Arguments.</param>
        /// <returns>Database.</returns>
        protected Database GetDatabase(ClientPipelineArgs args)
        {
            string parameter = args.Parameters["database"];
            Database database = factory.GetDatabase(parameter);
            Assert.IsNotNull(database, parameter);
            return database;
        }

        /// <summary>
        /// Checks if destination of clonoing item is under the site.
        /// </summary>
        /// <param name="destination">Destination item.</param>
        /// <param name="context">Multisite context.</param>
        /// <returns>True if destination of cloning item is under the site.</returns>
        protected bool DestinationIsUnderSite(Item destination, IMultiSiteContext context) => context.GetSiteItem(destination) != null;

        /// <summary>
        /// Checks if source item and target item belongs to the same tenant.
        /// </summary>
        /// <param name="source">Source item.</param>
        /// <param name="target">Target item.</param>
        /// <param name="context">Multisite context.</param>
        /// <returns>True if source and target items belong to the same tenant.</returns>
        protected bool BelongsToSameTenant(Item source, Item target, IMultiSiteContext context)
        {
            Item tenantItem1 = context.GetTenantItem(source);
            Item tenantItem2 = context.GetTenantItem(target);
            return tenantItem1 != null && tenantItem2 != null && tenantItem1.ID.ToString().Is(tenantItem2.ID.ToString());
        }

        /// <summary>
        /// Check if item inherits from template.
        /// </summary>
        /// <param name="item">Item.</param>
        /// <param name="baseTemplateId">Template id.</param>
        /// <returns>True if the item inherits from template.</returns>
        protected bool HasBaseTemplate(Item item, TemplateID baseTemplateId)
        {
            if (item == null)
            {
                return false;
            }

            var template = templateManager.GetTemplate(item);
            return template != null && template.InheritsFrom(baseTemplateId);
        }
    }
}