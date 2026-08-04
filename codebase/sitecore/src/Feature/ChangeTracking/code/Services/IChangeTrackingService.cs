using System;
using System.Collections.Generic;
using easyJet.Feature.ChangeTracking.Models;
using Sitecore.Data.Items;

namespace easyJet.Feature.ChangeTracking.Services
{
    public interface IChangeTrackingService
    {
        List<ChangeTrackingFieldChange> GetFieldChanges(Item item, DateTime from, DateTime until);

        List<ChangeTrackingItemChange> GetItemChanges(Item item, DateTime from, DateTime until);

        List<ChangeSet> GetChangeSets(Item item, DateTime from, DateTime until);
    }
}