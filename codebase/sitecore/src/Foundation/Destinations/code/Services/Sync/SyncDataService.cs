using System;
using System.Collections.Generic;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Switchers;
using Sitecore.Data;
using Sitecore.Data.Items;
using Version = Sitecore.Data.Version;

namespace easyJet.Foundation.Destinations.Services.Sync
{
    [Service(typeof(ISyncDataService), Lifetime = Lifetime.Singleton)]
    public class SyncDataService : ISyncDataService
    {
        private readonly IMasterDataService service;
        private readonly IDatasourceRepository repository;
        private readonly IDestinationsLogger logger;

        public SyncDataService(IMasterDataService service, IDatasourceRepository repository, IDestinationsLogger logger)
        {
            this.repository = repository;
            this.service = service;
            this.logger = logger;
        }

        /// <inheritdoc/>
        public IEnumerable<Item> SyncBoards(ID template, Item parent)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncBoards)} with  {nameof(template)}:'{template}', {nameof(parent)}:'{parent?.Paths.Path}'", this);
                var boards = service.GetBoardTypes();
                return SyncDatasourceItems(template, parent, boards);
            }
        }

        /// <summary>
        /// Synchronize datasource items.
        /// </summary>
        /// <param name="template">Template id.</param>
        /// <param name="parent">Parent item.</param>
        /// <param name="data">Data.</param>
        /// <returns>Collection of synced items.</returns>
        private IEnumerable<Item> SyncDatasourceItems(ID template, Item parent, IEnumerable<MasterData> data)
        {
            using (new LogSwitcher(logger))
            {
                logger.Info($@"Calling {nameof(SyncDatasourceItems)} with  {nameof(template)}:'{template}', {nameof(parent)}:'{parent?.Paths.Path}'", this);
                foreach (var obj in data)
                {
                    var item = repository.GetOrCreateItemByCode(obj.Name, obj.Code, template, parent, false, false, Version.First);

                    item.Editing.BeginEdit();
                    item.Fields[Constants.Fields.DatasourceItem.Code].Value = obj.Code;
                    item.Fields[Constants.Fields.DatasourceItem.Name].Value = obj.Name;
                    item.Editing.EndEdit();

                    yield return item;
                }
            }
        }
    }
}