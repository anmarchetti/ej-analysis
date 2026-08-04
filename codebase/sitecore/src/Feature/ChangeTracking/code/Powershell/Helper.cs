using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using easyJet.Feature.ChangeTracking.Models;
using easyJet.Feature.ChangeTracking.Services;
using Microsoft.Extensions.DependencyInjection;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.DependencyInjection;
using Sitecore.Globalization;

namespace easyJet.Feature.ChangeTracking.Powershell
{
    [ExcludeFromCodeCoverage]
    public static class Helper
    {
        public static void SetInitialChangeTrackingEntries(ID templateId, Language language)
        {
            var service = ServiceLocator.ServiceProvider.GetService<IChangeTrackingStoreService>();
            var root = Database.GetDatabase("master").GetItem("/sitecore/content/EasyJet/Holidays/Home/Destinations", language);
            SetInitialChangeTrackingEntry(root, templateId, service);
        }

        public static void SetInitialChangeTrackingEntry(Item root, ID templateId, IChangeTrackingStoreService store)
        {
            var items = root.Axes.GetDescendants().Where(d => d.TemplateID == templateId).ToList();
            foreach (var item in items)
            {
                if (!store.GetFieldChanges(item, DateTime.Now.AddYears(-100), DateTime.Now).Any())
                {
                    var changes = new List<ChangeTrackingFieldChange>();
                    var field = item.Fields[new ID("{4FB8EB00-E06B-4C0A-9371-9BD9CA84716E}")];

                    changes.Add(new ChangeTrackingFieldChange
                    {
                        Author = item.Fields[FieldIDs.UpdatedBy].Value,
                        Date = ((DateField)item.Fields[FieldIDs.Updated]).DateTime,
                        FieldId = field.ID.Guid,
                        OldValue = string.Empty,
                        Value = field.Value,
                        Language = item.Language.Name,
                        ItemId = item.ID.Guid,
                        Path = item.Paths.FullPath,
                        TemplateId = item.TemplateID.Guid,
                        IsLatestVersion = true,
                        Version = item.Version.Number
                    });

                    store.AddFieldChanges(changes);
                }
            }
        }

        public static List<Dictionary<string, object>> GetTemplateChanges(ID templateId, Language language, DateTime from, DateTime to, List<Item> fieldItems)
        {
            var service = ServiceLocator.ServiceProvider.GetService<IChangeTrackingStoreService>();
            var templateItem = Database.GetDatabase("master").GetItem(templateId);
            var rawData = service.GetTemplateChanges(templateId, language, from, to, fieldItems);

            var fields = new TemplateItem(templateItem).Fields.Where(i => !i.Name.StartsWith("__")).ToList();

            var result = new List<Dictionary<string, object>>(rawData.Count);
            foreach (var item in rawData)
            {
                var resultItem = new Dictionary<string, object>();
                foreach (var field in item)
                {
                    if (field.Key.Equals("Path") || field.Key.Equals("Icon"))
                    {
                        resultItem.Add(field.Key, field.Value);
                    }
                    else
                    {
                        var fieldType = fields.SingleOrDefault(i => i.ID.Equals(new ID(field.Key)));
                        if (fieldType != null)
                        {
                            resultItem.Add(fieldType.Name, field.Value);
                        }
                        else
                        {
                            throw new Exception("FieldNotFound");
                        }
                    }
                }

                result.Add(resultItem);
            }

            return result;
        }

        public static List<Dictionary<string, object>> GetTemplateChanges(ID templateId, Language language, DateTime from, List<Item> fieldItems)
        {
            return GetTemplateChanges(templateId, language, from, DateTime.Now, fieldItems);
        }

        public static List<Dictionary<string, object>> GetTemplateChanges(ID templateId, Language language, List<Item> fieldItems)
        {
            return GetTemplateChanges(templateId, language, DateTime.Now.AddYears(-10), fieldItems);
        }

        public static List<Dictionary<string, object>> GetTemplateChanges(ID templateId, List<Item> fieldItems)
        {
            return GetTemplateChanges(templateId, Language.Parse("en"), fieldItems);
        }
    }
}
