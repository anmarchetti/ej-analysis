using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Foundation.Destinations.Commands
{
    /// <summary>
    /// TODO: Update Upload command based on giata code.
    /// </summary>
    public class RunUploadHotelsToPromoPageCommand : Command
    {
        private readonly BaseMediaManager mediaManager;
        private readonly ICsvUtilsService csvUtilsService;
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly IDestinationsLogger logger;

        private string resultMessages = string.Empty;

        public RunUploadHotelsToPromoPageCommand(BaseMediaManager mediaManager, ICsvUtilsService csvUtilsService, IDestinationsSearchService destinationsSearchService, IDestinationsLogger logger)
        {
            this.mediaManager = mediaManager;
            this.csvUtilsService = csvUtilsService;
            this.destinationsSearchService = destinationsSearchService;
            this.logger = logger;
        }

        /// <inheritdoc />
        public override CommandState QueryState(CommandContext context)
        {
            if (context.Items.Length > 0)
            {
                var item = context.Items.FirstOrDefault();

                var shouldShowCommand = item?.TemplateID.Equals(Constants.TemplateIds.PromoPage) ?? false;

                if (!shouldShowCommand)
                {
                    return CommandState.Hidden;
                }

                FileField file = item.Fields[Constants.Fields.PromoPage.HotelsImportData];

                if (file.ContainsCsvFile())
                {
                    return base.QueryState(context);
                }
            }

            return CommandState.Hidden;
        }

        /// <inheritdoc />
        public override void Execute(CommandContext context)
        {
            // Clean up `resultMessages` before command execution
            resultMessages = string.Empty;

            var contextItem = context.Items.FirstOrDefault();

            try
            {
                var fileItem = new FileField(contextItem.Fields[Constants.Fields.PromoPage.HotelsImportData])?.MediaItem;

                if (fileItem == null)
                {
                    RegisterDataError("Hotels Import Data field is empty.", true);
                    return;
                }

                List<DestinationReportRow> hotelImportRows;

                using (var mediaStream = mediaManager.GetMedia(fileItem).GetStream())
                {
                    hotelImportRows = csvUtilsService.ReadFromCsv<DestinationReportRow>(mediaStream.Stream);
                }

                if (hotelImportRows == null || !hotelImportRows.Any())
                {
                    RegisterDataError("No data found in the uploaded file.", true);
                    return;
                }

                CreateErrorMessageFromSkippedRows(hotelImportRows);

                var hotelCodes = hotelImportRows.Select(hotel => hotel.HotelCode).Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().ToList();
                var giataCodes = hotelImportRows.Where(x => string.IsNullOrWhiteSpace(x.HotelCode) && !string.IsNullOrWhiteSpace(x.GiataCode)).Select(hotel => hotel.GiataCode).Distinct().ToList();
                hotelCodes.AddRange(giataCodes);

                var accommodations = destinationsSearchService.GetDestinationsByCodes(hotelCodes.ToArray(), false).ToList();

                var codes = accommodations.Select(x => new { SourceCodes = x.SourceCodes ?? Array.Empty<string>(), GiataCode = x.GiataCode ?? string.Empty }).ToList();
                var missingHotels = hotelImportRows.Where(row => !codes.Any(x => x.SourceCodes.Contains(row.HotelCode) || x.GiataCode.Equals(row.GiataCode))).ToList();
                if (missingHotels.Any())
                {
                    var message = $"{Environment.NewLine}Next hotels were not found in Sitecore:" +
                                  $"{Environment.NewLine} {string.Join($",{Environment.NewLine}", missingHotels.Select(x => $"Hotel {x.HotelName} ({x.HotelCode}|{x.GiataCode})").ToArray())}";
                    RegisterDataError(message);
                }

                if (accommodations.Count <= 0)
                {
                    RegisterDataError("No hotel has been found in Sitecore.", true);
                    return;
                }

                using (new EditContext(contextItem))
                {
                    contextItem[Constants.Fields.PromoPage.Destination] = string.Empty;

                    var promoPageDestinations = (MultilistField)contextItem.Fields[Constants.Fields.PromoPage.Destination];

                    foreach (var accommodation in accommodations)
                    {
                        var accommodationId = accommodation.ItemId.ToString();
                        if (!promoPageDestinations.Contains(accommodationId))
                        {
                            promoPageDestinations.Add(accommodationId);
                        }
                    }

                    ShowOutcome();

                    Context.ClientPage.SendMessage(this, $"item:refreshchildren(id={contextItem.ID})");
                }
            }
            catch (Exception ex)
            {
                logger.Error(ex.Message, ex, this);
                RegisterDataError(ex.Message, true);
            }
        }

        /// <summary>
        /// Show modal window.
        /// </summary>
        /// <param name="errorMessage">Error message.</param>
        private void ShowOutcome()
        {
            if (!string.IsNullOrWhiteSpace(resultMessages))
            {
                Context.ClientPage.ClientResponse?.ShowError("Issues occurred during import", resultMessages);
            }
            else
            {
                Context.ClientPage.ClientResponse?.Alert("All destinations were imported successfuly.");
            }
        }

        /// <summary>
        /// Create error message from missing data in rows.
        /// </summary>
        /// <param name="hotelsToImport">Collection of HotelImportRow models to import.</param>
        private void CreateErrorMessageFromSkippedRows(IList<DestinationReportRow> hotelsToImport)
        {
            StringBuilder errorMessages = new StringBuilder();

            for (int rowIndex = 0; rowIndex < hotelsToImport.Count; rowIndex++)
            {
                var hotelToImport = hotelsToImport[rowIndex];

                if (string.IsNullOrWhiteSpace(hotelToImport.HotelCode) && string.IsNullOrWhiteSpace(hotelToImport.GiataCode))
                {
                    errorMessages.Append($"Row #{rowIndex + 1} was skipped due to Codes absence.{Environment.NewLine}");
                }
            }

            if (errorMessages.Length > 0)
            {
                RegisterDataError(errorMessages.ToString());
            }
        }

        /// <summary>
        /// Register error related to hotels data file.
        /// </summary>
        /// <param name="errorMessage">Message about errors reason.</param>
        private void RegisterDataError(string errorMessage, bool shouldShowOutcome = false)
        {
            resultMessages += errorMessage;
            logger.Warn(errorMessage, this);

            if (shouldShowOutcome)
            {
                ShowOutcome();
            }
        }
    }
}