using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Sitecore;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Data.Managers;
using Sitecore.Links;
using Sitecore.SecurityModel;
using Sitecore.Shell.Framework.CommandBuilders;
using Sitecore.Sites;
using Sitecore.Web;

namespace easyJet.Foundation.SitecoreExtensions.Extensions
{
    public static class ItemExtensions
    {
        public static string GetItemUrl(this Item item)
        {
            return LinkManager.GetItemUrl(item);
        }

        public static string GetItemUrl(this Item item, string siteName)
        {
            var options = LinkManager.GetDefaultUrlBuilderOptions();
            options.Site = SiteContext.GetSite(siteName);

            return LinkManager.GetItemUrl(item, options);
        }

        public static bool HasBaseTemplate(this Item item, TemplateID baseTemplateId)
        {
            if (item == null)
            {
                return false;
            }

            var template = TemplateManager.GetTemplate(item);
            return template != null && template.InheritsFrom(baseTemplateId);
        }

        public static bool HasTemplate(this Item item, ID[] templateCandidates)
        {
            if (item == null || templateCandidates == null || !templateCandidates.Any())
            {
                return false;
            }

            var template = TemplateManager.GetTemplate(item);
            return template != null && template.InheritsFromAny(templateCandidates);
        }

        public static Item GetAncestorByBaseTemplateId(this Item item, ID ancestorTemplateId)
        {
            return item.Axes.GetAncestors().FirstOrDefault(ancestor => ancestor.HasBaseTemplate(new TemplateID(ancestorTemplateId)));
        }

        /// <summary>
        /// Returns descendants of root item based on provided template.
        /// </summary>
        /// <param name="rootItem">Item which descendant to look for.</param>
        /// <param name="templatedId">Template ids of items.</param>
        /// <param name="returnRootItem">Should include root item.</param>
        /// <returns>Collection of descendants items.</returns>
        public static IEnumerable<Item> GetDescendantsByTemplate(this Item rootItem, ID templatedId, bool returnRootItem = false)
        {
            if (returnRootItem)
            {
                yield return rootItem;
            }

            foreach (Item child in rootItem.GetChildren(ChildListOptions.SkipSorting))
            {
                foreach (Item subChild in child.GetDescendantsByTemplate(templatedId, true))
                {
                    if (subChild.TemplateID.Equals(templatedId))
                    {
                        yield return subChild;
                    }
                }
            }
        }

        public static Item GetDescendantByField(this Item item, string fieldName, string fieldValue)
        {
            return item.Axes.SelectSingleItem($"./*[@{fieldName} = '{fieldValue}']");
        }

        public static SiteInfo GetSiteInfo(this Item item)
        {
            return SiteContextFactory.Sites
                .Where(s => !string.IsNullOrWhiteSpace(s.RootPath) && item.Paths.Path.StartsWith(s.RootPath, StringComparison.InvariantCultureIgnoreCase))
                .OrderByDescending(s => s.RootPath.Length)
                .FirstOrDefault();
        }

        public static SiteContext GetSiteContext(this Item item)
        {
            var siteName = item.GetSiteInfo()?.Name;
            return !string.IsNullOrEmpty(siteName) ? Sitecore.Configuration.Factory.GetSite(siteName) : null;
        }

        public static Item GetParentOfTemplate(this Item item, ID templateId)
        {
            var template = TemplateManager.GetTemplate(templateId, item.Database);
            if (template == null)
            {
                return null;
            }

            for (; item != null; item = item.Parent)
            {
                var itemTemplate = TemplateManager.GetTemplate(item);
                if (itemTemplate != null && itemTemplate.DescendsFromOrEquals(template.ID))
                {
                    return item;
                }
            }

            return null;
        }

        public static string MergeMultiFields(this Item item, IEnumerable<string> ids, string fieldName)
        {
            if (item == null || string.IsNullOrEmpty(fieldName))
            {
                return string.Empty;
            }

            if (ids == null || !ids.Any())
            {
                return item.Fields[fieldName].Value;
            }

            var multiFieldValues = item.Fields[fieldName].Value.Split(new char[] { '|' }, StringSplitOptions.RemoveEmptyEntries);

            return string.Join("|", ids.Union(multiFieldValues));
        }

        public static string QuerySafePath(this Item item)
        {
            var sb = new StringBuilder(@"/");

            sb.Append(string.Join("/", item.Paths.FullPath.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries).Select(x => $"#{x}#")));

            return sb.ToString();
        }

