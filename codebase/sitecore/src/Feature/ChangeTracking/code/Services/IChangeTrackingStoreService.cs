using System;
using System.Collections.Generic;
using easyJet.Feature.ChangeTracking.Models;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;

namespace easyJet.Feature.ChangeTracking.Services
{
    public interface IChangeTrackingStoreService
    {
        void AddItemCreated(Item item, string path, string author);

        void AddVersionAdded(Item item, string author);

        void AddItemRenamed(Item item, string path, string author);

        void AddItemAction(Item item, string path, string author, string action, ID oldParentId, string oldPath);

        void AddFieldChanges(List<ChangeTrackingFieldChange> fieldChanges);

        List<ChangeTrackingFieldChange> GetFieldChanges(Item item, DateTime from, DateTime until);

        List<ChangeTrackingItemChange> GetItemChanges(Item item, DateTime from, DateTime until);

        List<Dictionary<string, object>> GetTemplateChanges(ID templateId, Language language, DateTime from, DateTime until, List<Item> fieldItems);
    }
}