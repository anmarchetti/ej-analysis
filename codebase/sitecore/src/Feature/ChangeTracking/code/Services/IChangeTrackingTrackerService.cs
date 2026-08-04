using Sitecore.Data.Engines.DataCommands;
using Sitecore.Data.Events;
using Sitecore.Data.Items;

namespace easyJet.Feature.ChangeTracking.Services
{
    public interface IChangeTrackingTrackerService
    {
        void ItemSaving(ExecutingEventArgs<SaveItemCommand> executingEventArgs);

        void ItemCreated(ExecutedEventArgs<CreateItemCommand> e);

        void VersionAdded(ExecutedEventArgs<AddVersionCommand> e);

        bool IsTracked(Item item);
    }
}