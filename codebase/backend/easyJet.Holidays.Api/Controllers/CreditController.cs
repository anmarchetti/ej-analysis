using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.Extensions.Options;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    [Route("credit")]
    [ApiController]
    [ApiVersion("1.0")]
    public class CreditController : ControllerBase
    {
        private readonly IVouchersService _vouchersService;
        private readonly IMarketService _marketService;
        private readonly ApiSettings _apiSettings;

        private static readonly string AllowCacheHeader = "AllowCache";

        public CreditController(IVouchersService vouchersService, IOptions<ApiSettings> apiSettings, IMarketService marketService)
        {
            _apiSettings = apiSettings.Value ?? throw new ArgumentNullException(nameof(apiSettings));
            _vouchersService = vouchersService;
            _marketService = marketService;
        }

        [HttpGet]
        [Route("me")]
        [ProducesResponseType(typeof(MyCreditInfo[]), (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        public async Task<IActionResult> CustomerCredits()
        {
            try
            {
                if (!_apiSettings.Vouchers.IsActive)
                {
                    return Ok(new[]
                    {
                        new MyCreditInfo
                        {
                            Balance = 0,
                            Currency = null,
                            HasCreditHistory = false,
                            CreditIsEnabled = false
                        }
                    });
                }

                // Check if allow user to get vouchers info from cache
                var fromCache = bool.TryParse(Request.HttpContext?.Request?.Headers[AllowCacheHeader].ToString() ?? "", out var allowCache) && allowCache;
                var myCredit = await _vouchersService.MyCredits(null, !fromCache);

                if (myCredit.Values.Any())
                {
                    return Ok(myCredit.Values);
                }
                else
                {
                    return Ok(new[]
                    {
                        new MyCreditInfo
                        {
                            Balance = 0,
                            Currency = _marketService.GetCurrentMarket().Currency.Code,
                            HasCreditHistory = false,
                            CreditIsEnabled = true
                        }
                    });
                }
            }
            catch (ApiException ex)
            {
                throw new ApiException(ApiExceptionCodes.CreditsUserInfoNotAvailable, "Can not get customer credits info.", ex.InnerErrors, ex.InnerException, HttpStatusCode.BadRequest);
            }
        }

        [HttpGet]
        [Route("history")]
        [ProducesResponseType(typeof(Dictionary<string, IEnumerable<CreditHistoryItem>>), (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        public async Task<IActionResult> CreditHistory()
        {
            try
            {
                if (!_apiSettings.Vouchers.IsActive)
                {
                    return Ok(new Dictionary<string, IEnumerable<CreditHistoryItem>>());
                }

                var history = await _vouchersService.MyCreditHistory();
                return Ok(history.ToDictionary(x => x.Key.Code, x => x.Value));
            }
            catch (ApiException ex)
            {
                throw new ApiException(ApiExceptionCodes.CreditsHistoryNotAvailable, "Can not get customer credit history.", ex.InnerErrors, ex.InnerException, HttpStatusCode.BadRequest);
            }
        }
    }
}