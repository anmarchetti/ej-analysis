using System;
using System.Linq;
using easyJet.Foundation.Multisite.ContentSearch.Queries;
using easyJet.Foundation.Multisite.ContentSearch.Repositories;
using easyJet.Foundation.Multisite.Logging;
using EasyJet.Foundation.SitecoreExtensions.Publishing;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Configuration;
using Sitecore.Globalization;
using Sitecore.Pipelines;

namespace easyJet.Foundation.Multisite.Pipelines.Publishing
{
    public class AutoPublishProcessor
    {
        private readonly IMultisiteLogger logger;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IPublishingRepository publishingRepository;

        public AutoPublishProcessor(IMultisiteLogger logger, IDatabaseProvider databaseProvider, IPublishingRepository publishingRepository)
        {
            this.logger = logger;
            this.databaseProvider = databaseProvider;
            this.publishingRepository = publishingRepository;

            PublishableTimeRange = Settings.GetTimeSpanSetting("Multisite.AutoPublish.PublishableTimeRange", "00:30:00");
            logger.Debug($"Multisite.AutoPublish.PublishableTimeRange: {PublishableTimeRange}", this);
        }

        public TimeSpan PublishableTimeRange { get; set; }

        /// <summary>
        /// Publish items that have a publishable date range.
        /// </summary>
        /// <param name="args">Pipeline arguments.</param>
        public void Process(PipelineArgs args)
        {
            try
            {
                var rootItem = args.ProcessorItem.InnerItem;

                logger.Info("Started auto publish", this);

                var queryArgs = new PublishableItemQueryArgs()
                {
                    RootPath = rootItem?.Paths?.Path,
                    PublishableTimeRange = PublishableTimeRange
                };

                var unpublishedItems = publishingRepository
                    .GetPublishableItem(queryArgs)
                    .Hits.Select(x => databaseProvider.GetItem(x.Document.Uri)).ToList();

                logger.Debug($"{unpublishedItems.Count} items need to be published.", this);

                var deepPublishSettings = Settings.GetBoolSetting("Multisite.AutoPublish.DeepPublish", true);

                foreach (var unpublishedItem in unpublishedItems)
                {
                    PublishingManager.PublishItem(unpublishedItem, deep: deepPublishSettings, languages: new Language[] { unpublishedItem.Language });
                    logger.Debug($"Item: {unpublishedItem.Name} - {unpublishedItem.ID} has been successfully published.", this);
                }

                logger.Info($"{unpublishedItems?.Count} items have been successfully published.", this);
            }
            catch (Exception ex)
            {
                logger.Error($"Something goes wrong during auto publish: {ex.Message}", ex, this);
            }
        }
    }
}