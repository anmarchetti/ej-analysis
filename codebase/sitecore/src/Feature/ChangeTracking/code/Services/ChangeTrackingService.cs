using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using easyJet.Feature.ChangeTracking.Logging;
using easyJet.Feature.ChangeTracking.Models;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Data.Items;

[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Feature.ChangeTracking.Services
{
    [Service(typeof(IChangeTrackingService))]
    public class ChangeTrackingService : IChangeTrackingService
    {
        private readonly IChangeTrackingStoreService storeService;
        private readonly ChangeTrackingCacheService changeTrackingCacheService;
        private readonly IChangeTrackingLogger logger;

        public ChangeTrackingService(IChangeTrackingStoreService storeService, ChangeTrackingCacheService changeTrackingCacheService, IChangeTrackingLogger logger)
        {
            this.storeService = storeService;
            this.changeTrackingCacheService = changeTrackingCacheService;
            this.logger = logger;
        }

        public List<ChangeTrackingFieldChange> GetFieldChanges(Item item, DateTime from, DateTime until)
        {
            var totalChanges = changeTrackingCacheService.GetCachedValue(item.Uri.ToString(), () =>
            {
                var changes = storeService.GetFieldChanges(item, from, until).ToList();
                return changes;
            });

            return totalChanges.Where(x => x.ItemId == item.ID.Guid).ToList();
        }

        public List<ChangeTrackingItemChange> GetItemChanges(Item item, DateTime from, DateTime until)
        {
            var totalChanges = changeTrackingCacheService.GetCachedValue(item.Uri.ToString(), () =>
            {
                var changes = storeService.GetItemChanges(item, from, until).ToList();
                return changes;
            });

            return totalChanges.Where(x => x.ItemId == item.ID.Guid || x.ParentItemId == x.ItemId).ToList();
        }

        public List<ChangeSet> GetChangeSets(Item item, DateTime from, DateTime until)
        {
            var changes = storeService.GetFieldChanges(item, from, until).Cast<Change>().Union(storeService.GetItemChanges(item, from, until)).OrderBy(x => x.Date).ToList();
            logger.Info("GetChangeSets " + item.Uri + " from " + from + " to " + until + " -> " + changes.Count, this);
            var changeSets = ClusterChanges(changes).OrderByDescending(x => x.SessionStart).ToList();
            return changeSets;
        }

        private List<ChangeSet> ClusterChanges(List<Change> fieldChanges)
        {
            return fieldChanges.GroupBy(x => x.Author + " " + x.Version).SelectMany(ClusterChangesByDate).ToList();
        }

        private IEnumerable<ChangeSet> ClusterChangesByDate(IGrouping<string, Change> changes)
        {
            var changeSets = new List<ChangeSet>();
            ChangeSet currentChangeSet = null;
            foreach (var change in changes)
            {
                if (currentChangeSet == null || change.Date - currentChangeSet.SessionEnd > TimeSpan.FromMinutes(30))
                {
                    currentChangeSet = new ChangeSet
                    {
                        SessionEnd = change.Date,
                        SessionStart = change.Date,
                        Version = change.Version,
                        Author = change.Author,
                        Changes = new List<Change>()
                    };

                    changeSets.Add(currentChangeSet);
                }

                currentChangeSet.Changes.Add(change);
                currentChangeSet.SessionEnd = change.Date;
            }

            return changeSets;
        }
    }
}
