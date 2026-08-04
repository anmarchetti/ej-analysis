using System;
using easyJet.Foundation.Multisite.Services;
using Sitecore.Data.Engines;
using Sitecore.Data.Engines.DataCommands;
using Sitecore.Data.Events;

namespace easyJet.Foundation.Multisite.Extensions
{
    public static class PushCloneServiceExtension
    {
        /// <summary>
        /// Extension for initializing push clone handlers to Data Engine.
        /// </summary>
        /// <param name="dataEngine"><seealso cref="Data Engine"/></param>
        /// <param name="handlerService">Handler Service.</param>
        public static void UsePushClone(
          this DataEngine dataEngine,
          IPushCloneHandlerService handlerService)
        {
            dataEngine.SavedItem += new EventHandler<ExecutedEventArgs<SaveItemCommand>>(handlerService.DataEngineOnSavedItem);
            dataEngine.MovedItem += new EventHandler<ExecutedEventArgs<MoveItemCommand>>(handlerService.DataEngineOnMovedItem);
            dataEngine.DeletingItem += new EventHandler<ExecutingEventArgs<DeleteItemCommand>>(handlerService.DataEngineOnDeletingItem);
            dataEngine.CreatedItem += new EventHandler<ExecutedEventArgs<CreateItemCommand>>(handlerService.DataEngineOnCreatedItem);
            dataEngine.AddedVersion += new EventHandler<ExecutedEventArgs<AddVersionCommand>>(handlerService.DataEngineOnAddedVersion);
        }
    }
}