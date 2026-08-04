using System;
using System.Linq;
using System.Web.Mvc;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.SitecoreExtensions.Controllers;
using easyJet.Foundation.SitecoreExtensions.Services;

namespace easyJet.Foundation.Destinations.Controllers
{
    public class BoardTypesController : BaseServicesApiController
    {
        private readonly IBoardTypesRepository boardTypesRepository;
        private readonly ICsvUtilsService csvUtilsService;

        public BoardTypesController(IBoardTypesRepository boardTypesRepository, ICsvUtilsService csvUtilsService, IDestinationsLogger logger)
            : base(logger)
        {
            this.boardTypesRepository = boardTypesRepository;
            this.csvUtilsService = csvUtilsService;
        }

        /// <summary>
        /// Search for Board Types by provided codes.
        /// </summary>
        /// <param name="request">Board Types codes.</param>
        /// <returns>Collection of Board Types codes and names.</returns>
        [HttpPost]
        public ActionResult Get(BaseByCodesRequest request)
        {
            if (request.Codes == null || !request.Codes.Any())
            {
                throw new ArgumentException($"Argument {nameof(request.Codes)} cannot be null or empty");
            }

            var data = boardTypesRepository.SearchByCodes(request.Codes);
            var response = new BoardTypesByCodesResponse(data.Hits.Select(x => new DatasourceObject(x.Document)).ToList());

            return Json(response, JsonRequestBehavior.DenyGet);
        }

        /// <summary>
        /// Exports board types to csv file.
        /// </summary>
        /// <param name="id">Board type item ID.</param>
        /// <param name="lang">Item's language.</param>
        /// <param name="database">Item's database.</param>
        /// <returns>File in csv format.</returns>
        public ActionResult ExportBoardTypes(string id, string lang, string database)
        {
            var boardTypesRows = boardTypesRepository.GetAllBoardTypeItems(database).Select(x => new BoardTypeReportRow(x));

            var data = csvUtilsService.WriteToCsv(boardTypesRows);

            return ExcelFile(data, $"board_types");
        }
    }
}