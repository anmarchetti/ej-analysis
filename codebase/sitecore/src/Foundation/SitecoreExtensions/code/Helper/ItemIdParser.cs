using System;
using System.Collections.Generic;
using System.Linq;
using Sitecore.Data;

namespace easyJet.Foundation.SitecoreExtensions.Helper
{
    public static class ItemIdParser
    {
        public static List<ID> Parse(string itemsString)
        {
            var ids = new List<ID>();
            foreach (var itemIdString in itemsString.Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries))
            {
                if (!ID.TryParse(itemIdString, out ID itemId))
                {
                    continue;
                }

                ids.Add(itemId);
            }

            return ids;
        }

        public static string Compose(IEnumerable<ID> items)
        {
            return Compose(items.Select(i => i.ToString()).ToArray());
        }

        public static string Compose(IEnumerable<string> itemIds)
        {
            return string.Join("|", itemIds.ToArray());
        }
    }
}
