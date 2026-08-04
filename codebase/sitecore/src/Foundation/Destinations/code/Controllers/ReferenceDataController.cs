using System;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Mvc;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Controllers;
using Sitecore.Data;

namespace easyJet.Foundation.Destinations.Controllers
{
    public class ReferenceDataController : BaseServicesApiController
    {
        private readonly IRoomTypesRepository roomTypesRepository;
        private readonly ITransferTypesRepository transferTypesRepository;
        private readonly ITransferInfoRepository transferInfoRepository;
        private readonly IFiltredFacilitiesService filtredFacilitiesService;
        private readonly IHotelThemesService hotelThemesService;
        private readonly IVirtualFacilityGroupingService virtualFacilityGroupingService;
        private readonly IReferenceDataService referenceDataService;

        public ReferenceDataController(
            IRoomTypesRepository roomTypesRepository,
            ITransferTypesRepository transferTypesRepository,
            ITransferInfoRepository transferInfoRepository,
            IFiltredFacilitiesService filtredFacilitiesService,
            IHotelThemesService hotelThemesService,
            IDestinationsLogger logger,
            IVirtualFacilityGroupingService virtualFacilityGroupingService,
            IReferenceDataService referenceDataService)
            : base(logger)
        {
            this.roomTypesRepository = roomTypesRepository;
            this.transferTypesRepository = transferTypesRepository;
            this.transferInfoRepository = transferInfoRepository;
            this.filtredFacilitiesService = filtredFacilitiesService;
            this.hotelThemesService = hotelThemesService;
            this.virtualFacilityGroupingService = virtualFacilityGroupingService;
            this.referenceDataService = referenceDataService;
        }

        [HttpGet]
        public ActionResult GetAllCountries()
        {
            var response = referenceDataService.GetAllCountries();

            return Json(response, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public ActionResult GetAllDialingCodes()
        {
            var response = referenceDataService.GetAllDialingCodes();

            return Json(response, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public ActionResult GetAllBoardTypes()
        {
            var boardTypes = referenceDataService.GetAllBoardTypes();

            return Json(boardTypes, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public ActionResult GetAllRoomTypes()
        {
            var roomTypes = referenceDataService.GetAllRoomTypes();

            return UnlimitedJson(roomTypes, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public ActionResult GetRoomTypes(int page, int take)
        {
            var data = referenceDataService.GetRoomTypes(page, take);

            var response = new RoomTypesResponse
            {
                Page = page,
                Take = take,
                Total = data.TotalSearchResults,
                RoomTypes = data.Rooms
            };
            return Json(response, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public ActionResult GetRoomTypesByCodes(BaseByCodesRequest request)
        {
            if (request.Codes == null || !request.Codes.Any())
            {
                throw new ArgumentException($"Argument {nameof(request.Codes)} cannot be null or empty");
            }

            var data = roomTypesRepository.GetByCodes(request.Codes);
            var roomTypes = data.Hits.Select(x => x.Document).Select(x => new RoomType
            {
                Code = x.Code,
                Name = x.Title,
                ItemName = x.Name,
                Content = x.RichTextContent,
                Description = x.Description
            });

            return Json(roomTypes, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public ActionResult GetAllTransfers()
        {
            var data = transferTypesRepository.GetAll();
            return Json(data, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Get all transfers duration as a dictionary mapping ProductId to Duration.
        /// </summary>
        /// <returns>Dictionary with ProductId as key and Duration as value.</returns>
        [HttpGet]
        public ActionResult GetAllTransferDurations()
        {
            var transfersDuration = transferInfoRepository.GetAllTransferDurations();
            return Json(transfersDuration, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public ActionResult GetFiltredFacilities()
        {
            var data = filtredFacilitiesService.GetFiltredFacilities();
            return Json(data, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Action returns hotel themes in json format.
        /// </summary>
        /// <returns>Hotel themes in json format.</returns>
        [HttpGet]
        public ActionResult GetHotelThemes()
        {
            var data = hotelThemesService.GetHotelThemes();

            var response = new HotelThemeResponse(data);

            return Json(response, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Action returns virtual facility group id in json format.
        /// </summary>
        /// <param name="id">Facility id.</param>
        /// <returns>Virtual facility group id in json format.</returns>
        [HttpGet]
        public ActionResult GetVirtualFacilityGroupIdByFacilityId(string id)
        {
            ID.TryParse(id, out ID parsedId);

            if (parsedId.IsNull)
            {
                throw new ArgumentException($"Argument {nameof(parsedId)} cannot be null");
            }

            var response = new { VirtualFacilityGroupId = virtualFacilityGroupingService.GetVirtualFacilityGroupId(parsedId) };

            return Json(response, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Get all hotels codes.
        /// </summary>
        /// <returns>Collection of codes in JSON format.</returns>
        [HttpGet]
        public ActionResult GetAllHotelCodes()
        {
            var response = referenceDataService.GetHotelCodes();
            return Json(response, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Get Giata to accommodation codes mapping.
        /// </summary>
        /// <param name="request">Accomodation codes from different Atcom systems</param>
        /// <returns>Collection of code mappings in JSON format.</returns>
        [HttpPost]
        public async Task<ActionResult> GetAccommodationToGiataMapping(GiataToAccomMappingRequest request)
        {
            if (request.AtcomIds == null || !request.AtcomIds.Any())
            {
                throw new ArgumentException($"Argument {nameof(request.AtcomIds)} cannot be null or empty");
            }

            var response = await referenceDataService.GetAccommodationToGiataMapping(request.AtcomIds);
            return UnlimitedJson(response, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Get filter pills configuration.
        /// </summary>
        /// <returns>Filter pills configuration in JSON format.</returns>
        [HttpGet]
        public ActionResult GetFilterPillsConfig()
        {
            var response = referenceDataService.GetFilterPillsConfig();
            return Json(response, JsonRequestBehavior.AllowGet);
        }
    }
}