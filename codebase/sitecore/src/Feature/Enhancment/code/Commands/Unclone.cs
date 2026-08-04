using System;
using Sitecore.Data.Items;

namespace easyJet.Feature.SitecoreEnhancment.Commands
{
    [Serializable]
    public class Unclone : Sitecore.Shell.Framework.Commands.Unclone
    {
        /// <summary>Unclones the item.</summary>
        /// <param name="item">The item to unclone.</param>
        /// <param name="processChildren">if set to <c>true</c> item children will be processed and unclonned.</param>
        protected override void UncloneItem(Item item, bool processChildren)
        {
            if (item == null)
            {
                return;
            }

            if (item.IsClone)
            {
                CloneItem cloneItem = new CloneItem(item);
                cloneItem.Unclone();
                ClearOriginalItem(item);
            }

            if (!processChildren)
            {
                return;
            }

            foreach (Item child in item.Children)
            {
                UncloneItem(child, processChildren: true);
            }
        }

        private void ClearOriginalItem(Item cloneItem)
        {
            if (cloneItem.Fields[Constants.Fields.OriginalItem] == null)
            {
                return;
            }

            bool isEditing = !cloneItem.Editing.IsEditing;
            if (isEditing)
            {
                cloneItem.Editing.BeginEdit();
            }

            cloneItem.Fields[Constants.Fields.OriginalItem].Value = string.Empty;
            if (isEditing)
            {
                cloneItem.Editing.EndEdit();
                cloneItem.Reload();
            }
        }
    }
}
