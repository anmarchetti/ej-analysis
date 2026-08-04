using System;
using Sitecore.Data.Events;
using Sitecore.Data.Items;
using Sitecore.Events;

namespace easyJet.Foundation.Destinations.Events
{
    public class FacilityMatrixItemEventHandler
    {
        /// <summary>
        /// Generate code based on item name for custom filters.
        /// </summary>
        /// <param name="sender">Sender.</param>
        /// <param name="args">Sitecore Event Args.</param>
        public void OnItemCreated(object sender, EventArgs args)
        {
            var createdArgs = Event.ExtractParameter(args, 0) as ItemCreatedEventArgs;
            var item = createdArgs?.Item;

            if (item != null && item.TemplateID.Equals(Constants.TemplateIds.FacilityMatrix))
            {
                item.Editing.BeginEdit();
                item[Constants.Fields.DatasourceItem.Code] = GenerateCode(item);
                item.Editing.EndEdit();
            }
        }

        private static string GenerateCode(Item item) => $"{item.Name.Replace(" ", string.Empty)}-code";
    }
}