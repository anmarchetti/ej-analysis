using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data.Items;
using Sitecore.Pipelines;

namespace easyJet.Foundation.Destinations.Commands
{
    public class GreatDealsUploadCommand : BaseCsvCommand
    {
        public GreatDealsUploadCommand(
            IDatabaseProvider databaseProvider,
            ICsvUtilsService csvUtilsService,
            IDestinationsLogger logger,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, csvUtilsService, logger, userCreationService, sitecoreUiService)
        {
        }

        /// <summary>
        /// Synchronize items from supplied file.
        /// </summary>
        /// <param name="contextItem">Context item.</param>
        /// <returns>Updated hotel items.</returns>
        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            var greatDealsUploadData = GetFileData<GreatDealUploadRow>(contextItem)
                .Where(greatDealRow => !string.IsNullOrWhiteSpace(greatDealRow.GiataCode))
                .GroupBy(x => x.GiataCode).Select(x => x.First());

            var args = new UploadPipelineArgs<GreatDealUploadRow>()
            {
                ContextItem = contextItem,
                UploadData = greatDealsUploadData.ToList()
            };

            CorePipeline.Run("GreatDealsUpload", args);

            if (!args.Aborted)
            {
                Logger.Info($"Great deals uploading has been finished ({args.ProcessedItems?.Length ?? default(int)} hotels were proceeded).", this);
            }

            return args.ProcessedItems ?? new Item[0];
        }
    }
}