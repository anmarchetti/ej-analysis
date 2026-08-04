using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Extensions
{
    public static class ItemExtensions
    {
        public static string GetDataFolderQuery(this Item item)
        {
            var siteInfo = item.GetSiteInfo();
            var sitePath = siteInfo?.RootPath ?? Sitecore.Context.Site?.StartPath;
            return $"{sitePath}/*[@@templateid ='{Templates.Data.Id}']";
        }

        /// <summary>
        /// Builds Query to Settings folder.
        /// </summary>
        /// <param name="item">Sitecore Item.</param>
        /// <returns>Query to Settings folder.</returns>
        public static string GetSettingsFolderQuery(this Item item)
        {
            var siteInfo = item.GetSiteInfo();
            return $"{siteInfo.RootPath}/*[@@templateid ='{Templates.Settings.Id}']";
        }

        /// <summary>
        /// Get dictionary of item custom fields.
        /// </summary>
        /// <param name="item">Item to enumerate.</param>
        /// <returns>Item custom fields.</returns>
        public static Dictionary<string, object> GetItemCustomFields(this Item item)
        {
            return GetItemCustomFields(item, 0);
        }

        public static bool IsDestinationItem(this Item item)
        {
            if (item == null)
            {
                return false;
            }

            return item.TemplateID.Equals(new ID(Templates.DestinationPages.Country)) ||
                   item.TemplateID.Equals(new ID(Templates.DestinationPages.Region)) ||
                   item.TemplateID.Equals(new ID(Templates.DestinationPages.RegionCity)) ||
                   item.TemplateID.Equals(new ID(Templates.DestinationPages.Resort)) ||
                   item.TemplateID.Equals(new ID(Templates.DestinationPages.Hotel));
        }

        private static Dictionary<string, object> GetItemCustomFields(Item item, int currentDepth)
        {
            var fieldValues = new Dictionary<string, object>();
            foreach (Field field in item.Fields)
            {
                // Excluding OOTB fields
                if (!field.Name.StartsWith("__"))
                {
                    object fieldValue;
                    var fieldType = FieldTypeManager.GetField(field);

                    switch (fieldType)
                    {
                        case ImageField _:
                            fieldValue = item.GetMediaUrl(field.Name);
                            break;
                        case MultilistField _ when currentDepth < MaxCustomFieldDepth:
                            var targetItems = FieldUtils.GetMultilistTargetItems(field.Name, item);
                            fieldValue = targetItems.Where(ti => ti != null).Select(targetItem => GetItemCustomFields(targetItem, currentDepth + 1)).ToList();
                            break;
                        case MultilistField _:
                            fieldValue = field.Value;
                            break;
                        default:
                            fieldValue = field.Value;
                            break;
                    }

                    fieldValues[field.Name] = fieldValue;
                }
            }

            return fieldValues;
        }

        private const int MaxCustomFieldDepth = 2;
    }
}