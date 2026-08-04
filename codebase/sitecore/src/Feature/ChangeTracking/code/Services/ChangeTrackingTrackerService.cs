using System;
using System.Data.Entity.Core;
using System.Linq;
using easyJet.Feature.ChangeTracking.Extensions;
using easyJet.Feature.ChangeTracking.Logging;
using easyJet.Feature.ChangeTracking.Models;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore;
using Sitecore.Data.Engines.DataCommands;
using Sitecore.Data.Events;
using Sitecore.Data.Items;

namespace easyJet.Feature.ChangeTracking.Services
{
    [Service(typeof(IChangeTrackingTrackerService), Lifetime = Lifetime.Transient)]
    public class ChangeTrackingTrackerService : IChangeTrackingTrackerService
    {
        private readonly IChangeTrackingStoreService history;
        private readonly IChangeTrackingSettingsService changeTrackingSettingsService;
        private readonly IChangeTrackingHelperService changeTrackingHelperService;
        private readonly IChangeTrackingLogger logger;

        public ChangeTrackingTrackerService(IChangeTrackingStoreService history, IChangeTrackingSettingsService changeTrackingSettingsService, IChangeTrackingHelperService changeTrackingHelperService, IChangeTrackingLogger logger)
        {
            this.history = history;
            this.changeTrackingSettingsService = changeTrackingSettingsService;
            this.changeTrackingHelperService = changeTrackingHelperService;
            this.logger = logger;
        }

        public void ItemSaving(ExecutingEventArgs<SaveItemCommand> executingEventArgs)
        {
            try
            {
                if (!changeTrackingSettingsService.GetSettings().IsEnabled)
                {
                    return;
                }

                var item = executingEventArgs.Command.Item;
                var fieldChanges = changeTrackingHelperService.GetFieldChanges(executingEventArgs.Command.Changes);

                if (!IsTracked(item))
                {
                    return;
                }

                var isLatest = item.Versions.IsLatestVersion();

                var changes = fieldChanges
                    .Where(changeTrackingHelperService.ShouldTrackFieldChanges)
                    .Select(x => new ChangeTrackingFieldChange
                    {
                        ItemId = item.ID.Guid,
                        TemplateId = item.TemplateID.Guid,
                        FieldId = x.FieldID.Guid,
                        Value = x.Value,
                        OldValue = x.OriginalValue,
                        IsLatestVersion = isLatest,
                        Language = item.Language.Name,
                        Author = Context.GetUserName(),
                        Version = item.Version.Number,
                        Path = item.Paths.Path,
                        Date = DateTime.Now.ToUniversalTime()
                    })
                    .ToList();

                if (changes.Any())
                {
                    history.AddFieldChanges(changes);
                }

                if (changeTrackingHelperService.HasBeenRenamed(executingEventArgs.Command.Changes))
                {
                    history.AddItemRenamed(item, item.Paths.Path, Context.GetUserName());
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

        public void ItemCreated(ExecutedEventArgs<CreateItemCommand> e)
        {
            try
            {
                if (!changeTrackingSettingsService.GetSettings().IsEnabled)
                {
                    return;
                }

                var item = changeTrackingHelperService.GetItem(e);

                if (!IsTracked(item))
                {
                    return;
                }

                history.AddItemCreated(item, item.Paths.Path, Context.GetUserName());
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

        public void VersionAdded(ExecutedEventArgs<AddVersionCommand> e)
        {
            try
            {
                if (!changeTrackingSettingsService.GetSettings().IsEnabled)
                {
                    return;
                }

                if (!IsTracked(changeTrackingHelperService.GetItem(e)))
                {
                    return;
                }

                history.AddVersionAdded(e.Command.Result, Context.GetUserName());
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

        public virtual bool IsTracked(Item item)
        {
            var settings = changeTrackingSettingsService.GetSettings();
            if (!settings.IsEnabled)
            {
                return false;
            }

            return !settings.Templates.Any() || settings.Templates.Any(item.InheritsFrom);
        }
    }
}