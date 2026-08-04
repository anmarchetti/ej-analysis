using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.Destinations.Pipelines.Synchronize;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Common;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Pipelines.GreatDealsUpload
{
    public class GreatDealsProcessor : BaseSyncProcessor
    {
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly IDestinationsRepository destinationsRepository;
        private readonly IDestinationsLogger logger;
        private readonly IMultiSiteContext multiSiteContext;
        private readonly IDatabaseProvider databaseProvider;

        public GreatDealsProcessor(
            IDestinationsSearchService destinationsSearchService,
            IDestinationsRepository destinationsRepository,
            IMultiSiteContext multiSiteContext,
            IDatabaseProvider databaseProvider,
            IDestinationsLogger logger,
            IUserCreationService userCreationService)
            : base(logger, userCreationService)
        {
            this.logger = logger;
            this.destinationsSearchService = destinationsSearchService;
            this.destinationsRepository = destinationsRepository;
            this.multiSiteContext = multiSiteContext;
            this.databaseProvider = databaseProvider;
        }

        /// <inheritdoc/>
        protected internal override void ProcessSync(DestinationPipelineArgs args)
        {
            var greatDealsArgs = args as UploadPipelineArgs<GreatDealUploadRow>;
            if (greatDealsArgs == null)
            {
                logger.Warn("Pipeline args are null", this);
                args.AbortPipeline();
                return;
            }

            greatDealsArgs.ContextItem.ExecuteItemFieldAction(Constants.Fields.Message.Output, field => field.Value = GetLogMessage("Job started"));

            var giataCodes = greatDealsArgs.UploadData.Select(x => x.GiataCode).ToHashSet();

            var hotelsInCms = destinationsSearchService.GetHotelsByGiataCodes(giataCodes.ToArray()).ToList();
            var contextLanguage = greatDealsArgs.ContextItem.Language;
            var hotelsToUpdate = giataCodes.Any() ? hotelsInCms.Select(x => databaseProvider.GetItem(x.Uri, contextLanguage)).ToList() : new List<Item>();

            var greatDealHotels = destinationsRepository.SearchSyncHotelsByQuery(item => item.IsGreatDeal, contextLanguage).Select(hit => databaseProvider.GetItem(hit.Document.Uri, contextLanguage)).ToList();

            var hotelsCodesInCms = hotelsInCms.Select(x => x.GiataCode).WhereNotNull().ToHashSet();
            giataCodes.ExceptWith(hotelsCodesInCms);
            var notFoundHotels = giataCodes.ToArray();

            if (notFoundHotels.Any())
            {
                greatDealsArgs.ContextItem.ExecuteItemFieldAction(Constants.Fields.Message.Output, field => field.Value += BuildErrorMessage(notFoundHotels));
            }

            var processedItems = new List<Item>();
            try
            {
                using (new BulkUpdateContext())
                {
                    greatDealHotels.ForEach(hotel =>
                            hotel.ExecuteItemFieldAction(Constants.Fields.AccommodationItem.GreatDeal, field => field.Value = Constants.Common.CheckboxFalseValue));

                    hotelsToUpdate.ForEach(hotel =>
                            hotel.ExecuteItemFieldAction(Constants.Fields.AccommodationItem.GreatDeal, field => field.Value = Constants.Common.CheckboxTrueValue));
                }

                processedItems.AddRange(greatDealHotels);
                processedItems.AddRange(hotelsToUpdate);
            }
            catch (Exception ex)
            {
                logger.Error($"Error {ex.Message} while processing great deals upload command.", ex, this);
                greatDealsArgs.ContextItem.ExecuteItemFieldAction(Constants.Fields.Message.Output, field => field.Value += GetLogMessage($"Error {ex.Message} while processing  great deals upload command"));
            }
            finally
            {
                greatDealsArgs.ContextItem.ExecuteItemFieldAction(Constants.Fields.Message.Output, field => field.Value += GetLogMessage("Job finished"));
            }

            greatDealsArgs.ProcessedItems = processedItems.ToArray();
            args.Parent = multiSiteContext.GetHomeItem(greatDealsArgs.ContextItem)?
                .Children.FirstOrDefault(x => x.TemplateID == Constants.TemplateIds.DestinationsFolder);
        }

        protected override bool SmartPublish => true;

        /// <inheritdoc/>
        protected override bool IsAutoPublishEnabled()
        {
            return base.IsAutoPublishEnabled() || Settings.GetBoolSetting("Destinations.GreatDeals.AutoPublishEnabled", false);
        }

        /// <summary>
        /// Create and get log message with current date.
        /// </summary>
        /// <param name="message">Message.</param>
        /// <returns>Log message with current date.</returns>
        private string GetLogMessage(string message)
        {
            return $"[{DateTime.Now:hh:mm:ss}] {message} {Environment.NewLine}";
        }

        private string BuildErrorMessage(string[] codes)
        {
            StringBuilder builder = new StringBuilder();
            foreach (var code in codes)
            {
                builder.Append(GetLogMessage($"Hotel with code {code} was not found"));
            }

            return builder.ToString();
        }
    }
}