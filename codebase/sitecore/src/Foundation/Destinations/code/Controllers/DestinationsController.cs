using System.Linq;
using System.Web.Mvc;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Attributes;
using easyJet.Foundation.SitecoreExtensions.Controllers;
using easyJet.Foundation.SitecoreExtensions.Helper;
using easyJet.Foundation.SitecoreExtensions.Models;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data.Fields;

namespace easyJet.Foundation.Destinations.Controllers
{
    public class DestinationsController : BaseServicesApiController
    {
        private readonly ICsvUtilsService csvUtilsService;
        private readonly IHotelThemesService hotelThemesService;

        public DestinationsController(
            ICsvUtilsService csvUtilsService,
            IHotelThemesService hotelThemesService,
            IDestinationsLogger logger)
            : base(logger)
        {
            this.csvUtilsService = csvUtilsService;
            this.hotelThemesService = hotelThemesService;
        }

        /// <summary>
        /// Exports Promo page Destination to csv file.
        /// </summary>
        /// <param name="id">Promo page item ID.</param>
        /// <param name="lang">Item's language.</param>
        /// <param name="database">Item's database.</param>
        /// <returns>File in csv format.</returns>
        [LogExecutionTime]
        public ActionResult ExportPromoDestinations(string id, string lang, string database)
        {
            var contextItem = ItemContextJobHelper.GetContextItem(id, lang, database);
            MultilistField destinations = contextItem.Fields[Constants.Fields.PromoPage.Destination];

            var destinationsRows = destinations?.GetItems().Select(item => new DestinationReportRow(item));

            var data = csvUtilsService.WriteToCsv(destinationsRows);

            return ExcelFile(data, $"{contextItem.DisplayName}_destinations");
        }

        /// <summary>
        /// Exports hotels with themes.
        /// </summary>
        /// <param name="id">Promo page item ID.</param>
        /// <param name="lang">Item's language.</param>
        /// <param name="database">Item's database.</param>
        /// <returns>File in csv format.</returns>
        [LogExecutionTime]
        public ActionResult ExportHotelWithThemes(string id, string lang, string database)
        {
            var contextItem = ItemContextJobHelper.GetContextItem(id, lang, database);
            var hotelsReportRows = hotelThemesService.GetHotelsWithThemes(contextItem);

            var data = csvUtilsService.WriteToCsv(hotelsReportRows, new FileParameters()
            {
                HasHeaderRecord = true,
                FileDataDelimiter = ","
            });
            return ExcelFile(data, $"hotels_with_themes");
        }
    }
}