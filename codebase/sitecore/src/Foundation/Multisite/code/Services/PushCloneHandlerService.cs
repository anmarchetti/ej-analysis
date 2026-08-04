using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Data.Engines.DataCommands;
using Sitecore.Data.Events;

namespace easyJet.Foundation.Multisite.Services
{
    [Service(typeof(IPushCloneHandlerService), Lifetime = Lifetime.Singleton)]
    public class PushCloneHandlerService : IPushCloneHandlerService
    {
        private readonly IPushCloneService pushCloneService;

        public PushCloneHandlerService(IPushCloneService pushCloneService) => this.pushCloneService = pushCloneService;

        /// <inheritdoc/>
        public void DataEngineOnAddedVersion(
          object sender,
          ExecutedEventArgs<AddVersionCommand> executedEventArgs)
        {
            pushCloneService.AddVersion(executedEventArgs.Command.Item);
        }

        /// <inheritdoc/>
        public void DataEngineOnCreatedItem(
          object sender,
          ExecutedEventArgs<CreateItemCommand> executedEventArgs)
        {
            pushCloneService.AddChild(executedEventArgs.Command.Result);
        }

        /// <inheritdoc/>
        public void DataEngineOnDeletingItem(
          object sender,
          ExecutingEventArgs<DeleteItemCommand> executingEventArgs)
        {
            pushCloneService.Remove(executingEventArgs.Command.Item);
        }

        /// <inheritdoc/>
        public void DataEngineOnMovedItem(
          object sender,
          ExecutedEventArgs<MoveItemCommand> executedEventArgs)
        {
            pushCloneService.Move(executedEventArgs.Command.Item);
        }

        /// <inheritdoc/>
        public void DataEngineOnSavedItem(
          object sender,
          ExecutedEventArgs<SaveItemCommand> executedEventArgs)
        {
            pushCloneService.SaveClone(executedEventArgs.Command.Item, executedEventArgs.Command.Changes);
        }
    }
}