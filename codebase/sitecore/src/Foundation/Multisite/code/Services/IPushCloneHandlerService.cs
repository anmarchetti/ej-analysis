using Sitecore.Data.Engines.DataCommands;
using Sitecore.Data.Events;

namespace easyJet.Foundation.Multisite.Services
{
    public interface IPushCloneHandlerService
    {
        /// <summary>
        /// Add OnAddedVersion evet to Data Engine.
        /// </summary>
        /// <param name="sender">Sender.</param>
        /// <param name="executedEventArgs">Event args.</param>
        void DataEngineOnAddedVersion(
          object sender,
          ExecutedEventArgs<AddVersionCommand> executedEventArgs);

        /// <summary>
        /// Add OnCreatedItem evet to Data Engine.
        /// </summary>
        /// <param name="sender">Sender.</param>
        /// <param name="executedEventArgs">Event args.</param>
        void DataEngineOnCreatedItem(
          object sender,
          ExecutedEventArgs<CreateItemCommand> executedEventArgs);

        /// <summary>
        /// Add OnDeletingItem evet to Data Engine.
        /// </summary>
        /// <param name="sender">Sender.</param>
        /// <param name="executingEventArgs">Event args.</param>
        void DataEngineOnDeletingItem(
          object sender,
          ExecutingEventArgs<DeleteItemCommand> executingEventArgs);

        /// <summary>
        /// Add OnMovedItem evet to Data Engine.
        /// </summary>
        /// <param name="sender">Sender.</param>
        /// <param name="executedEventArgs">Event args.</param>
        void DataEngineOnMovedItem(
          object sender,
          ExecutedEventArgs<MoveItemCommand> executedEventArgs);

        /// <summary>
        /// Add OnSavedItem evet to Data Engine.
        /// </summary>
        /// <param name="sender">Sender.</param>
        /// <param name="executedEventArgs">Event args.</param>
        void DataEngineOnSavedItem(
          object sender,
          ExecutedEventArgs<SaveItemCommand> executedEventArgs);
    }
}