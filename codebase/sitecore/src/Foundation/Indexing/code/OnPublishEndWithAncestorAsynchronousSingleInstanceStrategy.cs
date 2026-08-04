using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Runtime.CompilerServices;
using Sitecore.ContentSearch;
using Sitecore.ContentSearch.Maintenance;
using Sitecore.ContentSearch.Maintenance.Strategies;
using Sitecore.ContentSearch.Maintenance.Strategies.Models;
using Sitecore.Data;
using Sitecore.Data.Archiving;
using Sitecore.Data.Eventing.Remote;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;

[assembly: InternalsVisibleTo("easyJet.Foundation.Indexing.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Foundation.Indexing
{
    public class OnPublishEndWithAncestorAsynchronousSingleInstanceStrategy : OnPublishEndAsynchronousSingleInstanceStrategy
    {
        public string AncestorTemplateId { get; set; }

        public string DescendantsTemplateIds { get; set; }

        public OnPublishEndWithAncestorAsynchronousSingleInstanceStrategy(string database)
            : base(database)
        {
        }

        [ExcludeFromCodeCoverage]
        public OnPublishEndWithAncestorAsynchronousSingleInstanceStrategy(string database, ActionRunner<ISearchIndex> actionRunner)
            : base(database, actionRunner)
        {
        }

        internal void EnrichDataWithAncestorItems(List<IndexableInfoModel> data)
        {
            var ancestorId = ParseId(AncestorTemplateId);
            if (ancestorId.IsNull)
            {
                Log.Error($"{nameof(OnPublishEndWithAncestorAsynchronousSingleInstanceStrategy)} {nameof(ancestorId)} is null", this);
                return;
            }

            var descendantsTemplateIdList = DescendantsTemplateIds.Split("|".ToCharArray(), StringSplitOptions.RemoveEmptyEntries).Select(ParseId).Where(i => !i.IsNull).ToHashSet();

            var itemIdItemMapping = new Dictionary<ID, (Item Item, long Timestamp)>();
            foreach (var indexableInfoModel in data)
            {
                var itemToIndex = GetItemToIndex(indexableInfoModel);
                if (itemToIndex == null)
                {
                    continue;
                }

                if (!descendantsTemplateIdList.Contains(itemToIndex.TemplateID))
                {
                    continue;
                }

                var ancestorItem = itemToIndex.Axes.GetAncestors().Concat(new List<Item>() { itemToIndex }).FirstOrDefault(i => i.TemplateID == ancestorId);
                if (ancestorItem == null)
                {
                    continue;
                }

                if (itemIdItemMapping.ContainsKey(ancestorItem.ID))
                {
                    continue;
                }

                itemIdItemMapping.Add(ancestorItem.ID, (ancestorItem, indexableInfoModel.TimeStamp));
            }

            foreach (var itemIdItemMappingEntry in itemIdItemMapping)
            {
                var itemToAdd = itemIdItemMappingEntry.Value.Item;
                var key = itemToAdd.Uri.ToDataUri();
                var itemUri = itemToAdd.Uri;

                Log.Debug($"{nameof(OnPublishEndWithAncestorAsynchronousSingleInstanceStrategy)} {nameof(itemToAdd)} is {itemUri}", this);

                // RestoreItemCompletedEvent to force a reindex of the ancestor item
                var restoreItemCompletedEvent = new RestoreItemCompletedEvent(itemToAdd, itemToAdd.ParentID);
                var model = new IndexableInfoModel(key, new SitecoreItemUniqueId(itemUri), restoreItemCompletedEvent, itemIdItemMappingEntry.Value.Timestamp);
                data.Add(model);
            }
        }

        [ExcludeFromCodeCoverage]
        internal virtual Database GetDatabase(string databaseName)
        {
            return Database.GetDatabase(databaseName);
        }

        [ExcludeFromCodeCoverage]
        protected override void Run(List<IndexableInfoModel> data, ISearchIndex index)
        {
            EnrichDataWithAncestorItems(data);
            base.Run(data, index);
        }

        private static ID ParseId(string idString)
        {
            return ID.TryParse(idString, out var id) ? id : ID.Null;
        }

        private Item GetItemToIndex(IndexableInfoModel indexableInfoModel)
        {
            var itemUri = indexableInfoModel.UniqueId.Value as ItemUri;
            if (itemUri == null)
            {
                return null;
            }

            if (indexableInfoModel.RemoteEvent is DeletedItemRemoteEvent deletedItemRemoteEvent)
            {
                return GetDatabase(itemUri.DatabaseName).GetItem(ID.Parse(deletedItemRemoteEvent.ParentId), itemUri.Language);
            }

            return GetDatabase(itemUri.DatabaseName).GetItem(itemUri.ToDataUri());
        }
    }
}