using System;
using System.Collections.Generic;
using System.Linq;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Data.Managers;
using Sitecore.SecurityModel;
using Version = Sitecore.Data.Version;

namespace easyJet.Foundation.SitecoreExtensions.Utils
{
    public static class FieldUtils
    {
        public static ID[] GetMultilistTargetIds(string fieldName, Item item)
        {
            if (item == null)
            {
                throw new ArgumentNullException(nameof(item));
            }

            if (string.IsNullOrEmpty(fieldName))
            {
                throw new ArgumentNullException("fieldName is null or empty");
            }

            var field = (MultilistField)item.Fields[fieldName];
            if (field == null)
            {
                return Array.Empty<ID>();
            }

            return GetMultilistIds(field);
        }

        public static ID[] GetMultilistTargetIds(ID fieldId, Item item)
        {
            if (item == null)
            {
                throw new ArgumentNullException("Item is null");
            }

            var field = (MultilistField)item.Fields[fieldId];
            if (field == null)
            {
                return Array.Empty<ID>();
            }

            return GetMultilistIds(field);
        }

        public static Item[] GetMultilistTargetItems(string fieldName, Item item, bool requireLanguageVersion)
        {
            if (item == null)
            {
                throw new ArgumentNullException("Item is null");
            }

            if (string.IsNullOrEmpty(fieldName))
            {
                throw new ArgumentNullException("fieldName is null or empty");
            }

            var items = GetMultilistTargetIds(fieldName, item).Select(id => item.Database.GetItem(id, item.Language))
                .Where(i => i != null && (!requireLanguageVersion || i.Versions.Count > 0))
                .ToArray();

            return items;
        }

        public static Item[] GetMultilistTargetItems(string fieldName, Item item)
        {
            return GetMultilistTargetItems(fieldName, item, false);
        }

        public static Item[] GetMultilistTargetItems(ID fieldId, Item item, bool requireLanguageVersion)
        {
            if (item == null)
            {
                throw new ArgumentNullException(nameof(item));
            }

            var items = GetMultilistTargetIds(fieldId, item).Select(id => item.Database.GetItem(id, item.Language))
                .Where(i => i != null && (!requireLanguageVersion || i.Versions.Count > 0))
                .ToArray();

            return items;
        }

        public static Item[] GetMultilistTargetItems(ID fieldId, Item item)
        {
            return GetMultilistTargetItems(fieldId, item, false);
        }

        public static Item GetReferenceTargetItem(ID fieldId)
        {
            return GetReferenceTargetItem(fieldId, Context.Item);
        }

        public static Item GetReferenceTargetItem(string fieldName, Item item)
        {
            return GetReferenceTargetItem(item.Fields[fieldName], item, false);
        }

        public static Item GetReferenceTargetItem(ID fieldId, Item item)
        {
            return GetReferenceTargetItem(item.Fields[fieldId], item, false);
        }

        public static Item GetReferenceTargetItem(Field field, Item item, bool requireLanguageVersion)
        {
            var referenceField = (ReferenceField)field;
            if (field == null)
            {
                return null;
            }

            var targetItem = referenceField.TargetItem;

            if (targetItem == null)
            {
                if (item[field.ID].StartsWith("{"))
                {
                    return null;
                }

                var linkField = (LinkField)item.Fields[field.ID];
                if (linkField.IsInternal || linkField.IsMediaLink)
                {
                    targetItem = linkField.TargetItem;
                }

                if (targetItem == null)
                {
                    return null;
                }
            }

            if (targetItem.Language.Name != item.Language.Name)
            {
                targetItem = ItemManager.GetItem(targetItem.ID, item.Language, Version.Latest, targetItem.Database, SecurityCheck.Enable);
            }

            if (requireLanguageVersion && targetItem.Versions.Count == 0)
            {
                return null;
            }

            return targetItem;
        }

        public static Dictionary<string, string> GetNameValueListContent(ID fieldId, Item item)
        {
            return GetNameValueListContent(item.Fields[fieldId]);
        }

        public static Dictionary<string, string> GetNameValueListContent(string fieldName, Item item)
        {
            return GetNameValueListContent(item.Fields[fieldName]);
        }

        public static Dictionary<string, string> GetNameValueListContent(Field field)
        {
            var nameValueListField = (NameValueListField)field;
            if (field == null)
            {
                return new Dictionary<string, string>(0);
            }

            return nameValueListField.NameValues.AllKeys.ToDictionary(i => i, i => nameValueListField.NameValues[i]);
        }

        public static List<KeyValuePair<string, string>> GetNameValueListContentAsList(ID fieldId, Item item)
        {
            return GetNameValueListContentAsList(item.Fields[fieldId]);
        }

        public static List<KeyValuePair<string, string>> GetNameValueListContentAsList(string fieldName, Item item)
        {
            return GetNameValueListContentAsList(item.Fields[fieldName]);
        }

        public static List<KeyValuePair<string, string>> GetNameValueListContentAsList(Field field)
        {
            var nameValueListField = (NameValueListField)field;
            if (field == null)
            {
                return new List<KeyValuePair<string, string>>(0);
            }

            return nameValueListField.NameValues.AllKeys
                .Select(i => new KeyValuePair<string, string>(i, nameValueListField.NameValues[i])).ToList();
        }

        public static bool IsChecked(string fieldName, Item item)
        {
            var field = (CheckboxField)item.Fields[fieldName];
            return field != null && field.Checked;
        }

        private static ID[] GetMultilistIds(MultilistField field)
        {
            return field.TargetIDs;
        }
    }
}