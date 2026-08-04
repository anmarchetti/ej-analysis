using System;
using Sitecore.Data.Items;

namespace easyJet.Feature.SitecoreEnhancment.Commands
{
    [Serializable]
    public class UncloneSingleItem : Unclone
    {
        /// <summary>Unclones the item.</summary>
        /// <param name="item">The item to unclone.</param>
        protected override void UncloneItem(Item item) => UncloneItem(item, false);
    }
}
