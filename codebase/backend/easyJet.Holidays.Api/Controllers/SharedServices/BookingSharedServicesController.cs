using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Binders;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.SharedServices.Booking;
using easyJet.Holidays.Api.Domain.Data.SharedServices.Vouchers;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.Extensions.Options;
using System.Net;
using BookingRefundResponse = easyJet.Holidays.Api.Domain.Data.Booking.BookingRefundResponse;
using CancelBookingRequest = easyJet.Holidays.Api.Domain.Data.SharedServices.Booking.CancelBookingRequest;

namespace easyJet.Holidays.Api.Controllers.SharedServices;

[Route("shared-services/booking")]
[ApiVersion("1.0")]
[ServiceFilter(typeof(DisableValidationAttribute))]
[ServiceFilter(typeof(UseSerializerWithFullConverterForOutputAttribute))]
[ServiceFilter(typeof(SharedServicesAuthorizedAttribute))]
public class BookingSharedServicesController : ControllerBase
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IBookingRefundService _bookingRefundService;
    private readonly IBookingRefundEligibleService _bookingRefundEligibleService;
    private readonly IBookingCreditService _bookingCreditService;
    private readonly IVoucherPaymentFlowService _voucherPaymentFlowService;
    private readonly ApiSettings _apiSettings;

    private const string BookingRepositoryRoutePrefix = "repository";
    private const string BookingRefundRoutePrefix = "refund";
    private const string BookingRefundEligibleRoutePrefix = "refund-eligibility";
    private const string BookingCreditRoutePrefix = "credit";
    private const string BookingVouchersPaymentFlowRoutePrefix = "vouchers-paymentflow";

    public BookingSharedServicesController(
        IBookingRepository bookingRepository,
        IBookingRefundService bookingRefundService,
        IBookingRefundEligibleService bookingRefundEligibleService,
        IBookingCreditService bookingCreditService,
        IVoucherPaymentFlowService voucherPaymentFlowService,
        IOptions<ApiSettings> apiOptions)
    {
        _bookingRepository = bookingRepository;
        _bookingRefundService = bookingRefundService;
        _bookingRefundEligibleService = bookingRefundEligibleService;
        _bookingCreditService = bookingCreditService;
        _voucherPaymentFlowService = voucherPaymentFlowService;
        _apiSettings = apiOptions?.Value ?? throw new ArgumentNullException(nameof(apiOptions));
    }

    /// <summary>
    /// Forwards a <see cref="GetBookingUnsafeRequest"/> to the underlying <see cref="IBookingRepository"/>
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpGet]
    [Route($"{BookingRepositoryRoutePrefix}/booking-unsafe")]
    [ProducesResponseType(typeof(BookingResponse), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> GetBookingUnsafe([FromQuery] GetBookingUnsafeRequest request)
    {
        var result = await _bookingRepository.GetBookingUnsafe(request.BookingReference, request.GetBookingOptions);

        if (result == null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    /// <summary>
    /// Forwards a <see cref="CancelBookingRequest"/> to the underlying <see cref="IBookingRepository"/>
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPut]
    [Route($"{BookingRepositoryRoutePrefix}/cancel-booking")]
    [ProducesResponseType(typeof(BookingResponse), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> CancelBooking([ModelBinder(typeof(FullModelBinder))][FromBody] CancelBookingRequest request)
    {
        var result = await _bookingRepository.CancelBooking(
            request.BookingReference,
            request.Reason,
            request.WithoutFee,
            request.MarketCode,
            request.Language,
            []);

        return Ok(result);
    }

    /// <summary>
    /// Forwards a <see cref="GetBookingMemoRequest"/> to the underlying <see cref="IBookingRepository"/>
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpGet]
    [Route($"{BookingRepositoryRoutePrefix}/booking-memo")]
    [ProducesResponseType(typeof(List<Memo>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> GetBookingMemo([FromQuery] GetBookingMemoRequest request)
    {
        var result = await _bookingRepository.GetBookingMemo(request.BookingReference);

        return Ok(result);
    }

    /// <summary>
    /// Forwards a <see cref="ModifyMemoRequest"/> to the underlying <see cref="IBookingRepository"/>
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPut]
    [Route($"{BookingRepositoryRoutePrefix}/modify-memo")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    public async Task<IActionResult> ModifyMemo([ModelBinder(typeof(FullModelBinder))][FromBody] ModifyMemoRequest request)
    {
        request.UpdateMemoCodeByRequestedCode(_apiSettings);

        await _bookingRepository.ModifyMemo(request.BookingReference, request.Memo);

        return Ok();
    }

    /// <summary>
    /// Forwards a <see cref="RefundNonCreditPaymentsRequest"/> to the underlying <see cref="IBookingRefundService"/>
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPut]
    [Route($"{BookingRefundRoutePrefix}/refund-non-credit-payments")]
    [ProducesResponseType(typeof(List<BookingRefundResponse>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> RefundNonCreditPayments([ModelBinder(typeof(FullModelBinder))][FromBody] RefundNonCreditPaymentsRequest request)
    {
        var result = await _bookingRefundService.RefundNonCreditPayments(request.Booking);

        return Ok(result);
    }


    /// <summary>
    /// Forwards a <see cref="PaymentsAvailableForRefundRequest"/> to the underlying <see cref="IBookingRefundService"/>
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPost] // keep as POST so we don't have to put a complete Booking into the query params
    [Route($"{BookingRefundRoutePrefix}/payments-available-for-refund")]
    [ProducesResponseType(typeof(List<PaymentHistoryItem>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> PaymentsAvailableForRefund([ModelBinder(typeof(FullModelBinder))][FromBody] PaymentsAvailableForRefundRequest request)
    {
        var result = _bookingRefundService.PaymentsAvailableForRefund(request.Booking);

        return Ok(result);
    }

    /// <summary>
    /// Forwards a <see cref="BuildCreditBreakdownRequest"/> to the underlying <see cref="IBookingRefundEligibleService"/>
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPost]
    [Route($"{BookingRefundEligibleRoutePrefix}/build-credit-breakdown")]
    [ProducesResponseType(typeof(CreditBreakdown), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> BuildCreditBreakdown([ModelBinder(typeof(FullModelBinder))][FromBody] BuildCreditBreakdownRequest request)
    {
        var result = _bookingRefundEligibleService.BuildCreditBreakdown(request.Booking, request.Rules, request.Action);

        return Ok(result);
    }

    /// <summary>
    /// Forwards a <see cref="SpendCreditRequest"/> to the underlying <see cref="IBookingCreditService"/>
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPut]
    [Route($"{BookingCreditRoutePrefix}/spend-credit")]
    [ProducesResponseType(typeof(List<CreditSpend>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> SpendCredit([ModelBinder(typeof(FullModelBinder))][FromBody] SpendCreditRequest request)
    {
        request.RedemptionMetadata.Action = _apiSettings.Vouchers.Action.Spend;
        request.RedemptionMetadata.Source = request.Source.GetSourceValueFromSettings(_apiSettings);

        var result = await _bookingCreditService.SpendCredit(
            request.Booking,
            request.Amount,
            request.Currency,
            request.CustomerId,
            request.RedemptionMetadata
        );

        return Ok(result);
    }

    /// <summary>
    /// Forwards a <see cref="RedeemRequest"/> to the underlying <see cref="IVoucherPaymentFlowService"/>
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPut]
    [Route($"{BookingVouchersPaymentFlowRoutePrefix}/redeem")]
    [ProducesResponseType(typeof(List<CreditSpend>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> Redeem([ModelBinder(typeof(FullModelBinder))][FromBody] RedeemRequest request)
    {
        var result = await _voucherPaymentFlowService.Redeem(
            request.Amount,
            request.Currency,
            request.CustomerId,
            request.AccomCode,
            request.BookingMarketCode,
            request.CustomerId,
            request.RedemptionMetadata
        );

        return Ok(result);
    }

    /// <summary>
    /// Forwards a <see cref="RedeemRequest"/> to the underlying <see cref="IVoucherPaymentFlowService"/>
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPut]
    [Route($"{BookingVouchersPaymentFlowRoutePrefix}/redeem-filtered")]
    [ProducesResponseType(typeof(List<CreditSpend>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> RedeemFiltered([ModelBinder(typeof(FullModelBinder))][FromBody] RedeemRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        
        var result = await _voucherPaymentFlowService.RedeemFiltered(
            request.Amount,
            request.Currency,
            request.CustomerId,
            request.AccomCode,
            request.BookingMarketCode,
            request.CustomerId,
            request.RedemptionMetadata
        );

        return Ok(result);
    }

    /// <summary>
    /// Forwards a <see cref="AddPaymentInfoRequest"/> to the underlying <see cref="IVoucherPaymentFlowService"/>
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPut]
    [Route($"{BookingVouchersPaymentFlowRoutePrefix}/add-payment-info")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    public async Task<IActionResult> AddPaymentInfo([ModelBinder(typeof(FullModelBinder))][FromBody] AddPaymentInfoRequest request)
    {
        await _voucherPaymentFlowService.AddPaymentInfo(
            request.SpendVoucherResults,
            request.LeadPassenger,
            request.BookingReference,
            request.BookingMarketCode,
            request.BookingLanguage,
            request.SessionId,
            request.RequestId);

        return Ok();
    }

    /// <summary>
    /// Forwards a <see cref="RollbackRequest"/> to the underlying <see cref="IVoucherPaymentFlowService"/>
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPut]
    [Route($"{BookingVouchersPaymentFlowRoutePrefix}/rollback")]
    [ProducesResponseType(typeof(ApiException), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> Rollback([ModelBinder(typeof(FullModelBinder))][FromBody] RollbackRequest request)
    {
        var result = await _voucherPaymentFlowService.Rollback(request.SpendVoucherResult, request.CustomerId);

        return Ok(result);
    }
}