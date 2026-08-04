using System;
using System.Linq;
using easyJet.Feature.ChangeTracking.Models;
using Sitecore.Data;

namespace easyJet.Feature.ChangeTracking.Mappers
{
    public class ChangeSetMapper
    {
        public static ChangeSetViewModel CreateViewModel(ChangeSet changeSet, Database database)
        {
            var changeSetViewModel = new ChangeSetViewModel
            {
                Author = changeSet.Author,
                SessionEnd = changeSet.SessionEnd,
                Items = changeSet.Changes.GroupBy(x => x.ItemId).Select(i => CreateItemChangeSetViewModel(i, database)).ToList(),
                SessionStart = changeSet.SessionStart,
                Versions = changeSet.Changes.Select(x => x.Version).Distinct().OrderBy(x => x).ToList(),
                NumChanges = changeSet.Changes.Count
            };
            return changeSetViewModel;
        }

        public static ChangeViewModel CreateChangeViewModel(Change change, Database dataBase)
        {
            ChangeViewModel model = null;

            switch (change)
            {
                case ChangeTrackingItemChange c:
                    model = new ItemChangeViewModel
                    {
                        Action = c.Action,
                        OldPath = c.OldPath,
                        Path = c.Path,
                    };
                    break;

                case ChangeTrackingFieldChange c:

                    model = new FieldChangeViewModel
                    {
                        Field = dataBase.GetItem(new ID(c.FieldId))?.Name,
                        OldValue = c.OldValue,
                        NewValue = c.Value,
                    };
                    break;
                default:
                    throw new ArgumentException($"Unexpected Type:{change?.GetType().Name ?? "null"}");
            }

            model.Time = change.Date;
            return model;
        }

        private static ItemChangeSetViewModel CreateItemChangeSetViewModel(IGrouping<Guid, Change> changes, Database dataBase)
        {
            var changeList = changes.OrderByDescending(x => x.Date).ToList();
            return new ItemChangeSetViewModel
            {
                Changes = changeList.Select(i => CreateChangeViewModel(i, dataBase)).ToList(),
                ItemId = new ID(changes.Key),
                Path = changeList.First().Path,
                EditorUrl = null
            };
        }
    }
}