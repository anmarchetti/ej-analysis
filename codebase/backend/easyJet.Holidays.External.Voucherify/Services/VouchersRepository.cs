using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.Voucherify.Models.Spend;
using easyJet.Holidays.External.Voucherify.Models.ValidateRedemption;
using easyJet.Holidays.External.Voucherify.Models.Vouchers;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Polly;
using Voucherify.Core.DataModel;
using VVoucherify = Voucherify;

namespace easyJet.Holidays.External.Voucherify.Services
{
    /// <inheritdoc cref="IVouchersRepository"/>
    public class VouchersRepository : IVouchersRepository
    {
        private readonly IApiService _apiService;
        private readonly EndpointsProvider _endpointsProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly VoucherSettings _voucherSettings;
        private readonly VoucherifySettings _voucherifySettings;
        private readonly ILogger<VouchersRepository> _logger;

        /// <summary>
        /// default ctor
        /// </summary>
        /// <param name="apiService"></param>
        /// <param name="endpointsProvider"></param>
        /// <param name="httpContextAccessor"></param>
        /// <param name="apiSettings"></param>
        /// <param name="voucherifySettings"></param>
        /// <param name="logger"></param>
        /// <exception cref="ArgumentNullException"></exception>
        public VouchersRepository(
            IApiService apiService,
            EndpointsProvider endpointsProvider,
            IHttpContextAccessor httpContextAccessor,
            IOptions<ApiSettings> apiSettings,
            IOptions<VoucherifySettings> voucherifySettings,
            ILogger<VouchersRepository> logger
            )
        {
            _voucherSettings = apiSettings?.Value.Vouchers ?? throw new ArgumentNullException(nameof(apiSettings));
            _voucherifySettings = voucherifySettings?.Value ?? throw new ArgumentNullException(nameof(voucherifySettings));
            _logger = logger;
            _apiService = apiService;
            _endpointsProvider = endpointsProvider;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<Voucher> Create(string voucherCode, Dictionary<string, object> metadata, decimal? amount = null, DateTimeOffset? expirationDate = null)
        {
            Func<Task<Voucher>> create = async () =>
            {
                var request = new VoucherCreateRequest();

                // combine metadata
                metadata = (metadata ?? new Dictionary<string, object>());
                metadata = metadata.Concat(_voucherSettings.Metadata.Where(k => !metadata.ContainsKey(k.Key)))
                    .ToDictionary(k => k.Key, v => v.Value);

                var expirationDateTime = expirationDate?.DateTime ?? DateTime.UtcNow.AddMonths(_voucherSettings.ExpirationMonths);

                expirationDateTime = expirationDateTime.GetEndOfDay();

                request.Payload.Body = new VVoucherify.DataModel.Contexts.VoucherCreate()
                {
                    Active = true,
                    Campaign = _voucherSettings.Campaign,
                    ExpirationDate = expirationDateTime,
                    Category = _voucherSettings.Category,
                    Metadata = new Metadata(metadata),
                }.WithGift(new VVoucherify.DataModel.Contexts.GiftCreate
                {
                    Amount = amount != null ? (int)(amount * 100) : 0
                });

                request.Endpoint = _endpointsProvider.GetEndpoint(VoucherifyEndpoint.Voucher, RequestCookieCollection(), new Dictionary<string, string> {
                    { "id", voucherCode ?? string.Empty }
                });

                var response = await _apiService.GetResponseContentAsyncWithErrorMapping<VoucherCreateRequest, VoucherCreateResponse>(request, ApiExceptionCodes.VoucherCreate);
                return response.Payload.Body;
            };


            Voucher voucher;
            try
            {
                voucher = await create();
            }
            catch (Exception ex)
            {
                var apiClientError = ex.InnerException?.InnerException as ApiClientErrorResponseException;
                _logger.LogError("Got error from Voucherify: {Err}", apiClientError?.StatusCode);
                throw;
            }

            return voucher;
        }

        /// <inheritdoc />
        public async Task<Voucher> Clone(Voucher voucher, Dictionary<string, string> meta)
        {
            var metadata = new Metadata(voucher.Metadata);
            if (meta != null)
            {
                foreach (var p in meta)
                {
                    metadata.TryAdd(p.Key, p.Value);
                }
            }

            var request = new VoucherCreateRequest();
            request.Payload.Body = new VVoucherify.DataModel.Contexts.VoucherCreate()
            {
                Active = voucher.Active,
                Campaign = voucher.Campaign,
                Category = voucher.Category,
                ExpirationDate = voucher.ExpirationDate,
                Metadata = metadata
            }.WithGift(new VVoucherify.DataModel.Contexts.GiftCreate
            {
                Amount = voucher.Gift.Amount
            });

            request.Endpoint = _endpointsProvider.GetEndpoint(VoucherifyEndpoint.Voucher, RequestCookieCollection(), new Dictionary<string, string> {
                    { "id", voucher.Code }
                });

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<VoucherCreateRequest, VoucherCreateResponse>(request, ApiExceptionCodes.VoucherCreate);

            return response.Payload.Body;
        }

        /// <inheritdoc />
        public async Task<Voucher> Get(string voucherCode)
        {
            var request = new VoucherGetRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(VoucherifyEndpoint.Voucher, RequestCookieCollection(), new Dictionary<string, string> {
                { "id", voucherCode }
            });

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<VoucherGetRequest, VoucherGetResponse>(request, ApiExceptionCodes.VoucherGet);
            return response?.Payload?.Body;
        }

        /// <summary>
        /// Get vouchers by voucher code
        /// </summary>
        /// <param name="voucherCodes">codes of the vouchers to retrieve</param>
        /// <returns></returns>
        public async Task<IEnumerable<Voucher>> Get(IEnumerable<string> voucherCodes)
        {
            var getVouchersTasks = voucherCodes.Select(GetWithoutException);
            var vouchers = await Task.WhenAll(getVouchersTasks);
            return vouchers.Where(v => v != null);
        }

        /// <inheritdoc />
        public async Task<VVoucherify.DataModel.PublicationSingle> Publish(string voucherCode, string customerId)
        {
            var request = new VoucherPublishRequest();
            request.Payload.Body = new VVoucherify.DataModel.Contexts.VoucherPublishSingle()
            {
                Voucher = voucherCode,
                Customer = new VVoucherify.DataModel.Contexts.Customer
                {
                    Id = customerId
                }
            };

            request.Endpoint = _endpointsProvider.GetEndpoint(VoucherifyEndpoint.VoucherPublish, RequestCookieCollection());

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<VoucherPublishRequest, VoucherPublishResponse>(request, ApiExceptionCodes.VoucherPublish);
            return response.Payload.Body;
        }

        /// <inheritdoc />
        public async Task<VVoucherify.DataModel.Balance> AddVoucherGiftBalance(string voucherCode, int amountCents)
        {
            var request = new AddGiftBalanceRequest();
            request.Payload.Body = new VVoucherify.DataModel.Contexts.VoucherAddGiftBalance()
            {
                Amount = amountCents
            };

            request.Endpoint = _endpointsProvider.GetEndpoint(VoucherifyEndpoint.AddGiftBalance, RequestCookieCollection(), new Dictionary<string, string> {
                { "id", voucherCode }
            });

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<AddGiftBalanceRequest, AddGiftBalanceResponse>(request, ApiExceptionCodes.VoucherAddBalance);
            return response.Payload.Body;
        }

        /// <inheritdoc />
        public async Task<Voucher> UpdateDetails(string voucherCode, Dictionary<string, object> metadata, DateTime? expiration)
        {
            var body = VVoucherify.DataModel.Contexts.VoucherUpdate.FromEmpty().WithActive(true); // it's neccessary to keep active=true, otherwise it disabled voucher)
            if (metadata != null)
            {
                body = body.WithMetadata(new Metadata(metadata));
            }

            if (expiration != null)
            {
                body = body.WithExpirationDate(expiration);
            }

            var request = new VoucherUpdateRequest();
            request.Payload.Body = body;
            request.Endpoint = _endpointsProvider.GetEndpoint(VoucherifyEndpoint.Voucher, RequestCookieCollection(), new Dictionary<string, string> {
                { "id", voucherCode }
            });

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<VoucherUpdateRequest, VoucherCreateResponse>(request, ApiExceptionCodes.VoucherUpdate);
            return response.Payload.Body;
        }

        /// <inheritdoc />
        public async Task Delete(string voucherCode)
        {
            var request = new VoucherDeleteRequest();
            request.Force = true;
            request.SetQueryString(null, new QueryStringOptions
            {
                UseBooleanString = true
            });

            request.Endpoint = _endpointsProvider.GetEndpoint(VoucherifyEndpoint.Voucher, RequestCookieCollection(), new Dictionary<string, string> {
                { "id", voucherCode }
            });

            await _apiService.GetResponseContentAsyncWithErrorMapping<VoucherDeleteRequest, ApiResponseStub>(request, ApiExceptionCodes.VoucherDelete);
        }

        /// <inheritdoc />
        public async Task<ValidationWithMeta> ValidateRedemption(string voucherCode, decimal? amount, string customerID, Dictionary<string, object> metadata = null)
        {
            var request = new ValidateRedemptionRequest();
            var validationBody = new VVoucherify.DataModel.Contexts.Validation();
            validationBody.Order = new VVoucherify.DataModel.Contexts.Order();

            if (amount.HasValue)
            {
                int intAmmount = (int)(amount * 100);
                validationBody.Order.WithAmount(intAmmount);
            }

            if (!string.IsNullOrWhiteSpace(customerID))
            {
                validationBody.Customer = new VVoucherify.DataModel.Contexts.Customer()
                {
                    SourceId = customerID,
                };
            }

            if (metadata != null)
            {
                validationBody.Metadata = new Metadata(metadata);
            }

            request.Payload.Body = validationBody;
            request.Endpoint = _endpointsProvider.GetEndpoint(VoucherifyEndpoint.ValidateRedemption, RequestCookieCollection(), new Dictionary<string, string>() { { "voucher_code", voucherCode } });
            var response = await _apiService.GetResponseContentAsync<ValidateRedemptionRequest, ValidateRedemptionResponse>(request);
            return response?.Payload.Body;
        }

        /// <inheritdoc />
        public async Task<Redemption> ProcessRedemption(string voucherCode, decimal? amount, string customerID, Dictionary<string, object> metadata = null)
        {
            var request = new ProcessRedemptionRequest();
            var redemBody = new VVoucherify.DataModel.Contexts.RedemptionRedeem();
            redemBody.Order = new VVoucherify.DataModel.Contexts.Order();

            if (amount != null)
            {
                int intAmmount = (int)(amount * 100);
                redemBody.Order.WithAmount(intAmmount);
            }

            if (!string.IsNullOrWhiteSpace(customerID))
            {
                redemBody.WithCustomerId(customerID);
            }

            if (metadata != null)
            {
                redemBody.Metadata = new Metadata(metadata);
            }

            request.Payload.Body = redemBody;
            request.Endpoint = _endpointsProvider.GetEndpoint(VoucherifyEndpoint.ProcessRedemption, RequestCookieCollection(), new Dictionary<string, string>() { { "voucher_code", voucherCode } });
            var response = await _apiService.GetResponseContentAsync<ProcessRedemptionRequest, ProcessRedemptionResponse>(request);
            return response?.Payload.Body;
        }

        /// <inheritdoc />
        public async Task<VVoucherify.DataModel.RedemptionRollback> RollbackRedemption(string redemptionID, string reason, string customerId)
        {
            Func<Task<VVoucherify.DataModel.RedemptionRollback>> rollback = async () =>
            {
                var request = new RollbackRedemptionRequest();
                request.Payload.Body = new RollbackRedemptionBody()
                {
                    Customer = null // we don't need to specify customer here
                };
                request.Reason = reason;
                request.SetQueryString();
                request.Endpoint = _endpointsProvider.GetEndpoint(VoucherifyEndpoint.RollBackRedemption, RequestCookieCollection(), new Dictionary<string, string>() { { "redemption_id", redemptionID } });
                var response = await _apiService.GetResponseContentAsync<RollbackRedemptionRequest, RollbackRedemptionResponse>(request);
                return response?.Payload.Body;
            };

            // use policy to handle random errors 
            var policy = BuildRollbackPolicy();
            var result = await policy.ExecuteAndCaptureAsync(rollback);
            if (result.Outcome == OutcomeType.Failure)
            {
                throw result.FinalException;
            }

            return result.Result;
        }

        /// <summary>
        /// Get voucher by code while suppressing potential exceptions.
        /// </summary>
        /// <param name="voucherCode">code of the voucher to retrieve</param>
        /// <returns>the voucher or null in case of an exception</returns>
        private async Task<Voucher> GetWithoutException(string voucherCode)
        {
            try
            {
                return await Get(voucherCode);
            }
            catch (Exception e)
            {
                //suppress exception and just log information
                _logger.LogInformation(e, "Cannot get Voucherify voucher by code={VoucherCode}", voucherCode);
                return null;
            }
        }

        private Polly.Retry.AsyncRetryPolicy BuildRollbackPolicy()
        {
            var policy = Policy.Handle<Exception>().WaitAndRetryAsync(
               retryCount: _voucherifySettings.RollbackRetryPolicy.RetryCount,
               sleepDurationProvider: _ => TimeSpan.FromMilliseconds(_voucherifySettings.RollbackRetryPolicy.SleepMls), // Wait 200ms between each try
               onRetry: (exception, _) => // Capture some info for logging!
               {
                   _logger.LogError(exception, "Rollback policy, got error");
               }
            );

            return policy;
        }

        private IRequestCookieCollection RequestCookieCollection()
        {
            return _httpContextAccessor?.HttpContext?.Request?.Cookies;
        }
    }
}
