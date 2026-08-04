using System;
using System.Web.Mvc;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Services;
using easyJet.Foundation.SitecoreExtensions.Controllers;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Globalization;

namespace easyJet.Foundation.HotelBeds.Controllers
{
    public class FacilityTypesController : BaseServicesApiController
    {
        private readonly ICsvUtilsService csvUtilsService;
        private readonly IFacilityTypesService facilityTypesService;

        public FacilityTypesController(
            ICsvUtilsService csvUtilsService,
            IFacilityTypesService facilityTypesService,
            IHotelBedsLogger logger)
            : base(logger)
        {
            this.csvUtilsService = csvUtilsService;
            this.facilityTypesService = facilityTypesService;
        }

        /// <summary>
        /// Exports facilities to csv file.
        /// </summary>
        /// <param name="id">Promo page item ID.</param>
        /// <param name="lang">Item's language.</param>
        /// <param name="database">Item's database.</param>
        /// <returns>File in csv format.</returns>
        public ActionResult ExportFacilities(string id, string lang, string database)
        {
            if (string.IsNullOrEmpty(lang) || string.IsNullOrEmpty(id))
            {
                throw new ArgumentException($"Arguments are empty. Language: {lang}, ID: {id}");
            }

            var db = Factory.GetDatabase(database) ?? Context.Database ?? Context.ContentDatabase;
            var contextItem = db.GetItem(id, Language.Parse(lang));

            var rows = facilityTypesService.ExportFacilityTypes(contextItem);

            var data = csvUtilsService.WriteToCsv(rows);

            return ExcelFile(data, $"facilities_report");
        }
    }
}