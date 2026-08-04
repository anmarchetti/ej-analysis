using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.BulkTool.Commands;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;

namespace easyJet.Holidays.Api.Domain.Services.BulkTool
{
    /// <inheritdoc/>
    public class BulkToolBookingService : IBulkToolBookingService
    {
        private readonly IBookingRepository _bookingRepository;

        private readonly BulkToolSettings _bulkToolSettings;
        private readonly CommandsSettings _commandsSettings;
        private readonly BookingCodesSettings _bookingCodesSettings;
        private readonly StatusesSettings _statusesSettings;
        private readonly MessagesSettings _messagesSettings;
        private readonly BulkToolActions _actions;

        private readonly UndoCreditCommand _undoCommand;
        private readonly CancelAndCreditCommand _cancelAndCreditCommand;
        private readonly AddCreditCommand _addCreditCommand;
        private readonly ModifyMemoCommand _modifyMemoCommand;
        private readonly SpendCreditCommand _spendCreditToBookingCommand;
        private readonly TransferCreditCommand _transferCreditToBookingCommand;

        private readonly ILogger<BulkToolBookingService> _logger;

        private readonly Dictionary<string, string> _codesMessages;
        private readonly string[] _allowedCommands;
        private string correlationId;

        /// <summary>
        /// Initialize services and settings for bulk tool service.
        /// </summary>
        /// <param name="bookingRepository">Booking repository.</param>
        /// <param name="bulkToolSettings">Bulk tool settings.</param>
        /// <param name="logger">Bulk tool service logger.</param>
        public BulkToolBookingService(
            IBookingRepository bookingRepository,
            IOptions<BulkToolSettings> bulkToolSettings,
            ILogger<BulkToolBookingService> logger,
            BulkToolActions actions,
            UndoCreditCommand undoCommand,
            CancelAndCreditCommand cancelAndCreditCommand,
            AddCreditCommand addCreditCommand,
            ModifyMemoCommand modifyMemoCommand,
            SpendCreditCommand spendCreditToBookingCommand,
            TransferCreditCommand transferCreditToBookingCommand
            )
        {
            _bookingRepository = bookingRepository;
            _logger = logger;
            _actions = actions;
            _undoCommand = undoCommand;
            _cancelAndCreditCommand = cancelAndCreditCommand;
            _addCreditCommand = addCreditCommand;
            _modifyMemoCommand = modifyMemoCommand;
            _spendCreditToBookingCommand = spendCreditToBookingCommand;
            _transferCreditToBookingCommand = transferCreditToBookingCommand;

            try
            {
                _bulkToolSettings = bulkToolSettings.Value ?? throw new ArgumentNullException(nameof(bulkToolSettings));
                _commandsSettings = _bulkToolSettings.Commands ?? throw new ArgumentNullException(nameof(_bulkToolSettings));
                _bookingCodesSettings = _bulkToolSettings.BookingCodes ?? throw new ArgumentNullException(nameof(_bulkToolSettings));
                _statusesSettings = _bulkToolSettings.Statuses ?? throw new ArgumentNullException(nameof(_bulkToolSettings));
                _messagesSettings = _bulkToolSettings.Messages ?? throw new ArgumentNullException(nameof(_bulkToolSettings));
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
            _allowedCommands = new[] { _commandsSettings.RefundCommand, _commandsSettings.CancelCommand, _commandsSettings.CancelAndRefundCommand, _commandsSettings.ModifyMemoCommand, _commandsSettings.AddCreditCommand, _commandsSettings.CancelAndCreditCommand };
        }

        /// <inheritdoc/>
        public async Task<BulkToolResponse> RunBulkProcess(BulkToolRequest request, string correlationId)
        {
            if (request?.Booking == null)
            {
                _logger.LogInformation("Booking object is null");
                return null;
            }

            this.correlationId = correlationId;
            BulkToolResponse cancellationAndRefundResponseResult;
            try
            {
                var command = _actions.GetCommandName(request);

                // Add credit.
                if (_commandsSettings?.AddCreditCommand == command)
                {
                    cancellationAndRefundResponseResult = await _addCreditCommand.Invoke(null, request, correlationId);
                }
                else if (_commandsSettings?.TransferCreditCommand == command)
                {
                    cancellationAndRefundResponseResult = await _transferCreditToBookingCommand.Invoke(null, request, correlationId);
                }
                else
                {
                    var booking = await _actions.TryGetBooking(request.Booking.Reference);
                    await _actions.ValidateBooking(booking, false, command);

                    // Cancel and refund booking.
                    if (_commandsSettings?.CancelAndRefundCommand == command)
                    {
                        var cancelResult = await CancelBooking(request.Booking.Reference, booking);
                        cancellationAndRefundResponseResult = cancelResult.Object != null
                            ? await _actions.RefundBoooking(
                                booking,
                                _bulkToolSettings.Messages.SuccessfullyCancelledAndRefunded,
                                _bulkToolSettings.Messages.CancellationSuccessfulRefundFailed,
                                correlationId,
                                command)
                            : cancelResult.Response;
                    }
                    // Cancel booking.
                    else if (_commandsSettings?.CancelCommand == command)
                    {
                        var cancelResult = await CancelBooking(request.Booking.Reference);
                        cancellationAndRefundResponseResult = cancelResult.Object != null
                            ? new BulkToolResponse() { Message = _messagesSettings.SuccessfullyCancelled, Reference = request.Booking.Reference }
                            : cancelResult.Response;
                    }
                    // Refund booking.
                    else if (_commandsSettings?.RefundCommand == command)
                    {
                        if (booking.BookingStatus != _statusesSettings.Canceled)
                        {
                            _logger.LogInformation("Cannot refund booking {Reference}. Booking was not cancelled", request.Booking.Reference);
                            throw new ApiException(ApiExceptionCodes.BookingStartTransactionError, new ApiError[] { }, "Cannot refund. Booking was not cancelled");
                        }
                        else
                        {
                            cancellationAndRefundResponseResult = await _actions.RefundBoooking(
                                booking,
                                _messagesSettings.SuccessfullyRefunded,
                                _messagesSettings.FailedToRefund,
                                correlationId,
                                command);
                        }
                    }
                    // Modify memo.
                    else if (_commandsSettings?.ModifyMemoCommand == command)
                    {
                        cancellationAndRefundResponseResult = await _modifyMemoCommand.Invoke(booking, request, correlationId);
                    }
                    // Cancel and credit.
                    else if (_commandsSettings?.CancelAndCreditCommand == command)
                    {
                        cancellationAndRefundResponseResult = await _cancelAndCreditCommand.Invoke(booking, request, correlationId);
                    }
                    else if (_commandsSettings?.UndoCreditCommand == command)
                    {
                        cancellationAndRefundResponseResult = await _undoCommand.Invoke(booking, request, correlationId);
                    }
                    else if (_commandsSettings?.SpendCreditCommand == command)
                    {
                        cancellationAndRefundResponseResult = await _spendCreditToBookingCommand.Invoke(booking, request, correlationId);
                    }
                    // If command not exist.
                    else
                    {
                        _logger.LogInformation("Command {Command} does not exist", command);
                        cancellationAndRefundResponseResult = new BulkToolResponse()
                        {
                            Message = $"Error. Flag {request.Booking.Flag} is not supported",
                            Reference = request.Booking.Reference,
                            Note = $"Flag should be: {string.Join("; ", _allowedCommands)}"
                        };
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing bulk tool");
                cancellationAndRefundResponseResult = new BulkToolResponse()
                {
                    Message = ex.Message,
                    Reference = request.Booking.Reference,
                    CorrelationId = correlationId,
                };
            }

            return cancellationAndRefundResponseResult;
        }

        /// <summary>
        /// Cancel booking action.
        /// </summary>
        /// <param name="reference">Booking reference.</param>
        /// <param name="booking">Booking response object.</param>
        /// <returns>Cancellation status response.</returns>
        private async Task<Result<BookingResponse, BulkToolResponse>> CancelBooking(string reference, BookingResponse booking = null)
        {
            var result = new Result<BookingResponse, BulkToolResponse>();
            try
            {
                var promotionKeys = booking?.PromotionCollections ?? new List<string>();
                var bookingResponse = await _bookingRepository.CancelBooking(reference, _messagesSettings.ReasonToCancel, true, promotionKeys);

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
    }
}
