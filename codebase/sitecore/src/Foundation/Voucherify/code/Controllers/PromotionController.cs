using System;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Mvc;
using easyJet.Foundation.DynamoDb.Models;
using easyJet.Foundation.DynamoDb.Repositories.Base;
using easyJet.Foundation.Multisite.Services;
using easyJet.Foundation.SitecoreExtensions.Controllers;
using easyJet.Foundation.Voucherify.Logging;
using easyJet.Foundation.Voucherify.Models.Requests;
using easyJet.Foundation.Voucherify.Services;
using easyJet.Foundation.Voucherify.Validator;
using Sitecore;
using Sitecore.Diagnostics;

namespace easyJet.Foundation.Voucherify.Controllers
{
    public class PromotionController : BaseServicesApiController
    {
        private readonly IPromotionService promotionService;
        private readonly IMarketSettingsService marketSettingsService;
        private readonly IPromotionValidationService validationService;

        public PromotionController(
            IPromotionService promotionService,
            IMarketSettingsService marketSettingsService,
            IPromotionValidationService validationService,
            IVoucherifyLogger logger)
            : base(logger)
        {
            this.promotionService = promotionService;
            this.marketSettingsService = marketSettingsService;
            this.validationService = validationService;
        }

        /// <summary>
        /// Validate promotions and booking request against Sitecore Promotion.
        /// </summary>
        /// <param name="request">Validate booking request.</param>
        /// <returns>Validation Result.</returns>
        [HttpPost]
        public ActionResult Validate(ValidateBookingRequest request)
        {
            if (string.IsNullOrEmpty(request?.VoucherCode))
            {
                throw new ArgumentException($"Argument {nameof(request.VoucherCode)} cannot be null or empty");
            }

            var marketCode = ResolveMarketCode(request?.MarketCode);

            var promotions = promotionService.GetPromotionsByCode(request.VoucherCode, marketCode);

            if (promotions.Count <= 0)
            {
                return HttpNotFound($"Promotions with code {request.VoucherCode} was not found in {marketCode} market. Language: {Sitecore.Context.Language.Name}");
            }

            var response = validationService.ValidateBooking(request, promotions);

            return Json(response);
        }

        /// <summary>
        /// Validate promotions and booking request against Sitecore Promotion.
        /// </summary>
        /// <param name="request">Validate booking request.</param>
        /// <returns>Validation Result.</returns>
        [HttpPost]
        public ActionResult MatchPromoCodes(MatchPromocodesRequest request)
        {
            if (string.IsNullOrEmpty(request?.VoucherCode))
            {
                throw new ArgumentException($"Argument {nameof(request.VoucherCode)} cannot be null or empty");
            }

            if (request?.ValidateBookingRequests is null)
            {
                throw new ArgumentException($"Argument {nameof(request.ValidateBookingRequests)} cannot be null or empty");
            }

            var discounts = promotionService.MatchPromocodeForOffers(
                request.VoucherCode,
                request.ValidateBookingRequests,
                request?.MarketCode ?? marketSettingsService.GetCurrentMarket().Code);

            return Json(new MatchPromocodesResponse { PromocodeDiscounts = discounts });
        }

        /// <summary>
        /// Get customer promotion code by atcom promo code.
        /// </summary>
        /// <param name="request">Validate booking request.</param>
        /// <returns>Customer promo code.</returns>
        [HttpPost]
        public ActionResult GetCustomerPromoCode(CustomerPromoCodeRequest request)
        {
            if (string.IsNullOrEmpty(request.AtcomPromoCode))
            {
                throw new ArgumentException($"Argument {nameof(request.AtcomPromoCode)} cannot be null or empty");
            }

            var marketCode = ResolveMarketCode(request?.MarketCode);

            var promotion = promotionService.GetPromotionByAtcomPromoCode(request.AtcomPromoCode, marketCode);

            if (promotion == null || string.IsNullOrEmpty(promotion.Title))
            {
                return HttpNotFound($"Promotions with code {request.AtcomPromoCode} was not found in {marketCode} market. Language: {Sitecore.Context.Language.Name}.");
            }

            return Json(promotion.Title);
        }

        /// <summary>
        /// Get all promotions from Sitecore.
        /// </summary>
        /// <param name="marketCode">Optional: Market code.</param>
        /// <returns>All promotions.</returns>
        [HttpGet]
        public ActionResult GetAll(string marketCode)
        {
            var market = ResolveMarketCode(marketCode);
            var promotions = promotionService.GetAll(market);

            return Json(promotions, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Resolve market code.
        /// </summary>
        /// <param name="requestedMarketCode">Market code from request.</param>
        /// <returns>Market code.</returns>
        private string ResolveMarketCode(string requestedMarketCode)
        {
            // Temp solution for Trade Portal site as TradePortal does not have markets yet.
            // If current site is Trade Portal then we do not search promotion by market code.
            if (Context.GetSiteName() == "TradePortal")
            {
                return null;
            }

            return requestedMarketCode ?? marketSettingsService.GetCurrentMarket().Code;
        }
    }
}