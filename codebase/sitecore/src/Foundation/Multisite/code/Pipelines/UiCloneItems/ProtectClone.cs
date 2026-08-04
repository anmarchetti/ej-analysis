using System.Linq;
using easyJet.Foundation.Multisite.Services;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Pipelines;

namespace easyJet.Foundation.Multisite.Pipelines.UiCloneItems
{
    public class ProtectClone
    {
        private readonly IDelegatedAreaService delegatedAreaService;

        public ProtectClone(IDelegatedAreaService delegatedAreaService) => this.delegatedAreaService = delegatedAreaService;

        /// <summary>
        /// Protect cloned item from editing.
        /// </summary>
        /// <param name="args">Arguments.</param>
        public void Process(CopyItemsArgs args)
        {
            if (args.Copies == null)
            {
                return;
            }

            Item item = args.Copies.FirstOrDefault();
            if (item == null || !delegatedAreaService.CheckForDelegatedArea(item))
            {
                return;
            }

            ProtectBranch(item);
        }

        /// <summary>
        /// Protect branch from editing.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        protected void ProtectBranch(Item item)
        {
            ProtectItem(item);
            foreach (Item child in item.Children)
            {
                ProtectBranch(child);
            }
        }

        /// <summary>
        /// Protect item from editing.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        protected void ProtectItem(Item item)
        {
            item.Editing.BeginEdit();
            item.Fields[Templates.BasePage.Fields.OriginalItem].Value = item.SourceUri.ItemID.ToString();
            item.Appearance.ReadOnly = true;
            item.Editing.EndEdit();
        }
    }
}