        /// <summary>
        /// Check if item's version is latest.
        /// </summary>
        /// <param name="item">Item to check version.</param>
        /// <returns>True is item's version is latest or False otherwise.</returns>
        public static bool IsLatestVersion(this Item item)
        {
            return item.Versions.Count <= item.Version.Number;
        }

        /// <summary>
        /// Reset workflow of item to initial state.
        /// </summary>
        /// <param name="item">Item to reset workflow.</param>
        /// <returns>True or False if workflow was started or not.</returns>
        public static bool ResetWorkflowState(this Item item)
        {
            var itemWorkflow = item?.Database.WorkflowProvider?.GetWorkflow(item);

            if (itemWorkflow != null)
            {
                itemWorkflow.Start(item);
                return true;
            }

            return false;
        }

        /// <summary>
        /// Starts workflow by id for an item.
        /// </summary>
        /// <param name="item">Item</param>
        /// <param name="workflowId">Workflow id</param>
        /// <param name="lockItem">Flag whether the item should get locked to the current user</param>
        /// <returns>True or False if workflow was started or not.</returns>
        public static bool StartWorkflow(this Item item, string workflowId, bool lockItem = true)
        {
            if (string.IsNullOrEmpty(workflowId) || item == null)
            {
                return false;
            }

            var workflow = item.Database.WorkflowProvider?.GetWorkflow(workflowId);
            if (workflow != null)
            {
                workflow.Start(item);
                if (lockItem && TemplateManager.IsFieldPartOfTemplate(FieldIDs.Lock, item) && item.Locking.CanLock())
                {
                    item.Locking.Lock();
                }

                return true;
            }

            return false;
        }

        /// <summary>
        /// If sitecore field has value return integer value otherwise it is null.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldId">Field ID.</param>
        /// <returns>Integer value.</returns>
        public static int? GetInteger(this Item item, ID fieldId)
        {
            return !int.TryParse(item.Fields[fieldId]?.Value, out int result) ? new int?() : result;
        }

        /// <summary>
        /// If sitecore field has value return integer value otherwise it is null.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldName">Field name.</param>
        /// <returns>Integer value.</returns>
        public static int? GetInteger(this Item item, string fieldName)
        {
            return !int.TryParse(item.Fields[fieldName]?.Value, out int result) ? new int?() : result;
        }

        /// <summary>
        /// If sitecore field has value return decimal value otherwise it is null.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldId">Field ID.</param>
        /// <returns>Decimal value.</returns>
        public static decimal? GetDecimal(this Item item, ID fieldId)
        {
            return !decimal.TryParse(item.Fields[fieldId]?.Value, out decimal result) ? new decimal?() : result;
        }

        /// <summary>
        /// If sitecore field has value return decimal value otherwise it is null.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldName">Field Name.</param>
        /// <returns>Decimal value.</returns>
        public static decimal? GetDecimal(this Item item, string fieldName)
        {
            return !decimal.TryParse(item.Fields[fieldName]?.Value, out decimal result) ? new decimal?() : result;
        }

        /// <summary>
        /// If sitecore field has value return byte value otherwise it is null.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldId">Field ID.</param>
        /// <returns>Byte value.</returns>
        public static byte? GetByte(this Item item, ID fieldId)
        {
            return !byte.TryParse(item.Fields[fieldId]?.Value, out byte result) ? new byte?() : result;
        }

        /// <summary>
        /// Get items from multilist field.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldName">Field name.</param>
        /// <returns>Collections of items in multilist field.</returns>
        public static IEnumerable<Item> GetItems(this Item item, string fieldName)
        {
            MultilistField multilistField = item.Fields[fieldName];
            if (multilistField == null)
            {
                return Enumerable.Empty<Item>();
            }

            return multilistField.GetItems();
        }

        /// <summary>
        /// Get target item from link field.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="linkFieldName">Link field name.</param>
        /// <returns>Target item.</returns>
        public static Item GetTargetItem(this Item item, string linkFieldName)
        {
            return ((LookupField)item.Fields[linkFieldName])?.TargetItem;
        }

        /// <summary>
        /// Set field value.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldName">Sitecore field name.</param>
        /// <param name="value">Field value.</param>
        public static void SetValue(this Item item, string fieldName, string value)
        {
            item.Editing.BeginEdit();
            item[fieldName] = value;
            item.Editing.EndEdit();
        }

