using System;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.Events;

namespace easyJet.Foundation.Multisite.Events
{
    public class ItemEventHandler
    {
        /// <summary>
        /// Clear datetime fields in publishing window.
        /// </summary>
        /// <param name="sender">Sender.</param>
        /// <param name="args">Sitecore Event Args.</param>
        public void OnVersionAdded(object sender, EventArgs args)
        {
            if (Event.ExtractParameter(args, 0) is Item savedItem)
            {
                savedItem.Editing.BeginEdit();
                savedItem.Fields[FieldIDs.ValidFrom].Value = string.Empty;
                savedItem.Fields[FieldIDs.ValidTo].Value = string.Empty;
                savedItem.Editing.EndEdit();
            }
        }
    }
}