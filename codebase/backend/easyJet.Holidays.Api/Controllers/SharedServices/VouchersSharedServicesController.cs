using easyJet.Holidays.Api.Domain.Binders;
using easyJet.Holidays.Api.Domain.Data.SharedServices.Vouchers;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.Extensions.Options;
using System.Net;
using Voucherify.DataModel;

namespace easyJet.Holidays.Api.Controllers.SharedServices;

/// <summary>
/// Exposes underlying voucher functionality
/// </summary>
[Route("shared-services/vouchers")]
[ApiVersion("1.0")]
[ServiceFilter(typeof(DisableValidationAttribute))]
[ServiceFilter(typeof(UseSerializerWithFullConverterForOutputAttribute))]
[ServiceFilter(typeof(SharedServicesAuthorizedAttribute))]
public class VouchersSharedServicesController : ControllerBase
{
    private readonly IVouchersService _vouchersService;
    private readonly IVouchersCustomerRepository _vouchersCustomerRepository;
    private readonly ApiSettings _apiSettings;

    private const string VouchersCustomerRepoRoutePrefix = "customer-repository";

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="vouchersService"></param>
    /// <param name="vouchersCustomerRepository"></param>
    /// <param name="apiOptions"></param>
    /// <exception cref="ArgumentNullException"></exception>
    public VouchersSharedServicesController(
        IVouchersService vouchersService,
        IVouchersCustomerRepository vouchersCustomerRepository,
        IOptions<ApiSettings> apiOptions)
    {
        _vouchersService = vouchersService;
        _vouchersCustomerRepository = vouchersCustomerRepository;
        _apiSettings = apiOptions?.Value ?? throw new ArgumentNullException(nameof(apiOptions));
    }

    /// <summary>
    /// Forwards a <see cref="GetOrCreateRequest"/> to underlying <see cref="IVouchersCustomerRepository.GetOrCreate"/>
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpGet]
    [Route($"{VouchersCustomerRepoRoutePrefix}/get-or-create")]
    [ProducesResponseType(typeof(Customer), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> GetOrCreate([FromQuery] GetOrCreateRequest request)
    {
        var result = await _vouchersCustomerRepository.GetOrCreate(request.CustomerId, request.CustomerDetails);

        return Ok(result);
    }

    /// <summary>
    /// Forwards an <see cref="GetCustomerByEmailRequest"/> to underlying <see cref="IVouchersCustomerRepository.GetCustomersByEmail"/>
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpGet]
    [Route($"{VouchersCustomerRepoRoutePrefix}/customer-by-email")]
    [ProducesResponseType(typeof(CustomerList), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> GetCustomerByEmail([FromQuery] GetCustomerByEmailRequest request)
    {
        var result = await _vouchersCustomerRepository.GetCustomersByEmail(request.Email);

        if ((result?.Customers?.Count ?? 0) == 0)
        {
            return NotFound();
        }

        return Ok(result);
    }

    /// <summary>
    /// Forwards a <see cref="AddCreditToBookingRequest"/> to underlying <see cref="IVouchersService.AddCreditToBooking"/>
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPost]
    [Route("add-credit-to-booking")]
    [ProducesResponseType(typeof(List<CreatedVoucher>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> AddCreditToBooking([ModelBinder(typeof(FullModelBinder))][FromBody] AddCreditToBookingRequest request)
    {
        request.MetaData.AddSourceToMetaData(request.Source, _apiSettings);

        var result = await _vouchersService.AddCreditToBooking(
            request.CustomerId,
            request.CreditBreakdown,
            request.VoucherId,
            request.Booking,
            request.MetaData,
            request.MarkBookingAsCancelled ?? true
        );

        return Ok(result);
    }

    /// <summary>
    /// Forwards a <see cref="AddRefundCreditToBookingRequest"/> to underlying <see cref="IVouchersService.AddRefundCreditToBooking"/>
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPost]
    [Route("add-refund-credit-to-booking")]
    [ProducesResponseType(typeof(List<string>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> AddRefundCreditToBooking([ModelBinder(typeof(FullModelBinder))][FromBody] AddRefundCreditToBookingRequest request)
    {
        request.MetaData.AddSourceToMetaData(request.Source, _apiSettings);

        var result = await _vouchersService.AddRefundCreditToBooking(
            request.CustomerId,
            request.RefundAmount,
            request.Currency,
            request.VoucherId,
            request.Booking,
            request.MetaData
        );

        return Ok(result);
    }

    /// <summary>
    /// Forwards a <see cref="CreateAndPublishVoucherRequest"/> to underlying <see cref="IVouchersService.CreateAndPublishVoucher"/>
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPost]
    [Route("create-and-publish-voucher")]
    public async Task<IActionResult> CreateAndPublishVoucher([ModelBinder(typeof(FullModelBinder))][FromBody] CreateAndPublishVoucherRequest request)
    {
        request.MetaData.AddSourceToMetaData(request.Source, _apiSettings);

        var result = await _vouchersService.CreateAndPublishVoucher(
            request.VoucherId,
            request.Amount,
            request.Currency,
            request.CustomerId,
            request.MetaData,
            request.ReasonCode,
            request.ExpirationDateTime
        );

        return Ok(result);
    }

    /// <summary>
    /// Forwards a <see cref="TransferVouchersRequest"/> to underlying <see cref="IVouchersService.TransferVouchers"/>
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPost]
    [Route("transfer-vouchers")]
    [ProducesResponseType(typeof(TransferResult), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> TransferVouchers([ModelBinder(typeof(FullModelBinder))][FromBody] TransferVouchersRequest request)
    {
        var result = await _vouchersService.TransferVouchers(
            request.SourceId,
            request.DestinationId,
            request.Currency,
            GetVouchersSelector(request)
        );

        return Ok(result);
    }

    /// <summary>
    /// Forwards the reasonCode from the request to the underlying <see cref="IVouchersService.IsReasonCodeValid"/>>
    /// </summary>
    /// <param name="reasonCode"></param>
    /// <returns></returns>
    [HttpGet]
    [Route("is-reason-code-valid")]
    [ProducesResponseType(typeof(bool), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> IsReasonCodeValid([FromQuery] string reasonCode)
    {
        var validityResult = await Task.FromResult(_vouchersService.IsReasonCodeValid(reasonCode));

        return Ok(validityResult);
    }

    // we don't want to serialize the delegate, therefore this extensible approach was chosen
    private static Func<IEnumerable<VoucherWithCustomer>, IEnumerable<VoucherWithCustomer>> GetVouchersSelector(TransferVouchersRequest request)
    {
        return request.Mode switch
        {
            VoucherSelectionMode.SmallestSubset => vouchers =>
            {
                var options = MathUtils.SubsetSum(vouchers.ToList(), v => v.Gift.Balance, request.Amount).ToList();
                options.Sort((a, b) => a.Count() - b.Count());
                return options.FirstOrDefault() ?? new List<VoucherWithCustomer>();
            },
            _ => throw new ArgumentOutOfRangeException(nameof(request.Mode), request.Mode, null)
        };
    }
}