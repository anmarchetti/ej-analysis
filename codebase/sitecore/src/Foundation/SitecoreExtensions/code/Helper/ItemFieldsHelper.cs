using System.Collections.Generic;
using System.Linq;
using System.Security.AccessControl;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Models;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.SitecoreExtensions.Helper
{
    public static class ItemFieldsHelper
    {
        public static object GetFieldValue(Field field, bool getNestedObjects = false, bool getMultilistChildren = false)
        {
            switch (field.TypeKey)
            {
                case "multilist":
                case "multilist with search":
                case "treelist":
                case "tree list":
                case "treelist with search":
                case "treelistex":
                case "multi root treelistex":
                {
                    return ((MultilistField)field).GetItems().Select(i => GetItemValue(i, getNestedObjects, getMultilistChildren));
                }

                case "droplink":
                case "droptree":
                case "grouped droplink":
                {
                    return GetItemValue(((LookupField)field).TargetItem, getNestedObjects);
                }

                case "image":
                {
                    var mediaItem = (MediaItem)((ImageField)field).MediaItem;
                    return mediaItem.GetMediaUrl();
                }

                case "datetime":
                case "date":
                {
                    return ((DateField)field).GetIsoDate();
                }

                case "general link":
                {
                    return new Link(field);
                }

                default:
                {
                    return field.Value;
                }
            }
        }

        public static object GetItemOwnFieldValues(Item item, bool getChildren)
        {
            var templateItemFields = item.Template.OwnFields;
            var data = templateItemFields.ToDictionary(i => item.Fields[i.Key].Name, i => GetFieldValue(item.Fields[i.Key], true));

            if (getChildren && item.HasChildren)
            {
                var childrenData = item.Children.Select(c => GetItemOwnFieldValues(c, true));
                data.Add("ChildrenData", childrenData);
            }

            return data;
        }

        private static object GetItemValue(Item item, bool getNestedObjects = false, bool getChildren = false)
        {
            if (item == null)
            {
                return string.Empty;
            }

            var resultObject = new Dictionary<string, object>();

            // check if we either item has template to return nested fields of forcefully initialize them
            if (getNestedObjects || item.Template.BaseTemplates.Any(bt => bt.ID.Equals(Constants.TemplateIds.BaseObjectTemplate)))
            {
                return GetItemOwnFieldValues(item, getChildren);
            }

            if (!string.IsNullOrWhiteSpace(item["Code"]))
            {
                return item["Code"];
            }

            if (!string.IsNullOrWhiteSpace(item["Name"]))
            {
                return item["Name"];
            }

            return item.Name;
        }
    }
}