using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using Voucherify.DataModel;

namespace easyJet.Holidays.Api.Domain.Services.BulkTool
{
    /// <inheritdoc/>
    public class BulkToolActions
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IVouchersCustomerRepository _customersRepository;

        private readonly IBookingRefundService _bookingPaymentsService;
        private readonly IVouchersService _vouchersService;

        private readonly VoucherSettings _voucherSettings;
        private readonly BulkToolSettings _bulkToolSettings;
        private readonly BookingCodesSettings _bookingCodesSettings;
        private readonly MessagesSettings _messagesSettings;
        private readonly CancelAndCreditSettings _cancelAndCreditSettings;
        private readonly AddCreditByEmailSettings _addCreditByEmailSettings;
        private readonly StatusesSettings _statusesSettings;

        private readonly ILogger<BulkToolBookingService> _logger;

        private readonly Dictionary<string, string> _codesMessages;
        private readonly string[] _ignoredStatuses;
        private readonly string[] _supportedCommandsForExternalAgency;

        /// <summary>
        /// Initialize services and settings for bulk tool service.
        /// </summary>
        /// <param name="bookingRepository">Booking repository.</param>
        /// <param name="bookingPaymentsService">Booking </param>
        /// <param name="vouchersService">Vouchers service.</param>
        /// <param name="customersRepository">Customers repository.</param>
        /// <param name="apiSettings">Api settings.</param>
        /// <param name="bulkToolSettings">Bulk tool settings.</param>
        /// <param name="logger">Bulk tool service logger.</param>
        public BulkToolActions(IBookingRepository bookingRepository,
            IBookingRefundService bookingPaymentsService,
            IVouchersService vouchersService,
            IVouchersCustomerRepository customersRepository,
            IOptions<ApiSettings> apiSettings,
            IOptions<BulkToolSettings> bulkToolSettings,
            ILogger<BulkToolBookingService> logger
            )
        {
            _bookingRepository = bookingRepository;
            _bookingPaymentsService = bookingPaymentsService;
            _vouchersService = vouchersService;
            _customersRepository = customersRepository;
            _logger = logger;

            try
            {
                _voucherSettings = apiSettings?.Value?.Vouchers;
                _bulkToolSettings = bulkToolSettings.Value ?? throw new ArgumentNullException(nameof(bulkToolSettings));
                _bookingCodesSettings = _bulkToolSettings.BookingCodes ?? throw new ArgumentNullException(nameof(_bulkToolSettings));
                _messagesSettings = _bulkToolSettings.Messages ?? throw new ArgumentNullException(nameof(_bulkToolSettings));
                _cancelAndCreditSettings = _bulkToolSettings.CancelAndCredit ?? throw new ArgumentNullException(nameof(_bulkToolSettings));
                _addCreditByEmailSettings = _bulkToolSettings.AddCreditByEmail ?? throw new ArgumentNullException(nameof(_bulkToolSettings));
                _statusesSettings = _bulkToolSettings.Statuses ?? throw new ArgumentNullException(nameof(_bulkToolSettings));
                _ignoredStatuses = new[] { _statusesSettings.Option, _statusesSettings.Quote };
                _supportedCommandsForExternalAgency = _bulkToolSettings.SupportedCommandsForExternalAgency ?? throw new ArgumentNullException(nameof(_bulkToolSettings.SupportedCommandsForExternalAgency));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cannot get settings");
                throw;
            }

            _codesMessages = new Dictionary<string, string>()
            {
                { _bookingCodesSettings?.BookingNotFound, _messagesSettings.BookingNotFound },
                { _bookingCodesSettings?.BookingAlreadyCanceled, _messagesSettings.BookingAlreadyCanceled }
            };
        }

        /// <summary>
        /// Get or create customer in voucherify.
        /// </summary>
        /// <param name="email">Customer email.</param>
        /// <returns>Voucherify customer.</returns>
        public virtual async Task<Customer> GetCustomerByEmailOrCreate(string email)
        {
            var customer = (await _customersRepository.GetCustomersByEmail(email))?.Customers?.FirstOrDefault();

            if (customer == null)
            {
                _logger.LogInformation("Customer was not found by {Email}", email);

                customer = await _customersRepository.GetOrCreate(null, new Data.Authentication.CustomerDetails
                {
                    Email = email
                });

                // add delay after customer creation because voucherify sometimes has delay
                // var customer was created
                var foundCustomerById = false;
                int attempt = 0;
                while (foundCustomerById == false && attempt < _addCreditByEmailSettings.AttemptsLimit)
                {
                    attempt++;
                    customer = (await _customersRepository.GetCustomersByEmail(email))?.Customers?.FirstOrDefault();
                    if (customer != null)
                    {
                        foundCustomerById = true;
                    }
                    else
                    {
                        await Task.Delay(_addCreditByEmailSettings.DelayMls);
                    }

                }
            }

            return customer;
        }

