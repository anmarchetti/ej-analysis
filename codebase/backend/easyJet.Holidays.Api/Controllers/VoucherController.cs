using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Interfaces.Promotions;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    [Route("voucher")]
    [ApiController]
    [ApiVersion("1.0")]
    public class VoucherController : ControllerBase
    {
        /// <summary>
        /// Voucher code pattern, allows letters and hyphens only
        /// </summary>
        private const string CodePattern = "^[\\w-]+$";
        private const string CodePatternErrorMessage = "Voucher code is invalid. Only word character and hyphens are allowed";
        private readonly IPromotionValidatorService _promotionValidatorService;
        private readonly IVouchersService _vouchersService;
        private readonly ApiSettings _apiSettings;
        private readonly IReferenceDataService _referenceDataService;

        public VoucherController(IPromotionValidatorService promotionValidatorService, IVouchersService vouchersService,
            IOptions<ApiSettings> apiSettings, IReferenceDataService referenceDataService)
        {
            _promotionValidatorService = promotionValidatorService;
            _vouchersService = vouchersService;
            _referenceDataService = referenceDataService;
            _apiSettings = apiSettings.Value ?? throw new ArgumentNullException(nameof(apiSettings));
        }

        /// <summary>
        /// Validate voucher
        /// </summary>
        /// <remarks>
        /// Sample request:
        /// 
        ///     Get: /voucher/validate?voucherCode=uGLnuL0R
        /// 
        /// </remarks>
        /// <param name="voucherCode">Voucher code. Must be alphanumeric.</param>
        /// <returns>Validation voucher model.
        /// VoucherType = PROMO_VOUCHER, if voucher is promo(configured in CMS).
        /// VoucherType = GIFT_VOUCHER, if voucher is a campaign voucher. 
        /// Corresponding errors, if validation failed.
        /// </returns>
        [HttpGet]
        [Route("validate")]
        [ProducesResponseType(typeof(ValidateVoucher), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> ValidateVoucher(
            [Required] [RegularExpression(CodePattern, ErrorMessage = CodePatternErrorMessage)]
            string voucherCode)
        {
            if (!_apiSettings.Vouchers.IsActive)
            {
                throw new ApiException(ApiExceptionCodes.VouchersDisabled);
            }

            var redeemEnabled = (await _referenceDataService.GetCreditBookingSettings()).EnableRedeemVoucher;

            if (!redeemEnabled)
            {
                throw new ApiException(ApiExceptionCodes.VouchersDisabled);
            }

            //firstly check against sitecore, if such promo code is configured in CMS
            var promotionExistsInCms = await _promotionValidatorService.PromoExists(voucherCode);

            if (promotionExistsInCms)
            {
                return Ok(new ValidateVoucher() { VoucherCode = voucherCode, VoucherType = VoucherType.PROMO_VOUCHER });
            }

            //this is not promo code configured in cms-> try to validate against voucherify
            var validateVoucher = await _vouchersService.Validate(voucherCode);

            return Ok(validateVoucher);
        }

        /// <summary>
        /// Redeem voucher and add credits to user balance 
        /// </summary>
        /// <remarks>
        /// Sample request:
        /// 
        ///     Get: /voucher/redeem?voucherCode=hpjKKIxo
        /// 
        /// </remarks>
        /// <param name="voucherCode">Voucher code. Must be alphanumeric.</param>
        /// <returns>Result model.
        /// Corresponding errors, if redeeming failed.
        /// </returns>
        [HttpGet]
        [Route("redeem")]
        [ProducesResponseType(typeof(ValidateVoucher), (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        public async Task<IActionResult> RedeemVoucher(
            [Required] [RegularExpression(CodePattern, ErrorMessage = CodePatternErrorMessage)]
            string voucherCode)
        {
            if (!_apiSettings.Vouchers.IsActive)
            {
                throw new ApiException(ApiExceptionCodes.VouchersDisabled);
            }

            var redeemEnabled = (await _referenceDataService.GetCreditBookingSettings()).EnableRedeemVoucher;
            if (!redeemEnabled)
            {
                throw new ApiException(ApiExceptionCodes.VouchersDisabled);
            }

            var voucherPublishResult = await _vouchersService.ConvertVoucherToCredits(voucherCode);
            return Ok(voucherPublishResult);
        }

        /// <summary>
        /// Get single use promo code.
        /// </summary>
        /// <returns>Returns get single use promo code.</returns>
        [HttpGet]
        [Route("single-use-promo-code")]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        public async Task<IActionResult> GetSingleUsePromoCode(string campaignId)
        {
            var customerPromoCode = await _vouchersService.GetSingleUsePromoCode(campaignId);
            return Ok(customerPromoCode);
        }
    }
}