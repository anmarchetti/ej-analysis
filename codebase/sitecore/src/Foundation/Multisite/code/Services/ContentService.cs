using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Multisite.Extensions;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Services
{
    [Service(typeof(IContentService), Lifetime = Lifetime.Singleton)]
    public class ContentService : IContentService
    {
        private const string RootPathPlaceholder = "{site}";
        private readonly IHtmlCacheRepository cache;

        public ContentService(IHtmlCacheRepository cache)
        {
            this.cache = cache;
        }

        /// <inheritdoc/>
        public Dictionary<string, object> GetContentByPath(string path, bool withChildren = false, bool readAll = false)
        {
            path = path.Replace(RootPathPlaceholder, Context.Site?.RootPath);
            var cacheKey = $"Multisite.Cache.ContentByPath-{path}-{withChildren}-{readAll}";
            var data = cache.GetItem<Dictionary<string, object>>(cacheKey);
            if (data != null)
            {
                return data;
            }

            var content = Context.Database.GetItem(path);
            if (content == null)
            {
                throw new ArgumentException($"Cannot find item with path {path}", nameof(path));
            }

            if (readAll)
            {
                content.Fields.ReadAll();
            }

            var fieldValues = content.GetItemCustomFields();
            GetChildren(content, fieldValues);

            if (fieldValues.Any())
            {
                cache.StoreItem(cacheKey, fieldValues);
            }

            return fieldValues;

            void GetChildren(Item item, Dictionary<string, object> parentFieldValues)
            {
                if (!withChildren || !item.HasChildren)
                {
                    return;
                }

                List<Dictionary<string, object>> children = new List<Dictionary<string, object>>();
                foreach (var innerChild in item.Children.InnerChildren)
                {
                    if (readAll)
                    {
                        innerChild.Fields.ReadAll();
                    }

                    var childFieldValues = innerChild.GetItemCustomFields();
                    GetChildren(innerChild, childFieldValues);
                    children.Add(childFieldValues);
                }

                parentFieldValues["Children"] = children;
            }
        }
    }
}