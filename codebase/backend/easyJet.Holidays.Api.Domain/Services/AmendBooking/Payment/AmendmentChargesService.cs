using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Settings;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.Payment;

/// <inheritdoc />      
public class AmendmentChargesService : IAmendmentChargesService
{
    private readonly ILogger<AmendmentChargesService> _logger;
    private readonly ApiSettings _apiSettings;

    /// <inheritdoc />  
    public AmendmentChargesService(
        ILogger<AmendmentChargesService> logger,
        IOptions<ApiSettings> apiSettings)
    {
        _logger = logger;
        _apiSettings = apiSettings?.Value ?? throw new ArgumentNullException(nameof(apiSettings));
    }

    /// <inheritdoc />      
    public AmendmentPaymentInfo CalculateAmendmentPaymentInfo(
        BookingResponse originalBooking,
        ValidateBookingResponse validateBookingResponse)
    {
        ArgumentNullException.ThrowIfNull(originalBooking);
        ArgumentNullException.ThrowIfNull(validateBookingResponse);

        var amountOfFeesInOriginalBooking = originalBooking.PaymentInfo.AmendmentFeesItems.Sum(x => x.Amount);
        var amountOfFeesInAmendBooking = validateBookingResponse.PaymentInfo.AmendmentFeesItems.Sum(x => x.Amount);

        var feesPerPersons = GetFeesPerPerson(amountOfFeesInOriginalBooking, validateBookingResponse.PaymentInfo.AmendmentFeesItems);

        var result = new AmendmentPaymentInfo
        {
            PackagePriceWithFees = validateBookingResponse.PaymentInfo.BookingPriceInc,
            PackagePriceWithoutFees = validateBookingResponse.PaymentInfo.BookingPriceEx,
            AmendmentCharges = validateBookingResponse.PaymentInfo.BookingPriceInc - originalBooking.PaymentInfo.BookingPriceInc,
            AmendmentChargesWithoutFees = validateBookingResponse.PaymentInfo.BookingPriceEx - originalBooking.PaymentInfo.BookingPriceEx,
            TotalFeesAmount = amountOfFeesInAmendBooking - amountOfFeesInOriginalBooking,
            FeesPerPersons = feesPerPersons
        };

        return result;
    }

    /// <summary>
    /// Calculate the fees which should be paid for current amendment.
    /// We know the amount of paid fees from DisplayBookingResponse, and we can use it to calculate the new fees for amendment.
    /// We should remove fees item (by default from old to new) until the sum of deleted fees will be the same as the sum of fees in DisplayBookingResponse.
    /// All fees item which stay in the list are new and should be paid by customer.
    /// Atcom defect https://app.clickup.com/t/2553597/EJHT-5539
    /// </summary>
    /// <param name="amountOfFeesInOriginalBooking">Fees amount which was pay previously</param>
    /// <param name="feesInAmendBooking">Fees item in InfoModifyBookingResponse</param>
    /// <returns></returns>
    private static IEnumerable<FeesPerPersonItem> GetFeesPerPerson(
        decimal amountOfFeesInOriginalBooking,
        IEnumerable<FeeItem> feesInAmendBooking)
    {
        var feesItems = new List<FeeItem>();

        foreach (var amendmentFeesItem in feesInAmendBooking)
        {
            if (amountOfFeesInOriginalBooking > 0)
            {
                amountOfFeesInOriginalBooking -= amendmentFeesItem.Amount;
            }
            else
            {
                feesItems.Add(amendmentFeesItem);
            }
        }

        var result = feesItems
            .GroupBy(x => x.Amount)
            .Select(x => new FeesPerPersonItem
            {
                FeesPerPersonAmount = x.Key,
                FeesCount = x.Count()
            });

        return result;
    }

    /// <inheritdoc />      
    public void ValidateAmendCommitPayment(
        AmendBookingRequest request,
        BookingResponse bookingResponse,
        ValidateBookingResponse validateBookingResponse)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(bookingResponse);
        ArgumentNullException.ThrowIfNull(validateBookingResponse);

        var paymentAmount = request.PaymentInfo.Amount +
                                    (_apiSettings.Vouchers?.IsActive == true ? request.PaymentInfo.CreditAmount : 0);

        var balanceDueAmount = validateBookingResponse.PaymentInfo.BalanceDueAmount;
        var amendmentPaymentInfo = CalculateAmendmentPaymentInfo(bookingResponse, validateBookingResponse);

        //regular payment (not a refund)
        if (!request.ConvertType.HasValue)
        {
            var isPaymentAmountValid = IsPaymentAmountValid(paymentAmount, balanceDueAmount, amendmentPaymentInfo, bookingResponse);

            if (!isPaymentAmountValid)
            {
                _logger.LogError("Payment price is not valid. BalanceDueAmount: {BalanceDueAmount} AmendmentCharges: {AmendmentCharges} PaymentAmount: {PaymentAmount} Fees amount: {Fees}",
                    balanceDueAmount,
                    amendmentPaymentInfo.AmendmentCharges,
                    paymentAmount,
                    amendmentPaymentInfo.TotalFeesAmount);
                throw new ApiException(ApiExceptionCodes.BookingValidatePriceError,
                    "Payment price is not valid",
                    null, null);
            }
        }
        //refund
        else
        {
            var isRefundAmountValid = paymentAmount < 0 && paymentAmount == amendmentPaymentInfo.AmendmentCharges;

            if (!isRefundAmountValid)
            {
                _logger.LogError("Payment price is not valid. Expected: AmendmentCharges - {AmendmentCharges} and Fees: {Fees} , but got: {PaymentAmount}",
                    amendmentPaymentInfo.AmendmentCharges,
                    amendmentPaymentInfo.TotalFeesAmount,
                    paymentAmount);
                throw new ApiException(ApiExceptionCodes.BookingValidatePriceError, "Payment price is not valid",
                    null, null);
            }
        }
    }

    private static bool IsPaymentAmountValid(decimal paymentAmount, decimal balanceDueAmount, AmendmentPaymentInfo amendmentPaymentInfo, BookingResponse bookingResponse)
    {
        bool isValidForDueAmount;
        bool isValidForDueDate;

        //Handle case when BalanceDueAmount < 0
        //This happens when a refund/credit action on a booking has failed in the past due to an error in the payment system
        //In the result there is no payment information about refund/credit in Atcom and this booking has negative BalanceDueAmount
        if (balanceDueAmount < 0)
        {
            isValidForDueAmount = paymentAmount == amendmentPaymentInfo.AmendmentCharges;
        }
        else
        {
            isValidForDueAmount = paymentAmount <= balanceDueAmount;
        }

        // We should not accept payment if user try to pay less or more us expected.                
        if (bookingResponse.PaymentInfo.AllowPayBalanceDueDate < DateTime.UtcNow)
        {
            // If customer didn't pay BalanceDueAmount on time, customer should pay whole sum
            isValidForDueDate = paymentAmount == balanceDueAmount || paymentAmount == amendmentPaymentInfo.TotalFeesAmount;
        }
        else
        {
            // Amount to pay should be equals to full amendment charges or just fees + add amendment charges without fees to holiday balance
            isValidForDueDate = paymentAmount == amendmentPaymentInfo.AmendmentCharges || paymentAmount == amendmentPaymentInfo.TotalFeesAmount;
        }

        var isPriceValid = paymentAmount >= 0 && isValidForDueAmount && isValidForDueDate;
        return isPriceValid;
    }
}