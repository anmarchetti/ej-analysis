using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.Voucherify.Models;
using easyJet.Holidays.External.Voucherify.Models.Customer;
using easyJet.Holidays.External.Voucherify.Models.Vouchers;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Voucherify.DataModel;
using VoucherifyLib = Voucherify; //without this declaration easyJet.Holidays.External.Voucherify.* namespace is used instead of Voucherify.* from voucherify library

namespace easyJet.Holidays.External.Voucherify.Services
{
    public class VoucherCustomersRepository : IVouchersCustomerRepository
    {
        private readonly IApiService _apiService;
        private readonly EndpointsProvider _endpointsProvider;
        private readonly VoucherifySettings _voucherifySettings;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<VoucherCustomersRepository> _logger;

        public VoucherCustomersRepository(
            IApiService apiService,
            IOptions<VoucherifySettings> voucherifySettings,
            EndpointsProvider endpointsProvider,
            IHttpContextAccessor httpContextAccessor,
            ILogger<VoucherCustomersRepository> logger)
        {
            _voucherifySettings = voucherifySettings?.Value ?? throw new ArgumentNullException(nameof(voucherifySettings));

            _apiService = apiService;
            _endpointsProvider = endpointsProvider;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<Customer> GetOrCreate(string customerId, CustomerDetails customer)
        {
            try
            {
                if (!string.IsNullOrEmpty(customerId))
                {
                    var customerById = await Get(customerId);
                    return customerById;
                }
                else if (!string.IsNullOrEmpty(customer?.Email))
                {
                    var customerByEmail = await GetCustomersByEmail(customer.Email);

                    if (customerByEmail != null && customerByEmail.Customers?.Count > 0)
                    {
                        return customerByEmail?.Customers?.OrderByDescending(x => x.SourceId).FirstOrDefault();
                    }
                }
            }
            catch (Exception ex)
            {
                // use warning here because it's expected to get errors for new customers
                _logger.LogInformation(ex, "Cannot get voucherify customer by id={CustomerId}", customerId);
            }

            return await Create(customerId, customer);
        }

        /// <inheritdoc />
        public async Task<Customer> Update(string id, string newSourceId, string newName)
        {
            var request = new CustomerUpdateRequest();
            request.Payload.Body = new CustomerUpdateRequestBody
            {
                Name = newName,
                SourceId = newSourceId
            };

            request.Endpoint = _endpointsProvider.GetEndpoint(VoucherifyEndpoint.Customer, _httpContextAccessor.HttpContext.Request.Cookies, new Dictionary<string, string> {
                { "id", id}
            });
            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<CustomerUpdateRequest, CustomerCreateResponse>(request, ApiExceptionCodes.VoucherCustomerCreate);
            return response?.Payload.Body;
        }

        /// <summary>
        /// Create new customer
        /// </summary>
        /// <param name="customerId"></param>
        /// <param name="customer"></param>
        /// <returns></returns>
        public async Task<Customer> Create(string customerId, CustomerDetails customer)
        {
            var request = new CustomerCreateRequest();
            request.Payload.Body = new VoucherifyLib.DataModel.Contexts.CustomerCreate
            {
                SourceId = customerId,
                Name = (!string.IsNullOrEmpty(customer?.FirstName) || !string.IsNullOrEmpty(customer?.LastName))
                ? $"{customer?.FirstName} {customer?.LastName}"
                : customer?.Email,
                Email = customer?.Email?.ToLowerInvariant(),
                Metadata = new VoucherifyLib.Core.DataModel.Metadata() {
                    { "lang", "eng" }
                }
            };

            request.Endpoint = _endpointsProvider.GetEndpoint(VoucherifyEndpoint.Customers, _httpContextAccessor?.HttpContext?.Request?.Cookies);
            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<CustomerCreateRequest, CustomerCreateResponse>(request, ApiExceptionCodes.VoucherCustomerCreate);
            return response?.Payload.Body;
        }

        /// <summary>
        /// Get existing customer
        /// </summary>
        /// <param name="customerId"></param>
        /// <returns></returns>
        private async Task<Customer> Get(string customerId)
        {
            var request = new CustomerGetRequest();

            request.Endpoint = _endpointsProvider.GetEndpoint(VoucherifyEndpoint.Customer, _httpContextAccessor?.HttpContext?.Request?.Cookies, new Dictionary<string, string> {
                { "id", customerId}
            });

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<CustomerGetRequest, CustomerCreateResponse>(request, ApiExceptionCodes.VoucherCustomerGet);
            return response?.Payload.Body;
        }

        /// <summary>
        /// Get customer by id without exception
        /// </summary>
        /// <param name="customerId"></param>
        /// <returns></returns>
        public async Task<Customer> GetWithoutException(string customerId)
        {
            try
            {
                return await Get(customerId);
            }
            catch (Exception e)
            {
                //suppress exception and just log information
                _logger.LogInformation(e, "Cannot get Voucherify customer by id={CustomerId}", customerId);
                return null;
            }
        }

        /// <summary>
        /// Get customers by ids
        /// </summary>
        /// <param name="customerIds"></param>
        /// <returns></returns>
        public async Task<IEnumerable<Customer>> Get(IEnumerable<string> customerIds)
        {
            if (customerIds == null || !customerIds.Any())
            {
                return Enumerable.Empty<Customer>();
            }

            var getCustomersTasks = customerIds.Select(GetWithoutException);
            var customers = await Task.WhenAll(getCustomersTasks);
            return customers.Where(x => x != null); // we dont want to return mix of nulls & valid object
        }

        /// <inheritdoc/>
        public async Task<CustomerList> GetCustomersByEmail(string customerEmail, int limit = 1)
        {
            var request = new CustomersGetRequest();
            request.Email = customerEmail.ToLowerInvariant();
            request.Limit = limit.ToString();
            request.SetQueryString();
            request.Endpoint = _endpointsProvider.GetEndpoint(VoucherifyEndpoint.Customers, _httpContextAccessor?.HttpContext?.Request?.Cookies);
            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<CustomersGetRequest, CustomersCreateResponse>(request, ApiExceptionCodes.VoucherCustomersGet);
            return response?.Payload.Body;
        }

        /// <inheritdoc />
        public async Task<List<VoucherWithCustomer>> GetCustomerVouchers(string customerId)
        {
            async Task<VouchersList> GetVouchers(int page, int limit)
            {
                var request = new VouchersListRequest
                {
                    Customer = customerId,
                    Limit = limit,
                    Page = page
                };
                request.SetQueryString();
                request.Endpoint = _endpointsProvider.GetEndpoint(VoucherifyEndpoint.Vouchers, _httpContextAccessor?.HttpContext?.Request.Cookies);
                var response = await _apiService.GetResponseContentAsync<VouchersListRequest, VouchersListResponse>(request);
                return response?.Payload?.Body;
            };

            var limit = _voucherifySettings.PageSize; // from settings
            int page = 0;
            int totalVouchers = 0;
            var vouchersResponses = new List<VoucherWithCustomer>();

            do
            {
                page++;
                var vouchersResponse = await GetVouchers(page, limit);
                totalVouchers = vouchersResponse?.Total ?? 0;

                var vouchers = vouchersResponse?.Vouchers ?? new List<VoucherWithCustomer>();
                // if there are no vouchers in response -> we abort next requests
                if (!vouchers.Any())
                {
                    break;
                }
                vouchersResponses.AddRange(vouchers);
            } while (totalVouchers - page * limit > 0);

            return vouchersResponses;
        }

        /// <inheritdoc />
        public async Task<RedemptionList> GetCustomerHistory(string customerId)
        {
            var limit = _voucherifySettings.PageSize;
            var page = 1;
            var redemptionList = await GetPagedCustomerHistory(customerId, limit, page);
            while (redemptionList.Total > redemptionList.Redemptions.Count)
            {
                var nextPageOfRedemptionList = await GetPagedCustomerHistory(customerId, limit, ++page);
                redemptionList.Redemptions.AddRange(nextPageOfRedemptionList.Redemptions);
            }
            return redemptionList;
        }
        private async Task<RedemptionList> GetPagedCustomerHistory(string customerId, int limit = 100, int page = 1)
        {
            var request = new GetRedemptionsRequest
            {
                Page = page,
                Limit = limit,
                Customer = customerId
            };
            request.SetQueryString();
            request.Endpoint = _endpointsProvider.GetEndpoint(VoucherifyEndpoint.GetRedemptions, _httpContextAccessor?.HttpContext?.Request.Cookies);
            var response = await _apiService.GetResponseContentAsync<GetRedemptionsRequest, GetRedemptionsResponse>(request);
            return response?.Payload.Body;
        }
    }
}
