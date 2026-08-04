using System;
using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using easyJet.Foundation.Destinations.Logging;
using EasyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Events;
using Sitecore.SecurityModel;
using SitecoreExtensionsConstants = easyJet.Foundation.SitecoreExtensions.Constants;

namespace easyJet.Foundation.Destinations.Events
{
    public class DestinationItemEventHandler
    {
        private readonly IDestinationsLogger logger;

        public DestinationItemEventHandler(IDestinationsLogger logger)
        {
            this.logger = logger;
        }

        /// <summary>
        /// Copy Name field value to DisplayName for Destinations items on Item Save.
        /// </summary>
        /// <param name="sender">Sender.</param>
        /// <param name="args">Sitecore Event Args.</param>
        public void OnItemSaving(object sender, EventArgs args)
        {
            // Allow only non null items wich have Country, Region, Resort or Hotel template and allow only items from the master database
            if (Event.ExtractParameter(args, 0) is Item savedItem
                && savedItem.IsDestinationItem()
                && !savedItem.Name.Equals(Constants.Common.StandardValues, StringComparison.InvariantCultureIgnoreCase)
                && savedItem.Database.Name.Equals("master", StringComparison.InvariantCultureIgnoreCase))
            {
                using (new SecurityDisabler())
                {
                    var name = savedItem.Fields[Constants.Fields.DatasourceItem.Name]?.Value;
                    if (!string.IsNullOrWhiteSpace(name))
                    {
                        var validName = ProposeValidItemName(name, savedItem);
                        savedItem.Fields[Constants.Fields.StandardFields.DisplayName].Value = validName;
                    }

                    if (Event.ExtractParameter(args, 1) is ItemChanges changes
                        && changes.HasFieldsChanged
                        && changes.FieldChanges.Contains(Constants.FieldsIds.DatasourceItem.Code))
                    {
                        var code = savedItem.Fields[Constants.Fields.DatasourceItem.Code]?.Value;
                        if (!string.IsNullOrWhiteSpace(code))
                        {
                            savedItem.Fields[Constants.Fields.DatasourceItem.Code].Value = code.Trim();
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Removes states from item's older versions.
        /// </summary>
        /// <param name="sender">Sender.</param>
        /// <param name="args">Sitecore Event Args.</param>
        public void OnVersionAdded(object sender, EventArgs args)
        {
            if (Event.ExtractParameter(args, 0) is Item savedItem
                && savedItem.IsDestinationItem())
            {
                using (new BulkUpdateContext())
                {
                    var itemVersions = savedItem.Versions.GetVersions();

                    for (var i = 0; i < itemVersions.Length - 1; i++)
                    {
                        itemVersions[i].Editing.BeginEdit();
                        itemVersions[i].Fields[SitecoreExtensionsConstants.Fields.Common.WorkflowState].Value = string.Empty;
                        itemVersions[i].Editing.EndEdit();
                    }
                }
            }
        }

        /// <summary>
        /// If item lang is not english -> transliteterate item name, otherwise propose valid item name based on configuration settings.
        /// </summary>
        /// <param name="itemName">Item name.</param>
        /// <param name="savedItem">Saved Item.</param>
        /// <returns>The name.</returns>
        private static string ProposeValidItemName(string itemName, Item savedItem)
        {
            string resolvedName = savedItem.Language.Name == "en" ? itemName : Transliteration.ToLatin(itemName);

            if (savedItem.TemplateID == Constants.TemplateIds.Country)
            {
                return ItemUtil.ProposeValidItemName(resolvedName).RemoveExtraSpaces();
            }

            return ItemUtil.ProposeValidItemName(resolvedName).Replace("-", string.Empty).RemoveExtraSpaces();
        }
    }
}