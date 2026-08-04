using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Data.Engines.DataCommands;
using Sitecore.Data.Events;
using Sitecore.Data.Items;

namespace easyJet.Feature.ChangeTracking.Services
{
    [Service(typeof(IChangeTrackingHelperService), Lifetime = Lifetime.Transient)]
    public class ChangeTrackingHelperService : IChangeTrackingHelperService
    {
        private readonly IChangeTrackingSettingsService changeTrackingSettingsService;

        public ChangeTrackingHelperService(IChangeTrackingSettingsService settingsService)
        {
            changeTrackingSettingsService = settingsService;
        }

        public bool ShouldTrackFieldChanges(FieldChange f)
            => f.Definition != null &&
               ItemUtil.IsDataField(f.Definition) &&
               !f.Definition.Name.StartsWith("__") &&
               f.Value != f.OriginalValue &&
               !changeTrackingSettingsService.GetSettings().ExcludedFields.Contains(f.FieldID);

        public bool HasBeenRenamed(ItemChanges changes)
            => changes.Renamed;

        public List<FieldChange> GetFieldChanges(ItemChanges changes)
            => changes.FieldChanges.Cast<FieldChange>().ToList();

        public Item GetItem(ExecutedEventArgs<CreateItemCommand> args)
            => args.Command.Result;

        public virtual Item GetItem(ExecutedEventArgs<AddVersionCommand> args)
            => args.Command.Item;
    }
}