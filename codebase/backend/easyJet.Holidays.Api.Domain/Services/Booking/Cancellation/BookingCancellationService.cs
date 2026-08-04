using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Monitoring;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation.Memos;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Logging;
using System.Collections.ObjectModel;
using System.Net;
using BookingRefundResponse = easyJet.Holidays.Api.Domain.Data.Booking.BookingRefundResponse;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation
{
    /// <summary>
    /// Service which handles all booking cancellations
    /// </summary>
    internal sealed class BookingCancellationService(
        IBookingRepository bookingRepository,
        IBookingCancellationRefundBreakdownService bookingCancellationRefundBreakdownService,
        IBookingCancellationRequestService bookingCancellationRequestService,
        IBookingCancellationRefundValidationService bookingCancellationRefundValidationService,
        IBookingCancellationRefundSummaryService bookingCancellationRefundSummaryService,
        IBookingCreditExpiryStateService bookingCreditExpiryStateService,
        IBookingCancellationCreditRefundService bookingCancellationCreditRefundService,
        IBookingCancellationPaymentRefundService bookingCancellationPaymentRefundService,
        IBookingCancellationRefundOptionService bookingCancellationRefundOptionService,
        IBookingCancellationMemoService bookingCancellationMemoService,
        IBookingRefundService bookingRefundService,
        ILogger<BookingCancellationService> logger,
        IBookingBlockCheckerService bookingBlockCheckerService,
        IMetricsService metricsService
        )
        : IBookingCancellationService
    {
        private const string ReasonLabel = "reason";
        private const string ChannelLabel = "channel";

        public async Task<CancellationSummaryResponse> GetCancellationSummary(
            BookingCancellationSummaryRequest bookingCancellationSummaryRequest,
            BookingCancellationReason bookingCancellationReason, decimal? feeToOverride, bool isSharedServiceCall, 
            bool skipLeadPassengerCheck, CancellationToken cancellationToken = default)
        {
            var channel = isSharedServiceCall ? "shared_services" : "website";
            var reason = bookingCancellationReason.ToString();

            try
            {
                var bookingResponse = await GetBooking(bookingCancellationSummaryRequest);

                await ValidatePreflightChecks(bookingResponse, bookingCancellationReason, isSharedServiceCall, skipLeadPassengerCheck);

                var bookingCancellationRefundBreakdown = await bookingCancellationRefundBreakdownService.GetBookingCancellationRefundBreakdown(bookingResponse, bookingCancellationReason, feeToOverride, cancellationToken);
                LogBookingCancellationRefundBreakdown(bookingResponse, bookingCancellationRefundBreakdown);

                var bookingCancellationRefundOption = await bookingCancellationRefundOptionService.GetRefundOption(bookingResponse, bookingCancellationRefundBreakdown, bookingCancellationReason);
                LogBookingCancellationRefundOption(bookingResponse, bookingCancellationRefundOption);

                var refundSummary = await bookingCancellationRefundSummaryService.GetCancellationRefundSummary(bookingCancellationRefundBreakdown, bookingCancellationRefundOption, bookingResponse.IsExternalAgency);
                refundSummary.CreditExpiryState = await bookingCreditExpiryStateService.GetCreditExpiryStateAsync(bookingResponse);
                metricsService.IncrementCounter(CancellationMetricConstants.SummaryAttemptTotal, 1,
                    new KeyValuePair<string, object>(ReasonLabel, reason),
                    new KeyValuePair<string, object>(ChannelLabel, channel),
                    new KeyValuePair<string, object>("status", MetricConstants.SuccessMetricStatus));
                logger.LogInformation("Cancellation summary calculated successfully for bookingReference: {BookingReference}. RefundSummary: {@RefundSummary}", bookingResponse.BookingReference, refundSummary);
                return refundSummary;
            }
            catch (Exception ex)
            {
                var errorCode = ex is ApiException apiEx ? apiEx.Code.ToString() : ex.GetType().Name;
                metricsService.IncrementCounter(CancellationMetricConstants.SummaryAttemptTotal, 1,
                    new KeyValuePair<string, object>(ReasonLabel, reason),
                    new KeyValuePair<string, object>(ChannelLabel, channel),
                    new KeyValuePair<string, object>("status", MetricConstants.FailureMetricStatus),
                    new KeyValuePair<string, object>("error_code", errorCode),
                    new KeyValuePair<string, object>("error_description", ex.Message));
                throw;
            }
        }
        
        public async Task<CancellationExtendedResponse> CancelBooking(
            BookingCancellationRequest bookingCancellationRequest,
            BookingCancellationReason bookingCancellationReason, decimal? feeToOverride, bool isSharedServiceCall,
            bool skipLeadPassengerCheck, CancellationToken cancellationToken = default)
        {
            var channel = isSharedServiceCall ? "shared_services" : "website";
            var reason = bookingCancellationReason.ToString();

            metricsService.IncrementCounter(CancellationMetricConstants.AttemptTotal, 1,
                new KeyValuePair<string, object>(ReasonLabel, reason),
                new KeyValuePair<string, object>(ChannelLabel, channel));

            try
            {
                if (!bookingCancellationRequest.RefundOption.HasValue)
                {
                    throw new ArgumentException("RefundOption cannot be null", nameof(bookingCancellationRequest));
                }

                var bookingResponse = await GetBooking(bookingCancellationRequest);
                
                if (!isSharedServiceCall && await bookingBlockCheckerService.CheckIfBookingIsBlocked(bookingResponse))
                {
                    metricsService.IncrementCounter(CancellationMetricConstants.BookingBlockedTotal, 1);
                    throw new ApiException(ApiExceptionCodes.BookingBlocked, "Booking is blocked due to failed cancellations.");
                }

                await ValidatePreflightChecks(bookingResponse, bookingCancellationReason, isSharedServiceCall, skipLeadPassengerCheck);

                var bookingCancellationRefundBreakdown = await bookingCancellationRefundBreakdownService.GetBookingCancellationRefundBreakdown(bookingResponse, bookingCancellationReason, feeToOverride, cancellationToken);

                if (PreviousCalculatedRefundDiffersToActualCalculatedRefund(bookingCancellationRequest, bookingCancellationRefundBreakdown))
                {
                    logger.LogError("The previous calculation of the refund differs to the current calculation.");
                    throw new ApiException(ApiExceptionCodes.BookingCancelRefundCalculationError);
                }

                var currency = bookingResponse.Currency?.Code ?? MetricConstants.UnknownLabel;
                var commonLabels = new[]
                {
                    new KeyValuePair<string, object>(ReasonLabel, reason),
                    new KeyValuePair<string, object>(ChannelLabel, channel),
                    new KeyValuePair<string, object>("currency", currency)
                };

                // Record fee histograms
                RecordCancellationFeeMetrics(bookingCancellationRefundBreakdown, commonLabels);

                if (bookingResponse.IsExternalAgency)
                {
                    await bookingCancellationMemoService.AddMemosToBooking(bookingResponse, bookingCancellationReason,
                        BookingUtils.DaysToDeparture(bookingResponse), null, null, 
                        bookingCancellationRequest.Reason, bookingCancellationRequest.Note, 
                        bookingCancellationRequest.CancellationName, bookingCancellationRequest.Source, null, null,
                        cancellationToken);
                    try
                    {
                        await bookingRefundService.AddCashMemoToBooking(bookingCancellationRefundBreakdown.CashRefundAmount, bookingResponse);
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "Adding cash memo to bookingReference: {BookingReference} failed during cancellation. Continuing without blocking the process.", bookingResponse.BookingReference);
                    }
                    var tradeResult = await HandelTradeBookingRefund(bookingResponse, bookingCancellationRefundBreakdown, isSharedServiceCall, cancellationToken);
                    RecordCancellationSuccessMetrics(reason, channel, "None", bookingCancellationRefundBreakdown, tradeResult, commonLabels);
                    return tradeResult;
                }

                var bookingCancellationRefundOption = await bookingCancellationRefundOptionService.GetRefundOption(bookingResponse, bookingCancellationRefundBreakdown, bookingCancellationReason);
                if (NothingToRefund(bookingCancellationRefundOption))
                {
                    await bookingCancellationMemoService.AddMemosToBooking(bookingResponse, bookingCancellationReason,
                        BookingUtils.DaysToDeparture(bookingResponse), null, null, 
                        bookingCancellationRequest.Reason, bookingCancellationRequest.Note, 
                        bookingCancellationRequest.CancellationName, bookingCancellationRequest.Source, null, null,
                        cancellationToken);
                    var noRefundResult = await HandleNoRefund(bookingResponse, bookingCancellationRequest, bookingCancellationRefundBreakdown, isSharedServiceCall);
                    RecordCancellationSuccessMetrics(reason, channel, "None", bookingCancellationRefundBreakdown, noRefundResult, commonLabels);
                    return noRefundResult;
                }
                
                if (!CheckIfRefundOptionMatch(bookingCancellationRequest, bookingCancellationReason, bookingCancellationRefundOption, isSharedServiceCall))
                {
                    logger.LogError("The transmitted refund option does not match the previous calculated one");
                    throw new ApiException(ApiExceptionCodes.BookingCancellationRefundOptionError);
                }

                var paymentRefund = await bookingCancellationPaymentRefundService.RefundPaymentAmount(bookingResponse,
                    bookingCancellationRequest.RefundOption.Value, bookingCancellationRefundBreakdown);

                BookingRefundExtendedResponse creditRefund;
                try
                {
                    creditRefund = await bookingCancellationCreditRefundService.RefundCreditAmount(bookingCancellationRequest, bookingResponse, bookingCancellationRefundBreakdown, cancellationToken);
                }
                catch (Exception exception)
                {
                    //Rollback cash if credit refund fails
                    await bookingCancellationMemoService.AddFailedCancellationMemo(bookingResponse, cancellationToken);
                    await RollbackCashRefund(bookingResponse, paymentRefund, exception);
                    throw;
                }
                
                await CancelBookingInAtcomIfNotAlreadyCancelled(bookingResponse, bookingCancellationRefundBreakdown, isSharedServiceCall, paymentRefund, creditRefund, cancellationToken);

                var refundedCashAmount = paymentRefund.Sum(x => x.Payment?.Amount ?? 0);
                await bookingCancellationMemoService.AddMemosToBooking(bookingResponse, bookingCancellationReason,
                    BookingUtils.DaysToDeparture(bookingResponse), creditRefund.Credits, refundedCashAmount, 
                    bookingCancellationRequest.Reason, bookingCancellationRequest.Note,
                    bookingCancellationRequest.CancellationName, bookingCancellationRequest.Source, 
                    bookingCancellationRefundBreakdown.OneTimeUseCreditKeptAmount, 
                    bookingCancellationRefundBreakdown.OneTimeUseCreditRefundAmount,
                    cancellationToken);

                var result = new CancellationExtendedResponse
                {
                    BookingReference = bookingResponse.BookingReference,
                    CashRefundAmount = refundedCashAmount,
                    CreditRefundAmount = creditRefund.Credits,
                    BookingRefundList = new ReadOnlyCollection<BookingRefundResponse>(paymentRefund),
                    CreatedVoucherList = new ReadOnlyCollection<CreatedVoucher>(creditRefund.CreatedVouchers)
                };

                RecordCancellationSuccessMetrics(reason, channel, bookingCancellationRequest.RefundOption.Value.ToString(), bookingCancellationRefundBreakdown, result, commonLabels);
                return result;
            }
            catch (Exception ex)
            {
                var errorCode = ex is ApiException apiEx ? apiEx.Code.ToString() : ex.GetType().Name;
                metricsService.IncrementCounter(CancellationMetricConstants.FailureTotal, 1,
                    new KeyValuePair<string, object>(ReasonLabel, reason),
                    new KeyValuePair<string, object>(ChannelLabel, channel),
                    new KeyValuePair<string, object>("error_code", errorCode),
                    new KeyValuePair<string, object>("error_description", ex.Message));
                throw;
            }
        }

        private void RecordCancellationSuccessMetrics(string reason, string channel, string refundOption,
            BookingCancellationRefundBreakdown breakdown, CancellationExtendedResponse result,
            KeyValuePair<string, object>[] commonLabels)
        {
            metricsService.IncrementCounter(CancellationMetricConstants.SuccessTotal, 1,
                new KeyValuePair<string, object>(ReasonLabel, reason),
                new KeyValuePair<string, object>(ChannelLabel, channel),
                new KeyValuePair<string, object>("refund_option", refundOption));

            metricsService.ObserveHistogram(CancellationMetricConstants.BookingValueHistogram,
                (double)breakdown.OriginalBookingValue, commonLabels);
            metricsService.ObserveHistogram(CancellationMetricConstants.RefundTotalHistogram,
                (double)(breakdown.TotalRefundAmount), commonLabels);
            metricsService.ObserveHistogram(CancellationMetricConstants.RefundCashHistogram,
                (double)result.CashRefundAmount, commonLabels);
            metricsService.ObserveHistogram(CancellationMetricConstants.RefundCreditHistogram,
                (double)result.CreditRefundAmount, commonLabels);

            if (breakdown.OneTimeUseCreditRefundAmount > 0)
                metricsService.ObserveHistogram(CancellationMetricConstants.RefundOtucHistogram,
                    (double)breakdown.OneTimeUseCreditRefundAmount, commonLabels);

            if (breakdown.OneTimeUseCreditKeptAmount > 0)
                metricsService.ObserveHistogram(CancellationMetricConstants.RefundOtucKeptHistogram,
                    (double)breakdown.OneTimeUseCreditKeptAmount, commonLabels);
        }

        private void RecordCancellationFeeMetrics(BookingCancellationRefundBreakdown breakdown,
            KeyValuePair<string, object>[] commonLabels)
        {
            var totalFee = breakdown.CancelFeeAmount + breakdown.AmendmentFeeAmount;
            if (totalFee > 0)
                metricsService.ObserveHistogram(CancellationMetricConstants.FeeTotalHistogram, (double)totalFee, commonLabels);
            if (breakdown.CancelFeeAmount > 0)
                metricsService.ObserveHistogram(CancellationMetricConstants.FeeCancelHistogram, (double)breakdown.CancelFeeAmount, commonLabels);
            if (breakdown.AmendmentFeeAmount > 0)
                metricsService.ObserveHistogram(CancellationMetricConstants.FeeAmendmentHistogram, (double)breakdown.AmendmentFeeAmount, commonLabels);
        }

        private async Task RollbackCashRefund(BookingResponse bookingResponse, List<BookingRefundResponse> paymentRefund, Exception exception)
        {
            var success = await bookingCancellationPaymentRefundService.RollbackRefundAmount(bookingResponse, new ReadOnlyCollection<BookingRefundResponse>(paymentRefund), exception);
            metricsService.IncrementCounter(CancellationMetricConstants.RollbackTotal, 1,
                new KeyValuePair<string, object>("type", "cash"),
                new KeyValuePair<string, object>("success", ToBooleanLabel(success)));
            if (!success)
            {
                logger.LogCritical(exception, "Rollback of bookingReference: {BookingReference} was not successful!", bookingResponse.BookingReference);
            }
        }

        private async Task RollbackCreditRefund(BookingResponse bookingResponse, BookingRefundExtendedResponse creditRefund, Exception exception)
        {
            var success = await bookingCancellationCreditRefundService.RollbackCreditRefund(bookingResponse, creditRefund.CreatedVouchers);
            metricsService.IncrementCounter(CancellationMetricConstants.RollbackTotal, 1,
                new KeyValuePair<string, object>("type", "credit"),
                new KeyValuePair<string, object>("success", ToBooleanLabel(success)));
            if (!success)
            {
                logger.LogCritical(exception, "Rollback of bookingReference: {BookingReference} was not successful!", bookingResponse.BookingReference);
            }
        }

        private static string ToBooleanLabel(bool value) => value ? "true" : "false";

        private async Task<CancellationExtendedResponse> HandelTradeBookingRefund(BookingResponse bookingResponse,
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown, bool isSharedServiceCall, CancellationToken cancellationToken = default)
        {
            logger.LogInformation("TradeBooking will only be cancelled not refunded");
            await CancelBookingInAtcomIfNotAlreadyCancelled(bookingResponse, bookingCancellationRefundBreakdown, isSharedServiceCall, cancellationToken);
            return new CancellationExtendedResponse
            {
                BookingReference = bookingResponse.BookingReference,
                CashRefundAmount = bookingCancellationRefundBreakdown.CashRefundAmount,
                CreditRefundAmount = 0,
                BookingRefundList = new ReadOnlyCollection<BookingRefundResponse>(new List<BookingRefundResponse>()),
                CreatedVoucherList = new ReadOnlyCollection<CreatedVoucher>(new List<CreatedVoucher>())
            };
        }

        private async Task<CancellationExtendedResponse> HandleNoRefund(BookingResponse bookingResponse,
            BookingCancellationRequest bookingCancellationRequest,
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown, bool isSharedServiceCall)
        {
            if (bookingCancellationRequest.RefundOption != BookingCancellationRequestRefundOption.None)
            {
                logger.LogError(
                    "There is nothing to refund but refund option was not set correctly. RefundOption is: {RefundOption}",
                    bookingCancellationRequest.RefundOption.ToString());
                throw new ApiException(ApiExceptionCodes.BookingCancellationRefundOptionError);
            }

            await CancelBookingInAtcomIfNotAlreadyCancelled(bookingResponse, bookingCancellationRefundBreakdown, isSharedServiceCall);
            return new CancellationExtendedResponse
            {
                BookingReference = bookingResponse.BookingReference, 
                CashRefundAmount = 0, 
                CreditRefundAmount = 0,
                BookingRefundList = new ReadOnlyCollection<BookingRefundResponse>(new List<BookingRefundResponse>()),
                CreatedVoucherList = new ReadOnlyCollection<CreatedVoucher>(new List<CreatedVoucher>())
            };
        }

        private static bool NothingToRefund(BookingCancellationRefundOption bookingCancellationRefundOption)
        {
            return bookingCancellationRefundOption == BookingCancellationRefundOption.None;
        }

        private static bool CheckIfRefundOptionMatch(BookingCancellationRequest bookingCancellationRequest,
            BookingCancellationReason bookingCancellationReason,
            BookingCancellationRefundOption bookingCancellationRefundOption, bool isSharedServiceCall)
        {
            //we need this for the bulktool because the hardcode the refundOption to "original payment".
            if (isSharedServiceCall && bookingCancellationReason == BookingCancellationReason.EasyJetLed)
            {
                return true;
            }

            if (bookingCancellationRefundOption is BookingCancellationRefundOption.OriginalPayment
                    or BookingCancellationRefundOption.CreditAndOriginalPayment &&
                bookingCancellationRequest.RefundOption == BookingCancellationRequestRefundOption.OriginalPayment)
            {
                return true;
            }

            if (bookingCancellationRefundOption is BookingCancellationRefundOption.CreditOnly
                    or BookingCancellationRefundOption.CreditAndOriginalPayment &&
                bookingCancellationRequest.RefundOption == BookingCancellationRequestRefundOption.Credit)
            {
                return true;
            }

            return false;
        }

        private async Task CancelBookingInAtcomIfNotAlreadyCancelled(BookingResponse bookingResponse,
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown, bool isSharedServiceCall, CancellationToken cancellationToken = default)
        {
            await CancelBookingInAtcomIfNotAlreadyCancelled(bookingResponse, bookingCancellationRefundBreakdown,
                isSharedServiceCall, new List<BookingRefundResponse>(0), new BookingRefundExtendedResponse(), cancellationToken);
        }

        private async Task CancelBookingInAtcomIfNotAlreadyCancelled(BookingResponse bookingResponse,
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown, bool isSharedServiceCall,
            List<BookingRefundResponse> paymentRefund, BookingRefundExtendedResponse creditRefund, CancellationToken cancellationToken = default)
        {
            if (bookingResponse.BookingStatus == "CANCELED")
            {
                return;
            }

            var cancelWithoutFee = !CancellationHasFee(bookingCancellationRefundBreakdown);
            try
            {
                if (isSharedServiceCall)
                {
                    var marketCode = bookingResponse.MarketCode;
                    var language = bookingResponse.Language;

                    await bookingRepository.CancelBooking(bookingResponse.BookingReference, "Booking Cancellation",
                        cancelWithoutFee, marketCode, language, bookingResponse.PromotionCollections);
                }
                else
                {
                    await bookingRepository.CancelBooking(bookingResponse.BookingReference, "Booking Cancellation",
                        cancelWithoutFee, bookingResponse.PromotionCollections);
                }
            }
            catch (Exception exception)
            {
                await bookingCancellationMemoService.AddFailedCancellationMemo(bookingResponse, cancellationToken);
                List<Task> tasks = 
                [
                    RollbackCashRefund(bookingResponse, paymentRefund, exception),
                    RollbackCreditRefund(bookingResponse, creditRefund, exception)
                ];
                await Task.WhenAll(tasks);
                throw;
            }
        }

        private static bool CancellationHasFee(BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown)
        {
            return bookingCancellationRefundBreakdown.CancelFeeAmount > 0 || 
                   bookingCancellationRefundBreakdown.AmendmentFeeAmount > 0;
        }

        private static bool PreviousCalculatedRefundDiffersToActualCalculatedRefund(
            BookingCancellationRequest bookingCancellationRequest,
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown)
        {
            return bookingCancellationRefundBreakdown.GetHashCode() !=
                   bookingCancellationRequest.BookingBreakdownValidationHash;
        }

        internal async Task ValidatePreflightChecks(
            BookingResponse bookingResponse, 
            BookingCancellationReason bookingCancellationReason, 
            bool isSharedServiceCall, 
            bool skipLeadPassengerCheck)
        {
            var isRefundEnabled = await bookingCancellationRefundValidationService.IsRefundEnabled(bookingResponse, isSharedServiceCall, bookingCancellationReason);
            if (!isRefundEnabled)
            {
                logger.LogError("Refund disabled by rules");
                throw new ApiException(ApiExceptionCodes.RefundError, "Not eligible for refund", HttpStatusCode.UnprocessableEntity);
            }

            var isWebsiteRequest = await bookingCancellationRequestService.IsWebsiteRequest();
            if (!isWebsiteRequest)
                return;

            var isCurrentUserLeadPassenger =
                await bookingCancellationRefundValidationService.IsCurrentUserLeadPassenger(bookingResponse);
            if (!skipLeadPassengerCheck && !isCurrentUserLeadPassenger)
            {
                logger.LogError("User is not the lead passenger");
                throw new ApiException(ApiExceptionCodes.RefundError, "Not eligible for refund", HttpStatusCode.UnprocessableEntity);
            }

            if (bookingCancellationReason == BookingCancellationReason.CustomerLed && bookingResponse.IsExternalAgency)
            {
                logger.LogError("Cannot cancel Trade booking '{BookingReference}' as CustomerLed, needs to be done by Trade Agent or Contact Centre",  bookingResponse.BookingReference);
                throw new ApiException(ApiExceptionCodes.RefundError, "Not eligible for refund", HttpStatusCode.UnprocessableEntity);
            }
        }

        private async Task<BookingResponse> GetBooking(BookingCancellationRequestBase bookingCancellationRequest)
        {
            var bookingResponse = await bookingRepository.GetBooking(bookingCancellationRequest);
            bookingResponse.Memo = await bookingRepository.GetBookingMemo(bookingResponse.BookingReference);
            return bookingResponse;
        }

        private void LogBookingCancellationRefundOption(BookingResponse bookingResponse, BookingCancellationRefundOption bookingCancellationRefundOption)
        {
            try
            {
                logger.LogInformation("BookingCancellationRefundOption for bookingReference: {BookingReference}. RefundOption: {BookingCancellationRefundOption}",
                    bookingResponse?.BookingReference, bookingCancellationRefundOption);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to log BookingCancellationRefundOption for bookingReference: {BookingReference}", bookingResponse?.BookingReference);
            }
        }

        private void LogBookingCancellationRefundBreakdown(BookingResponse bookingResponse, BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown)
        {
            try
            {
                logger.LogInformation("BookingCancellationRefundBreakdown for bookingReference: {BookingReference}. Breakdown: {@BookingCancellationRefundBreakdown}",
                    bookingResponse?.BookingReference, bookingCancellationRefundBreakdown);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to log BookingCancellationRefundBreakdown for bookingReference: {BookingReference}", bookingResponse?.BookingReference);
            }
        }
    }
}

