using System;
using System.Net;
using System.Web.Mvc;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Attributes;
using easyJet.Foundation.SitecoreExtensions.Controllers;

namespace easyJet.Foundation.Destinations.Controllers
{
    public class HotelContentController : BaseServicesApiController
    {
        private readonly IExpediaHotelContentUpsertService hotelContentService;

        public HotelContentController(
            IExpediaHotelContentUpsertService hotelContentService,
            IDestinationsLogger logger)
            : base(logger)
        {
            this.hotelContentService = hotelContentService;
        }

        /// <summary>
        /// //[CmsApiKeyAuthorize]
        /// </summary>
        /// <param name="request">request</param>
        /// <returns>response</returns>
        [HttpPost]
        [CmsApiKeyAuthorize]
        public ActionResult UpsertHotel(UpsertHotelRequest request)
        {
            try
            {
                if (request == null)
                {
                    return new HttpStatusCodeResult(HttpStatusCode.BadRequest, "Request body is required.");
                }

                if (string.IsNullOrWhiteSpace(request.GiataCode) && string.IsNullOrWhiteSpace(request.SitecoreId))
                {
                    return new HttpStatusCodeResult(HttpStatusCode.BadRequest, "Either GiataCode or SitecoreId must be provided.");
                }

                var result = hotelContentService.UpsertFromExpedia(request);

                Response.StatusCode = result.Created
                    ? (int)HttpStatusCode.Created
                    : (int)HttpStatusCode.OK;

                return Json(result);
            }
            catch (ArgumentException ex)
            {
                Logger.Warn($"Invalid hotel upsert request. GiataCode: {request?.GiataCode}, SitecoreId: {request?.SitecoreId}. Error: {ex.Message}", this);

                return new HttpStatusCodeResult(HttpStatusCode.BadRequest, ex.Message);
            }
            catch (Exception ex)
            {
                Logger.Error($"Error while upserting hotel content. GiataCode: {request?.GiataCode}, SitecoreId: {request?.SitecoreId}", ex, this);

                return new HttpStatusCodeResult(HttpStatusCode.InternalServerError);
            }
        }
    }
}