        /// <summary>
        /// Trying get booking from atcom.
        /// </summary>
        /// <param name="reference">Booking reference.</param>
        /// <returns>Booking response object.</returns>
        public virtual async Task<BookingResponse> TryGetBooking(string reference)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(reference) || !int.TryParse(reference.Trim().Replace(' ', '_'), out var refer))
                {
                    _logger.LogWarning("Invalid booking reference");
                    throw new ApiException(ApiExceptionCodes.BookingViewError, new ApiError[] { }, "Invalid booking reference");
                }

                var booking = await _bookingRepository.GetBookingUnsafe(reference, new GetBookingOptions { AllowNoAccomm = true, IgnoreAtcomErrors = true, IsAgentRequired = false });

                return booking;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cannot get booking");
                throw new ApiException(ApiExceptionCodes.BookingViewError, new ApiError[] { }, _messagesSettings.BookingNotFound);
            }
        }

        public virtual async Task<BookingResponse> TryGetBooking(string reference, DateTime date, string lastName)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(reference) || !int.TryParse(reference.Trim().Replace(' ', '_'), out var refer))
                {
                    _logger.LogWarning("Invalid booking reference");
                    throw new ApiException(ApiExceptionCodes.BookingViewError, new ApiError[] { }, "Invalid booking reference");
                }

                var booking = await _bookingRepository.GetBooking(new GetBookingRequest()
                {
                    BookingReference = reference,
                    Date = date,
                    LastName = lastName,
                });

                return booking;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cannot get booking");
                throw new ApiException(ApiExceptionCodes.BookingViewError, new ApiError[] { }, _messagesSettings.BookingNotFound);
            }
        }

        /// <summary>
        /// Refund booking action.
        /// </summary>
        /// <param name="booking">Booking response object.</param>
        /// <param name="successfulStatusMessage">Successful status message if refund will be successully.</param>
        /// <param name="failedStatusMessage">Failed status message if refund will be failed.</param>
        /// <param name="refundCredits">Whether credit payments shold be also refunded</param>
        /// <returns>Refund status response.</returns>
        public virtual async Task<BulkToolResponse> RefundBoooking(BookingResponse booking, string successfulStatusMessage, string failedStatusMessage, string correlationId, string action, bool refundCredits = true)
        {
            var reference = booking.BookingReference;
            var result = new BulkToolResponse
            {
                Reference = reference
            };

            if (booking.PaymentInfo.PaymentHistory == null)
            {
                result.Message = successfulStatusMessage;
                result.Note = _messagesSettings.NoPaymentsFound;
                _logger.LogInformation("{Reference} - {Msg}", reference, _messagesSettings.NoPaymentsFound);
                return result;
            }

            var bookingPrice = booking?.PaymentInfo?.PaymentHistory?.Sum(x => x.Amount) ?? 0;
            var currency = booking?.Currency.Code;

            if (bookingPrice <= 0)
            {
                result.Message = failedStatusMessage;
                result.CorrelationId = correlationId;
                result.Note = $"No payments to refund for booking {reference}";
                _logger.LogWarning("No payments to refund for booking {Reference}", reference);
                return result;
            }

            // 1. Refund CARD payments
            var refundResult = await _bookingPaymentsService.RefundNonCreditPayments(booking);
            var successfulRefunds = refundResult?.Where(x => x.Payment != null).Select(x => $"Amount of refund paymentId: {x.Payment.PayId} amount: {x.Payment.Amount}").ToList();
            var failedRefunds = refundResult?.Where(x => x.Exception != null).ToList();


            // 2. Refund credits
            if (refundCredits)
            {
                try
                {
                    var creditPayments = booking.PaymentInfo.PaymentHistory.Where(x => x.IsCredit).ToList();
                    // We refund all credit payments as single "refund" payment, we need to calcualte sum of all credit payments(some of them may be redeemed) and create voucher
                    var creditToRefund = creditPayments.Sum(x => x.Amount);

                    if (creditToRefund > 0)
                    {

                        var customer = await GetCustomerByEmailOrCreate(booking.CustomerDetails.Email);
                        var meta = GetBulkCreditMetadata(_cancelAndCreditSettings.DefaultMemo, action, booking?.BookingReference, currency);
                        var voucherIds = await _vouchersService.AddRefundCreditToBooking(customer.Id, creditToRefund, currency, GetId(), booking, meta);
                        successfulRefunds?.Add($"Credit refunded: {string.Join(", ", voucherIds.ToArray())}, amount: {creditToRefund}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to refund credits for {BookingReference}", booking.BookingReference);
                    failedRefunds?.Add(new BookingRefundResponse
                    {
                        Exception = new ApiException(ApiExceptionCodes.RefundError, "Can not refund credit", null, ex)
                    });
                }
            }

            if (failedRefunds != null && failedRefunds.Any())
            {
                failedRefunds.ToList().ForEach(x => _logger.LogWarning(x.Exception.Message));
                result.Message = failedStatusMessage;
                result.CorrelationId = correlationId;
                result.Note = $"{string.Join(";", failedRefunds.Select(x => x.Exception.Message))};{string.Join(";", successfulRefunds)}";
            }
            else
            {
                _logger.LogInformation("{Reference} - {Msg}", reference, successfulStatusMessage);
                result.Message = successfulStatusMessage;
                result.Note = string.Join(";", successfulRefunds);
            }

            return result;
        }

        /// <summary>
        /// Generate bulk credit metadata.
        /// </summary>
        /// <param name="memo">Memo.</param>
        /// <param name="action">bult tull action.(Credit, Cancel booking and other)</param>
        /// <param name="bookingRef">Booking reference.</param>
        /// <returns>Metadata.</returns>
        public Dictionary<string, object> GetBulkCreditMetadata(string memo, string action, string bookingRef, string currency)
        {
            var meta = new Dictionary<string, object>
            {
                { "currency", currency },
                { "source", _voucherSettings.Source.BulkTool },
                { "action", action },
                { "memo", memo },
                { "booking_ref", bookingRef ?? string.Empty}
            };

            return meta;
        }

        /// <summary>
        /// Generate call centre metadata.
        /// </summary>
        /// <param name="source">Source.</param>
        /// <param name="action">Call centre action.(Credit, Cancel booking and other)</param>
        /// <param name="bookingRef">Booking reference.</param>
        /// <returns>Metadata.</returns>
        public Dictionary<string, object> GetCallCentreCreditMetadata(string action, string bookingRef, string agentId, string currency)
        {
            var meta = new Dictionary<string, object>
            {
                { "currency", currency },
                { "source", _voucherSettings.Source.CallCentre },
                { "action", action },
                { "booking_ref", bookingRef },
                { "agent_id", agentId }
            };

            return meta;
        }

        /// <summary>
        /// Create bulk tool id.
        /// </summary>
        /// <returns>Id.</returns>
        public string GetId()
        {
            return $"bulk-tool-{Guid.NewGuid()}";
        }

        /// <summary>
        /// Create call centre id.
        /// </summary>
        /// <returns>Id.</returns>
        public string GetCallCentreId()
        {
            return $"{Guid.NewGuid()}";
        }

        /// <summary>
        /// Get command name in lower case
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        public string GetCommandName(BulkToolRequest request)
        {
            return request.Booking.Flag.ToLower().Trim();
        }

        /// <summary>
        /// Cancel booking action.
        /// </summary>
        /// <param name="reference">Booking refrence.</param>
        /// <param name="booking">Booking response object.</param>
        /// <returns>Cancellation status response.</returns>
        public async Task<Result<BookingResponse, BulkToolResponse>> CancelBooking(string reference, BookingResponse booking, string correlationId)
        {
            var result = new Result<BookingResponse, BulkToolResponse>();
            try
            {
                var bookingResponse = await _bookingRepository.CancelBooking(reference, _messagesSettings.ReasonToCancel, true, booking.PromotionCollections);

                result.Object = bookingResponse;

                _logger.LogInformation("{Reference} successfully cancelled", reference);
                return result;
            }
            catch (BookingCancellationException ex)
            {
                _logger.LogError(ex, "Failed to cancel booking with reference {Reference}", reference);

                string message = _messagesSettings.FailedToCancel;
                if (!string.IsNullOrWhiteSpace(ex?.InnerErrors[0]?.Code) && _codesMessages.TryGetValue(ex?.InnerErrors[0]?.Code, out string resultMessage))
                {
                    message = resultMessage;
                }

                if (ex?.InnerErrors[0]?.Code == _bookingCodesSettings?.BookingAlreadyCanceled)
                {
                    result.Object = booking;
                }

                result.Response = new BulkToolResponse()
                {
                    Message = message,
                    Reference = reference,
                    CorrelationId = correlationId
                };

                return result;
            }

        }

        /// <summary>
        /// Validate booking.
        /// If no command is specified, then all commands for external agency will be invalid
        /// </summary>
        /// <param name="booking">Booking response.</param>
        /// <param name="checkCanceled">Need to do a check for canceled booking.</param>
        /// <param name="command">Check is command supported for external agency</param>
        public virtual async Task ValidateBooking(BookingResponse booking, bool checkCanceled = false, string command = null)
        {
            var bookingMemos = await _bookingRepository.GetBookingMemo(booking.BookingReference);
            CheckMemoOnLockStatus(bookingMemos);
            CheckOnIgnoredStatuses(booking);
            CheckOnExternalAgency(booking, command);
            if (checkCanceled)
            {
                CheckOnCanceledBooking(booking);
            }
        }

        /// <summary>
        /// Checking on ignored statuses.
        /// </summary>
        /// <param name="booking">Booking response object.</param>
        private void CheckOnIgnoredStatuses(BookingResponse booking)
        {
            if (booking != null && _ignoredStatuses.Contains(booking?.BookingStatus))
            {
                _logger.LogWarning("Booking in {BookingStatus} status can't be processed", booking?.BookingStatus);
                throw new ApiException(ApiExceptionCodes.BookingViewError, new ApiError[] { }, $"Booking in {booking?.BookingStatus} status can't be processed");
            }
        }

        /// <summary>
        /// Checking on external agency.
        /// If no command is specified, then all commands for external agency will be invalid
        /// </summary>
        /// <param name="booking">Booking response object.</param>
        /// <param name="command">Command for external agency</param>
        private void CheckOnExternalAgency(BookingResponse booking, string command = null)
        {
            if (booking?.IsExternalAgency == true)
            {
                if (!string.IsNullOrWhiteSpace(command))
                {
                    CheckOnCommandForExternalAgency(command);
                }
                else
                {
                    _logger.LogWarning("It is a trade booking, can't be processed");
                    throw new ApiException(ApiExceptionCodes.BookingExternalAgencyError, new ApiError[] { }, $"It is a trade booking");
                }
            }
        }

        /// <summary>
        /// Checking that command supported for external agency booking
        /// </summary>
        /// <param name="command">Specific command</param>
        private void CheckOnCommandForExternalAgency(string command)
        {
            if (!_supportedCommandsForExternalAgency.Select(c => c.ToLowerInvariant().Trim()).Contains(command.ToLowerInvariant().Trim()))
            {
                _logger.LogWarning("Unsupported command for external agency booking: {Command}", command);
                throw new ApiException(ApiExceptionCodes.BookingExternalAgencyError, new ApiError[] { }, $"Unsupported command for external agency booking: {command}");
            }
        }

        /// <summary>
        /// Checking on extrnal agency.
        /// </summary>
        /// <param name="booking">Booking response object.</param>
        private void CheckOnCanceledBooking(BookingResponse booking)
        {
            if (booking.BookingStatus == _statusesSettings.Canceled)
            {
                _logger.LogInformation("Booking {Reference} is canceled", booking.BookingReference);
                throw new ApiException(ApiExceptionCodes.BookingCanceledError, new ApiError[] { }, "It is a canceled booking");
            }
        }

        /// <summary>
        /// Checking booking on lock status.
        /// </summary>
        /// <param name="memos">Booking memos..</param>
        /// <returns></returns>
        private void CheckMemoOnLockStatus(List<Memo> memos)
        {
            var hasLockedMemoCode = memos?.FirstOrDefault(x => x.Code == _bulkToolSettings?.Statuses.Lock) != null;
            if (hasLockedMemoCode)
            {
                _logger.LogWarning("Locked booking. Skipped");
                throw new ApiException(ApiExceptionCodes.BookingLockedError, new ApiError[] { }, "Locked booking. Skipped");
            }
        }
    }
}
