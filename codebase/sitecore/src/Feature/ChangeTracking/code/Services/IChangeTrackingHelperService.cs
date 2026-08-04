using System.Collections.Generic;
using Sitecore.Data.Engines.DataCommands;
using Sitecore.Data.Events;
using Sitecore.Data.Items;

namespace easyJet.Feature.ChangeTracking.Services
{
    public interface IChangeTrackingHelperService
    {
        bool ShouldTrackFieldChanges(FieldChange f);

        bool HasBeenRenamed(ItemChanges changes);

        List<FieldChange> GetFieldChanges(ItemChanges changes);

        Item GetItem(ExecutedEventArgs<CreateItemCommand> args);

        Item GetItem(ExecutedEventArgs<AddVersionCommand> args);
    }
}