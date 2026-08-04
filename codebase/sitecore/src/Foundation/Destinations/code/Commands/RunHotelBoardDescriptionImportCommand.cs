using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Reports.Services;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.SecurityModel;

namespace easyJet.Foundation.Destinations.Commands
{
    public class RunHotelBoardDescriptionImportCommand : BaseCsvCommand
    {
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly IBoardTypesRepository boardTypesRepository;
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IHotelBoardDescriptionUploadReportService reportService;

        public RunHotelBoardDescriptionImportCommand(
            ICsvUtilsService csvUtilsService,
            IDestinationsSearchService destinationsSearchService,
            IBoardTypesRepository boardTypesRepository,
            IDatasourceRepository datasourceRepository,
            IHotelBoardDescriptionUploadReportService reportService,
            IDatabaseProvider databaseProvider,
            IDestinationsLogger logger,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, csvUtilsService, logger, userCreationService, sitecoreUiService)
        {
            this.destinationsSearchService = destinationsSearchService;
            this.boardTypesRepository = boardTypesRepository;
            this.datasourceRepository = datasourceRepository;
            this.reportService = reportService;
        }

        /// <summary>
        /// Synchronize items from supplied file.
        /// </summary>
        /// <param name="contextItem">Context item.</param>
        /// <returns>Create or updated items.</returns>
        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            // Get Data from file
            var importData = GetImportData(contextItem);
            if (importData.Count == 0)
            {
                yield break;
            }

            var giataCodes = importData.Keys.ToArray();

            var accommodations = destinationsSearchService.GetHotelsByGiataCodes(giataCodes)
                .GroupBy(x => x.GiataCode)
                .ToDictionary(group => group.Key, data => data.Select(x => DatabaseProvider.GetItem(x.Uri)));

            if (accommodations.Count == 0)
            {
                reportService.Warn(importData.SelectMany(x => x.Value.Values), Constants.ReportErrors.HotelNotExist);
                yield break;
            }

            var boardCodes = importData.SelectMany(x => x.Value.Keys).ToArray();

            var boardTypes = boardTypesRepository.SearchByCodes(boardCodes)
                .ToDictionary(x => x.Document.Code, x => DatabaseProvider.GetItem(x.Document.Uri));

            using (new SecurityDisabler())
            using (new DatabaseCacheDisabler())
            using (new BulkUpdateContext())
            {
                foreach (var accommodation in accommodations)
                {
                    string accommodationCode = accommodation.Key;
                    if (!importData.TryGetValue(accommodationCode, out var accommodationBoards))
                    {
                        reportService.Warn(accommodationBoards.Values.ToArray(), Constants.ReportErrors.HotelNotExist);
                        continue;
                    }

                    foreach (var accommodationItem in accommodation.Value)
                    {
                        yield return ProcessAccommodation(accommodationItem, accommodationBoards.Values, boardTypes);
                    }
                }
            }
        }

        private Dictionary<string, Dictionary<string, HotelBoardDescriptionUpload>> GetImportData(Item mediaItem)
        {
            var result = new Dictionary<string, Dictionary<string, HotelBoardDescriptionUpload>>();

            var rows = GetFileData<HotelBoardDescriptionUpload>(mediaItem)
                .Where(x => !string.IsNullOrWhiteSpace(x.GiataCode))
                .GroupBy(x => x.GiataCode);

            foreach (var row in rows)
            {
                var hotelCode = row.Key;
                var boards = new Dictionary<string, HotelBoardDescriptionUpload>();
                foreach (var column in row)
                {
                    if (!string.IsNullOrWhiteSpace(column.BoardCode))
                    {
                        if (boards.ContainsKey(column.BoardCode))
                        {
                            reportService.Warn(column.GiataCode, column.HotelName, column.GiataCode, column.BoardName, Constants.ReportErrors.DuplicateBoardTypesCodes);
                            continue;
                        }

                        boards[column.BoardCode] = column;
                    }
                }

                result[hotelCode] = boards;
            }

            return result;
        }

        private Item ProcessAccommodation(Item item, IEnumerable<HotelBoardDescriptionUpload> syncData, Dictionary<string, Item> boardTypes)
        {
            var boardsFolder = datasourceRepository.GetOrCreateItem(Constants.Fields.AccommodationItem.Boards, Constants.TemplateIds.AccommodationBoardsFolder, item);

            var boards = boardsFolder
                .GetChildren()
                .Where(x => x.TemplateID.Equals(Constants.TemplateIds.AccommodationBoard) &&
                            !string.IsNullOrWhiteSpace(x[Constants.Fields.AccommodationBoardItem.BoardType]))
                .GroupBy(x =>
                    x.GetTargetItem(Constants.Fields.AccommodationBoardItem.BoardType)
                        .Fields[Constants.Fields.DatasourceItem.Code].Value)
                .ToDictionary(x => x.Key, x => x.ToArray());

            foreach (var row in syncData)
            {
                try
                {
                    Item boardItem = null;

                    // Skip board description if hotel has duplicate boards.
                    if (boards.TryGetValue(row.BoardCode, out var boardItems) && boardItems != null &&
                        boardItems.Length > 1)
                    {
                        reportService.Warn(row.GiataCode, row.HotelName, row.BoardCode, row.BoardName, Constants.ReportErrors.DuplicateHotelBoards);
                        continue;
                    }

                    // If hotel doesn't have any boards then create board by existing board type.
                    if (boardItems == null)
                    {
                        var boardType = boardTypes[row.BoardCode];
                        boardItem = datasourceRepository.GetOrCreateItem(boardType.Name, Constants.TemplateIds.AccommodationBoard, boardsFolder);
                        boardItem.Editing.BeginEdit();
                        boardItem.Fields[Constants.Fields.AccommodationBoardItem.BoardType].Value = boardTypes[row.BoardCode].ID.ToString();
                        boardItem.Editing.EndEdit();
                    }
                    else
                    {
                        // Get first board item if hotel doesn't have duplicates and board type exists.
                        boardItem = boardItems.First();
                    }

                    boardItem.Editing.BeginEdit();
                    boardItem.Fields[Constants.Fields.AccommodationBoardItem.Content].Value = row.BoardDescription;
                    boardItem.Editing.EndEdit();
                }
                catch (Exception ex)
                {
                    var errorMessage = $"Error is thrown during processing hotel {item.Name} with id: {item.ID}";
                    reportService.Warn(row.GiataCode, row.HotelName, row.BoardCode, row.BoardName, Constants.ReportErrors.UnhandledException);
                    Logger.Error(errorMessage, ex, this);
                }
            }

            return item;
        }
    }
}