using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Resources;
using Sitecore.Web.UI;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    public class RenderingItemService : IRenderingItemService
    {
        private readonly IDatabaseProvider databaseProvider;
        private readonly ConcurrentDictionary<string, Item[]> renderingCache = new ConcurrentDictionary<string, Item[]>();

        public RenderingItemService()
            : this(new SitecoreDatabaseProvider())
        {
        }

        public RenderingItemService(IDatabaseProvider databaseProvider)
        {
            this.databaseProvider = databaseProvider;
        }

        public string GetItemDisplayName(string itemId)
        {
            if (string.IsNullOrWhiteSpace(itemId))
            {
                return Constants.RenderingMappingEditor.NotSelectedText;
            }

            if (!ID.TryParse(itemId, out var id))
            {
                return itemId;
            }

            var item = databaseProvider.GetItem(id, DatabaseType.Master);
            return item?.DisplayName ?? itemId;
        }

        public string GetRenderingIconUrl(string itemId)
        {
            if (string.IsNullOrWhiteSpace(itemId))
            {
                return string.Empty;
            }

            if (!ID.TryParse(itemId, out var id))
            {
                return string.Empty;
            }

            var item = databaseProvider.GetItem(id, DatabaseType.Master);
            if (item == null)
            {
                return string.Empty;
            }

            if (item.Appearance == null)
            {
                return string.Empty;
            }

            var icon = item.Appearance.Icon;
            if (string.IsNullOrEmpty(icon))
            {
                return string.Empty;
            }

            return Images.GetThemedImageSource(icon, ImageDimension.id16x16);
        }

        public string GetRenderingComponentName(string itemId)
        {
            if (string.IsNullOrWhiteSpace(itemId))
            {
                return null;
            }

            if (!ID.TryParse(itemId, out var id))
            {
                return null;
            }

            var item = databaseProvider.GetItem(id, DatabaseType.Master);
            if (item == null)
            {
                return null;
            }

            var componentNameField = item.Fields[Constants.RenderingMappingEditor.FieldNames.ComponentName];
            if (componentNameField != null && !string.IsNullOrEmpty(componentNameField.Value))
            {
                return componentNameField.Value;
            }

            return null;
        }

        public string GetRenderingTypeName(string itemId)
        {
            if (string.IsNullOrWhiteSpace(itemId))
            {
                return null;
            }

            if (!ID.TryParse(itemId, out var id))
            {
                return null;
            }

            var item = databaseProvider.GetItem(id, DatabaseType.Master);
            return item?.TemplateName;
        }

        public Item GetParametersTemplateItem(Item renderingItem)
        {
            if (renderingItem == null)
            {
                return null;
            }

            var parametersTemplateField = renderingItem.Fields[Constants.RenderingMappingEditor.FieldNames.ParametersTemplate];
            if (parametersTemplateField == null || string.IsNullOrEmpty(parametersTemplateField.Value))
            {
                return null;
            }

            if (!ID.TryParse(parametersTemplateField.Value, out var templateId))
            {
                return null;
            }

            // Try dbProvider first (for testing), then fall back to renderingItem.Database
            return databaseProvider.GetItem(templateId, DatabaseType.Master) ?? renderingItem.Database?.GetItem(templateId);
        }

        public Item[] GetSourceItems(string source)
        {
            if (string.IsNullOrWhiteSpace(source))
            {
                return Array.Empty<Item>();
            }

            if (renderingCache.TryGetValue(source, out var items))
            {
                return items;
            }

            var contextItem = databaseProvider.GetItem(source, DatabaseType.Master);
            if (contextItem == null)
            {
                return Array.Empty<Item>();
            }

            var allItems = new[] { contextItem }
                .Concat(contextItem.Axes.GetDescendants())
                .Where(IsRenderingFolderWithRenderings)
                .OrderBy(i => i.Paths.FullPath)
                .ToArray();

            return allItems;
        }

        public Item[] GetSourceItemsFromCache(string source)
        {
            if (string.IsNullOrWhiteSpace(source))
            {
                return Array.Empty<Item>();
            }

            if (renderingCache.TryGetValue(source, out var cache))
            {
                return cache;
            }

            var renderings = GetSourceItems(source);

            if (renderings.Length > 10)
            {
                renderingCache[source] = renderings;
                return renderings;
            }

            return Array.Empty<Item>();
        }

        public bool IsRenderingFolderWithRenderings(Item item)
        {
            if (item == null)
            {
                return false;
            }

            return item.TemplateID == Constants.TemplateIds.RenderingFolder &&
                   item.Children.Any(i => i.TemplateID == Constants.TemplateIds.Rendering);
        }
    }
}