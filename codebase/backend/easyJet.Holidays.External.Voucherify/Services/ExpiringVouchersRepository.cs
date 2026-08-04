using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Voucherify.Models.Vouchers;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.External.Voucherify.Services
{
    public class ExpiringVouchersRepository : IExpiringVouchersRepository
    {
        private readonly IApiService _apiService;
        private readonly EndpointsProvider _endpointsProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<ExpiringVouchersRepository> _logger;

        public ExpiringVouchersRepository(IApiService apiService,
            EndpointsProvider endpointsProvider,
            IHttpContextAccessor httpContextAccessor,
            ILogger<ExpiringVouchersRepository> logger
        )
        {
            _apiService = apiService;
            _endpointsProvider = endpointsProvider;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        /// <summary>
        /// Get all vouchers expiring per day = (DateTimeNow + expirationDays)
        /// </summary>
        /// <param name="voucherType">Voucher type</param>
        /// <param name="limit">Elements limit per page</param>
        /// <param name="expirationDays">Expiration days</param>
        /// <param name="onlyActive">Only active vouchers flag</param>
        /// <returns></returns>
        public async Task<IEnumerable<VoucherWithCustomer>> GetAllExpiringVouchers(VoucherType voucherType,
            int expirationDays, bool onlyActive = true, int limit = 100)
        {
            if (limit < 1) throw new ArgumentOutOfRangeException(nameof(limit));
            if (expirationDays < 0) throw new ArgumentOutOfRangeException(nameof(expirationDays));

            var vouchersResponses = new List<VouchersListResponse>();

            int page = 0;
            int totalVouchers;
            do
            {
                page++;
                var expiringVouchers = await GetExpiringVouchers(voucherType, limit, page, expirationDays, onlyActive);

                //if there are no vouchers in response -> we abort next requests
                if (expiringVouchers == null)
                {
                    break;
                }

                totalVouchers = expiringVouchers.Payload.Body.Total ?? 0;

                vouchersResponses.Add(expiringVouchers);
            } while (totalVouchers - page * limit > 0);

            return vouchersResponses.SelectMany(response => response?.Payload?.Body?.Vouchers);
        }

        /// <summary>
        /// Get vouchers expiring per day = (DateTimeNow + expirationDays)
        /// </summary>
        /// <param name="voucherType">Voucher type</param>
        /// <param name="limit">Elements limit per page</param>
        /// <param name="page">Page number</param>
        /// <param name="expirationDays">Expiration days</param>
        /// <param name="onlyActive">Only active vouchers flag</param>
        /// <returns></returns>
        private async Task<VouchersListResponse> GetExpiringVouchers(VoucherType voucherType, int limit, int page,
            int expirationDays, bool onlyActive = true)
        {
            if (limit < 1) throw new ArgumentOutOfRangeException(nameof(limit));
            if (page < 1) throw new ArgumentOutOfRangeException(nameof(page));
            if (expirationDays < 0) throw new ArgumentOutOfRangeException(nameof(expirationDays));

            var vouchersRequest =
                BuildExpiringVouchersRequest(voucherType, limit, page, expirationDays, onlyActive);

            var response =
                await _apiService.GetResponseContentAsync<VouchersListRequest, VouchersListResponse>(
                    vouchersRequest);

            if (response?.Payload?.Body?.Vouchers == null || !response.Payload.Body.Vouchers.Any())
            {
                _logger.LogInformation("Haven't received vouchers from voucherify api");
                return null;
            }

            _logger.LogInformation(
                "Total expiring vouchers: {Total}. Received in current response: {Count}",
                response.Payload?.Body?.Total, response.Payload?.Body?.Vouchers?.Count());

            return response;
        }

        /// <summary>
        /// Build vouchers request
        /// </summary>
        /// <param name="voucherType">Voucher type</param>
        /// <param name="limit">Elements limit per page</param>
        /// <param name="page">Page number</param>
        /// <param name="expirationDays">Expiration days</param>
        /// <param name="onlyActive">Only active vouchers flag</param>
        /// <returns></returns>
        private VouchersListRequest BuildExpiringVouchersRequest(VoucherType voucherType, int limit, int page,
            int expirationDays, bool onlyActive)
        {
            var dateTimeNow = DateTime.UtcNow;
            //Expiration days = 10, DateTimeNow = "2021-03-16T01:02:00.00Z" => we should search in period: "2021-03-25T23:59:59.59Z" - "2021-03-27T00:00:00.00Z"
            var expirationDateAfter = dateTimeNow.AddDays(expirationDays).Date.AddMilliseconds(-1).ToUniversalTime();
            var expirationDateBefore = dateTimeNow.AddDays(expirationDays + 1).Date.ToUniversalTime();

            var vouchersRequest = new VouchersListRequest
            {
                Endpoint = _endpointsProvider.GetEndpoint(VoucherifyEndpoint.Vouchers,
                    _httpContextAccessor?.HttpContext?.Request?.Cookies),
                Page = page,
                Limit = limit,
                OnlyActive = onlyActive,
                ExpirationDateAfter = expirationDateAfter.ToString("O"),
                ExpirationDateBefore = expirationDateBefore.ToString("O"),
                VoucherType = voucherType.ToString()
            };
            vouchersRequest.SetQueryString();
            return vouchersRequest;
        }
    }
}