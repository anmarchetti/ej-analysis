using System;
using System.Collections.Generic;
using System.Data.Entity.Core;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using easyJet.Feature.ChangeTracking.Logging;
using easyJet.Feature.ChangeTracking.Models;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Exceptions;
using Sitecore.Globalization;
using Database = Sitecore.Data.Database;

namespace easyJet.Feature.ChangeTracking.Services
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IChangeTrackingStoreService), Lifetime = Lifetime.Singleton)]
    public class ChangeTrackingStoreService : IChangeTrackingStoreService
    {
        private readonly IDatabaseContextService db;
        private readonly IChangeTrackingLogger logger;

        public ChangeTrackingStoreService(IDatabaseContextService databaseContextService, IChangeTrackingLogger logger)
        {
            db = databaseContextService;
            this.logger = logger;
        }

        public void AddItemCreated(Item item, string path, string author) => AddItemAction(item, path, author, "C", null, null);

        public void AddVersionAdded(Item item, string author) => AddItemAction(item, null, author, "A", null, null);

        public void AddItemRenamed(Item item, string path, string author) => AddItemAction(item, path, author, "R", null, null);

        public void AddItemAction(Item item, string path, string author, string action, ID oldParentId, string oldPath)
        {
            try
            {
                db.ItemChanges.Add(new ChangeTrackingItemChange
                {
                    Date = DateTime.Now.ToUniversalTime(),
                    ItemId = item.ID.Guid,
                    TemplateId = item.TemplateID.Guid,
                    ParentItemId = item.ParentID.Guid,
                    Path = path,
                    Language = item.Language.Name,
                    Version = item.Version.Number,
                    Action = action,
                    Author = author,
                    IsLatestVersion = item.Versions.IsLatestVersion(),
                    OldParentItemId = oldParentId?.Guid ?? Guid.Empty,
                    OldPath = oldPath
                });
                db.SaveChanges();
            }
            catch (EntityCommandExecutionException ex)
            {
                logger.Error("An unhandled EntityCommandExecutionException occurred. Maybe you forgot to create the Table for the Item Change History?", ex, this);
            }
            catch (Exception ex)
            {
                logger.Error("Unhandled Exception occurred.", ex, this);
            }
        }

        public void AddFieldChanges(List<ChangeTrackingFieldChange> fieldChanges)
        {
            try
            {
                foreach (var change in fieldChanges)
                {
                    AddField(change);
                }
            }
            catch (EntityCommandExecutionException ex)
            {
                logger.Error("An unhandled EntityCommandExecutionException occurred. Maybe you forgot to create the Table for the Item Change History?", ex, this);
            }
            catch (Exception ex)
            {
                logger.Error("Unhandled Exception occurred.", ex, this);
            }
        }

        public void AddField(ChangeTrackingFieldChange change)
        {
            try
            {
                var dateTime = DateTime.Now.ToUniversalTime().AddMinutes(-15);
                var fieldChange = db.FieldChanges.SingleOrDefault(i =>
                          (i.Date > dateTime &&
                           i.FieldId == change.FieldId &&
                           i.ItemId == change.ItemId &&
                           i.Language == change.Language &&
                           i.Version == change.Version &&
                           i.Author == change.Author &&
                           i.IsLatestVersion == change.IsLatestVersion));
                if (fieldChange == null)
                {
                    InsertNewField(change);
                }
                else
                {
                    UpdateField(fieldChange, change);
                }
            }
            catch (EntityCommandExecutionException ex)
            {
                logger.Error("An unhandled EntityCommandExecutionException occurred. Maybe you forgot to create the Table for the Item Change History?", ex, this);
            }
            catch (Exception ex)
            {
                logger.Error("Unhandled Exception occurred.", ex, this);
            }
        }

        public List<ChangeTrackingFieldChange> GetFieldChanges(Item item, DateTime from, DateTime until)
        {
            try
            {
                from = from.ToUniversalTime();
                until = until.ToUniversalTime();
                return db.FieldChanges
                    .Where(i => i.Date > from && i.Date <= until && i.ItemId.Equals(item.ID.Guid) && i.Language.Equals(item.Language.Name))
                    .OrderBy(i => i.Date)
                    .ToList();
            }
            catch (EntityCommandExecutionException ex)
            {
                logger.Error("An unhandled EntityCommandExecutionException occurred. Maybe you forgot to create the Table for the Item Change History?", ex, this);
                return new List<ChangeTrackingFieldChange>();
            }
            catch (Exception ex)
            {
                logger.Error("Unhandled Exception occurred.", ex, this);
                return new List<ChangeTrackingFieldChange>();
            }
        }

        public List<ChangeTrackingItemChange> GetItemChanges(Item item, DateTime from, DateTime until)
        {
            try
            {
                from = from.ToUniversalTime();
                until = until.ToUniversalTime();
                return db.ItemChanges.Where(i => i.Date > from && i.Date <= until && i.ItemId.Equals(item.ID.Guid) && i.Language.Equals(item.Language.Name)).OrderBy(i => i.Date).ToList();
            }
            catch (EntityCommandExecutionException ex)
            {
                logger.Error("An unhandled EntityCommandExecutionException occurred. Maybe you forgot to create the Table for the Item Change History?", ex, this);
                return new List<ChangeTrackingItemChange>();
            }
            catch (Exception ex)
            {
                logger.Error("Unhandled Exception occurred.", ex, this);
                return new List<ChangeTrackingItemChange>();
            }
        }

        public List<Dictionary<string, object>> GetTemplateChanges(ID templateId, Language language, DateTime from, DateTime until, List<Item> fieldItems)
        {
            try
            {
                var mapping = fieldItems.ToDictionary(i => new ID(i.Fields[Constants.Fields.ReportColumnField].Value), i => Constants.SelectDropDownValues[new ID(i.Fields[Constants.Fields.ReportColumnSelect].Value)]);
                from = from.ToUniversalTime();
                until = until.ToUniversalTime();

                var icon = Database.GetDatabase("master").GetItem(templateId).Fields[FieldIDs.Icon].Value;
                var changes = new Dictionary<ID, Dictionary<string, object>>();

                var results = db.FieldChanges
                    .Where(i => i.Date > from && i.Date <= until && i.TemplateId.Equals(templateId.Guid) && i.Language.Equals(language.Name))
                    .GroupBy(x => new { x.ItemId, x.FieldId, x.Language })
                    .Select(g => g.OrderByDescending(x => x.Date).FirstOrDefault())
                    .OrderByDescending(x => x.Date)
                    .ToList();

                foreach (var result in results)
                {
                    var itemId = new ID(result.ItemId);
                    var fieldId = new ID(result.FieldId);

                    if (mapping.ContainsKey(fieldId))
                    {
                        if (!changes.ContainsKey(itemId))
                        {
                            changes[itemId] = new Dictionary<string, object>
                            {
                                {
                                    "Path",
                                    $"<a href=\"#\" onclick=\"scForm.showModalDialog('/sitecore/shell/Applications/Content-Editor?id={itemId}&amp;vs={result.Version}&amp;la={language.Name}&amp;fo={itemId}&amp;sc_content=master&amp;mo=popup', '_blank', 'getBestDialogSize:true;header:Content Editor');\">{result.Path}</a>"
                                },
                                {
                                    "Icon", icon
                                }
                            };
                        }

                        var select = mapping[new ID(result.FieldId)];

                        switch (select)
                        {
                            case Constants.SelectableColumnValues.Date:
                                changes[itemId][result.FieldId.ToString()] = result.Date;
                                break;
                            case Constants.SelectableColumnValues.Author:
                                changes[itemId][result.FieldId.ToString()] = result.Author;
                                break;
                            case Constants.SelectableColumnValues.OldValue:
                                changes[itemId][result.FieldId.ToString()] = result.OldValue;
                                break;
                            case Constants.SelectableColumnValues.NewValue:
                                changes[itemId][result.FieldId.ToString()] = result.Value;
                                break;
                            default:
                                throw new UnknownTypeException($"The Value {select} is not valid!");
                        }
                    }
                }

                return changes.Values.ToList();
            }
            catch (EntityCommandExecutionException ex)
            {
                logger.Error("An unhandled EntityCommandExecutionException occurred. Maybe you forgot to create the Table for the Item Change History?", ex, this);
                return new List<Dictionary<string, object>>();
            }
            catch (Exception ex)
            {
                logger.Error("Unhandled Exception occurred.", ex, this);
                return new List<Dictionary<string, object>>();
            }
        }

        private void InsertNewField(ChangeTrackingFieldChange change)
        {
            try
            {
                db.FieldChanges.Add(new ChangeTrackingFieldChange
                {
                    Date = change.Date,
                    ItemId = change.ItemId,
                    TemplateId = change.TemplateId,
                    Language = change.Language,
                    FieldId = change.FieldId,
                    Version = change.Version,
                    Value = change.Value,
                    OldValue = change.OldValue,
                    Author = change.Author,
                    IsLatestVersion = change.IsLatestVersion,
                    Path = change.Path
                });
                db.SaveChanges();
            }
            catch (EntityCommandExecutionException ex)
            {
                logger.Error("An unhandled EntityCommandExecutionException occurred. Maybe you forgot to create the Table for the Item Change History?", ex, this);
            }
            catch (Exception ex)
            {
                logger.Error("Unhandled Exception occurred.", ex, this);
            }
        }

        private void UpdateField(ChangeTrackingFieldChange existing, ChangeTrackingFieldChange newChange)
        {
            try
            {
                if (existing != null)
                {
                    existing.OldValue = existing.Value;
                    existing.Date = DateTime.Now.ToUniversalTime();
                    existing.Value = newChange.Value;
                }

                db.SaveChanges();
            }
            catch (EntityCommandExecutionException ex)
            {
                logger.Error("An unhandled EntityCommandExecutionException occurred. Maybe you forgot to create the Table for the Item Change History?", ex, this);
            }
            catch (Exception ex)
            {
                logger.Error("Unhandled Exception occurred.", ex, this);
            }
        }
    }
}