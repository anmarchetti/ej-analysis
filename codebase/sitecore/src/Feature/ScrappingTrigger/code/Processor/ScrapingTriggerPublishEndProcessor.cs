using System;
using System.Linq;
using System.Threading.Tasks;
using easyJet.Feature.ScrappingTrigger.Logging;
using easyJet.Feature.ScrappingTrigger.Services;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Publishing.Service.Client.Http;
using Sitecore.Publishing.Service.Pipelines.BulkPublishingEnd;

namespace easyJet.Feature.ScrappingTrigger.Processor
{
    public class ScrapingTriggerPublishEndProcessor
    {
        private readonly IScrapingTriggerFilterService filterService;
        private readonly IScrapingTriggerService triggerService;
        private readonly IScrapingTriggerUrlService urlService;
        private readonly IScrapingTriggerSettingsService settingsService;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IScrappingTriggerLogger logger;

        public ScrapingTriggerPublishEndProcessor(
            IScrapingTriggerFilterService filterService,
            IScrapingTriggerService triggerService,
            IScrapingTriggerUrlService urlService,
            IScrapingTriggerSettingsService settingsService,
            IDatabaseProvider databaseProvider,
            IScrappingTriggerLogger logger)
        {
            this.filterService = filterService;
            this.triggerService = triggerService;
            this.urlService = urlService;
            this.settingsService = settingsService;
            this.databaseProvider = databaseProvider;
            this.logger = logger;
        }

        public void Process(PublishEndResultBatchArgs args)
        {
            if (args?.Batch == null || args?.JobData == null || args.Aborted || args.Suspended || args?.Batch.Length == 0)
            {
                return;
            }

            var settings = settingsService.GetSettings();
            if (!settings.IsEnabled)
            {
                logger.Info("Scraping Trigger is disabled!", this);
                return;
            }

            // skip if supported language has not been published
            if (!args.JobData.LanguageNames.Contains(settings.SupportedLanguage.Name))
            {
                return;
            }

            if (args.JobData.ItemId != Guid.Empty && ID.TryParse(args.JobData.ItemId, out var jobItemId))
            {
                var jobItem = databaseProvider.GetItem(jobItemId, settings.SupportedLanguage, DatabaseType.Web);
                if (!jobItem.Paths.FullPath.StartsWith(settings.SupportedRootPath))
                {
                    return;
                }
            }

            try
            {
                var deletedItemIds = args.Batch.Where(b => b.Metadata.ChangeType == ResultChangeType.Deleted)
                    .Select(b => b.EntityId)
                    .Select(ID.Parse).ToList();

                var filteredItemUrls = args.Batch
                    .Select(b => b.EntityId)
                    .Select(ID.Parse)
                    .Select(i => databaseProvider.GetItem(i, settings.SupportedLanguage, DatabaseType.Web))
                    .Where(i => i != null && i.Versions.Count > 0 && i.Paths.FullPath.StartsWith(settings.SupportedRootPath))
                    .SelectMany(i => filterService.GetPageItems(i, deletedItemIds))
                    .DistinctBy(i => i.ID.ToString())
                    .Where(filterService.IsMatching)
                    .Where(item => !filterService.HasRedirect(item))
                    .ToDictionary(k => k.ID.Guid, v => urlService.GetItemUrl(v));

                if (filteredItemUrls.Any())
                {
                    var processedItems = 0;

                    do
                    {
                        var batch = filteredItemUrls.Skip(processedItems).Take(settings.MessagesPerBatch).ToList();
                        if (batch.Count == 0)
                        {
                            return;
                        }

                        logger.Info($"The following urls will be pushed into the queue: {string.Join(",", batch.Select(kvp => kvp.Value))}", this);
                        processedItems += batch.Count;
                        Task.Run(() =>
                        {
                            var messages = batch.Where(kvp => !string.IsNullOrEmpty(kvp.Value))
                                .ToDictionary(k => k.Key, p => p.Value);

                            var result = triggerService.EnQueue(messages);
                            if (result == null)
                            {
                                logger.Warn($"{nameof(Process)}: something went wrong - SendMessage to SQS response is null", this);
                            }
                            else
                            {
                                logger.Info($"SendMessage result - successful:{result.Successful?.Count ?? 0} - failed:{result.Failed?.Count ?? 0} - statuscode:{result.HttpStatusCode}", this);
                            }
                        }).ContinueWith(task =>
                        {
                            if (task.IsFaulted)
                            {
                                logger.Error($"{nameof(Process)}", task.Exception, this);
                            }
                        });
                    }
                    while (true);
                }
            }
            catch (Exception ex)
            {
                logger.Error($"{nameof(Process)}", ex, this);
            }
        }
    }
}