        /// <summary>
        /// Execute action for item filed.
        /// </summary>
        /// <param name="item">Item.</param>
        /// <param name="fieldName">Field name.</param>
        /// <param name="fieldAction">Action for field.</param>
        public static void ExecuteItemFieldAction(this Item item, string fieldName, Action<Field> fieldAction)
        {
            using (new SecurityDisabler())
            {
                item.Editing.BeginEdit();
                fieldAction(item?.Fields[fieldName]);
                item.Editing.EndEdit();
            }
        }

        /// <summary>
        /// Get date in iso format.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldName">Field name.</param>
        /// <returns>Date in ISO format.</returns>
        public static DateTime GetDate(this Item item, string fieldName)
        {
            return ((DateField)item.Fields[fieldName]).IsoTimeToServerDateTime();
        }

        /// <summary>
        /// Get URL from LinkField.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldName">Link field name.</param>
        /// <returns>URL.</returns>
        public static string LinkFieldUrl(this Item item, string fieldName)
        {
            if (item == null)
            {
                return string.Empty;
            }

            if (string.IsNullOrEmpty(fieldName))
            {
                return string.Empty;
            }

            var field = item.Fields[fieldName];
            if (field == null || !(FieldTypeManager.GetField(field) is LinkField))
            {
                return string.Empty;
            }
            else
            {
                LinkField linkField = (LinkField)field;
                switch (linkField.LinkType.ToLower())
                {
                    case "internal":
                        return linkField.TargetItem != null ? LinkManager.GetItemUrl(linkField.TargetItem) : string.Empty;
                    case "media":
                        return linkField.TargetItem != null ? Sitecore.Resources.Media.MediaManager.GetMediaUrl(linkField.TargetItem) : string.Empty;
                    case "external":
                        return linkField.Url;
                    case "anchor":
                        return !string.IsNullOrEmpty(linkField.Anchor) ? "#" + linkField.Anchor : string.Empty;
                    case "mailto":
                        return linkField.Url;
                    case "javascript":
                        return linkField.Url;
                    default:
                        return linkField.Url;
                }
            }
        }

        /// <summary>
        /// Get first child inherited from provided tempated id.
        /// </summary>
        /// <param name="item">Sitecore Item.</param>
        /// <param name="templateId">Template ID.</param>
        /// <returns>Sitecore item that ingereted from provided template id.</returns>
        public static Item FirstChildHasTemplate(this Item item, ID templateId)
        {
            return item?.Children.FirstOrDefault(x => x.HasBaseTemplate(new TemplateID(templateId)));
        }

        public static bool IsItemCloned(this Item item)
        {
            if (item == null)
            {
                return false;
            }

            return !string.IsNullOrEmpty(item[Constants.Fields.Common.OriginalItem]);
        }

        public static Item OriginalItem(this Item item)
        {
            if (item == null)
            {
                return null;
            }

            if (ID.TryParse(item[Constants.Fields.Common.OriginalItem], out var id))
            {
                return Context.Database?.GetItem(id, item.Language);
            }

            return null;
        }

        public static IEnumerable<T> CheckVersion<T>(this IEnumerable<T> enumerable, Item contextItem)
            where T : Item
        {
            if (enumerable == null || !enumerable.Any())
            {
                return Enumerable.Empty<T>();
            }

            if (contextItem == null || !contextItem.Database.Name.Equals(Constants.Databases.Master, StringComparison.InvariantCultureIgnoreCase))
            {
                return enumerable.Where(i => i.Versions.Count > 0);
            }

            return enumerable.Where(i => i.Versions.GetVersions(false).Any(j => !j.Publishing.HideVersion));
        }

        public static bool HasValue(this Item instance, string fieldName, string newValue, bool allowEmptyValue)
        {
            // Check if the field exists and is not null.
            if (instance.Fields[fieldName] == null)
            {
                return true;
            }

            if (!allowEmptyValue)
            {
                return string.IsNullOrEmpty(newValue) || instance.Fields[fieldName].Value.Equals(newValue);
            }

            return (string.IsNullOrEmpty(instance.Fields[fieldName].Value) && newValue == null) || instance.Fields[fieldName].Value.Equals(newValue);
        }

        public static bool HasValue(this Item instance, ID fieldId, string newValue, bool allowEmptyValue)
        {
            if (instance.Fields[fieldId] == null)
            {
                return true;
            }

            if (!allowEmptyValue)
            {
                return string.IsNullOrEmpty(newValue) || instance.Fields[fieldId].Value.Equals(newValue);
            }

            return (string.IsNullOrEmpty(instance.Fields[fieldId].Value) && newValue == null) || instance.Fields[fieldId].Value.Equals(newValue);
        }

