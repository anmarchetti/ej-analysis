using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Helper;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Web.UI.HtmlControls.Data;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    [Service(typeof(IOrderedListItemsManager), Lifetime = Lifetime.Singleton)]
    public class OrderedListItemsManager : IOrderedListItemsManager
    {
        /// <inheritdoc/>
        public ID[] GetOrderedItemIds(string controlValue, string source, Item contextItem)
        {
            var fieldIds = ItemIdParser.Parse(controlValue);
            var lookupItemsIds = GetLookupItemIds(contextItem, source);

            var index = 0;
            var result = new List<ID>[fieldIds.Count + 1];
            for (int i = 0; i < result.Length; i++)
            {
                result[i] = new List<ID>();
            }

            foreach (var id in lookupItemsIds)
            {
                var i = fieldIds.IndexOf(id);
                if (i >= 0)
                {
                    index = i + 1;
                }

                result[index].Add(id);
            }

            return result.SelectMany(r => r).ToArray();
        }

        /// <inheritdoc/>
        public List<Item> GetOrderedItems(Item item, string fieldName)
        {
            string fieldValue = item.Fields[fieldName].Value;
            string source = item.Fields[fieldName].Source;

            List<Item> items = new List<Item>();

            if (string.IsNullOrEmpty(source))
            {
                MultilistField multilistField = item.Fields[fieldName];
                return multilistField?.GetItems().ToList();
            }

            var itemIds = GetOrderedItemIds(fieldValue, source, item);
            var database = item.Fields[fieldName].Database;

            foreach (var id in itemIds)
            {
                items.Add(database.GetItem(id, item.Language));
            }

            return items;
        }

        protected internal virtual List<ID> GetLookupItemIds(Item contextItem, string source) => LookupSources.GetItems(contextItem, source).Select(i => i.ID).ToList();
    }
}