        /// <summary>
        /// Updates the value of a specific field in a Sitecore item if the new value is different from the current value.
        /// </summary>
        /// <param name="item">The Sitecore item to update.</param>
        /// <param name="key">The field name (key) to update.</param>
        /// <param name="value">The new value for the field.</param>
        /// <param name="allowEmptyValues">Flag whether empty values are allowed; default true</param>
        /// <param name="createNewVersion">Flag whether a new version should be added; default false</param>
        /// <returns>True if the field value was updated; otherwise, false.</returns>
        public static bool BulkUpdate(this Item item, string key, string value, bool allowEmptyValues = true, bool createNewVersion = false)
            => BulkUpdate(item, new Dictionary<string, string> { { key, value } }, allowEmptyValues, createNewVersion);

        public static bool BulkUpdateById(this Item item, ID key, string value, bool allowEmptyValues = true, bool createNewVersion = false)
            => BulkUpdateById(item, new Dictionary<ID, string> { { key, value } }, allowEmptyValues, createNewVersion);

        /// <summary>
        /// Performs bulk updates on a Sitecore item based on a dictionary of field names and values, applying updates only where the new value differs.
        /// </summary>
        /// <param name="item">The Sitecore item to update.</param>
        /// <param name="values">A dictionary containing field names as keys and the new values as values.</param>
        /// <param name="allowEmptyValues">Flag whether empty values are allowed; default true</param>
        /// <param name="createNewVersion">Flag whether a new version should be added; default false</param>
        /// <returns>True if at least one field value was updated; otherwise, false.</returns>
        public static bool BulkUpdate(this Item item, Dictionary<string, string> values, bool allowEmptyValues = true, bool createNewVersion = false)
        {
            if (item == null)
            {
                return false;
            }

            var changes = values.Where(change => !item.HasValue(change.Key, change.Value, allowEmptyValues)).ToList();

            if (!changes.Any())
            {
                return false;
            }

            using (new SecurityDisabler())
            using (new DatabaseCacheDisabler())
            using (new BulkUpdateContext())
            {
                try
                {
                    if (createNewVersion)
                    {
                        item = item.Versions.AddVersion();
                        item.ResetWorkflowState();
                    }

                    item.Editing.BeginEdit();

                    foreach (var value in changes)
                    {
                        item.Fields[value.Key].Value = value.Value;
                    }

                    item.Editing.EndEdit();
                    return true;
                }
                catch
                {
                    item.Editing.CancelEdit();
                    return false;
                }
            }
        }

        public static bool BulkUpdateById(this Item item, Dictionary<ID, string> values, bool allowEmptyValues = true, bool createNewVersion = false)
        {
            if (item == null)
            {
                return false;
            }

            var changes = values.Where(change => !item.HasValue(change.Key, change.Value, allowEmptyValues)).ToList();

            if (!changes.Any())
            {
                return false;
            }

            using (new SecurityDisabler())
            using (new DatabaseCacheDisabler())
            using (new BulkUpdateContext())
            {
                try
                {
                    if (createNewVersion)
                    {
                        item = item.Versions.AddVersion();
                        item.ResetWorkflowState();
                    }

                    item.Editing.BeginEdit();

                    foreach (var value in changes)
                    {
                        item.Fields[value.Key].Value = value.Value;
                    }

                    item.Editing.EndEdit();
                    return true;
                }
                catch
                {
                    item.Editing.CancelEdit();
                    return false;
                }
            }
        }

        public static bool HasVersion(this Item item)
        {
            if (item == null)
            {
                return false;
            }

            if (!item.Database.Name.Equals(Constants.Databases.Master, StringComparison.InvariantCultureIgnoreCase))
            {
                return item.Versions.Count > 0;
            }

            return item.Versions.GetVersions(false).Any(j => !j.Publishing.HideVersion);
        }

        public static string ToContentEditorLink(this Item item)
        {
            return new CommandBuilder("item:load")
                .Add("id", item.ID.ToString())
                .Add("language", item.Language.Name)
                .ToString();
        }

        /// <summary>
        /// Recursive getting all item by template ids.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="templateIds">Template id.</param>
        /// <param name="items">Result items.</param>
        private static void GetItemsByTemplatesRecursive(Item item, IEnumerable<ID> templateIds, List<Item> items)
        {
            foreach (Item childItem in item.GetChildren())
            {
                if (templateIds.Contains(childItem.TemplateID))
                {
                    items.Add(childItem);
                }
                else if (childItem.HasChildren)
                {
                    GetItemsByTemplatesRecursive(childItem, templateIds, items);
                }
            }
        }
    }
}
