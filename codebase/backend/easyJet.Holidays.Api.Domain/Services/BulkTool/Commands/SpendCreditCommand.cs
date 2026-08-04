using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;

namespace easyJet.Holidays.Api.Domain.Services.BulkTool.Commands
{
    /// <summary>
    /// Add credit to booking command
    /// </summary>
    public class SpendCreditCommand : IBulkToolCommand
    {
        private readonly BulkToolSettings _bulkToolSettings;
        private readonly StatusesSettings _statusesSettings;
        private readonly VoucherSettings _voucherSettings;
        private readonly BulkToolActions _actions;
        private readonly ILogger<SpendCreditCommand> _logger;
        private readonly IBookingCreditService _bookingCreditService;

        /// <summary>
        /// Initialize services and settings for bulk tool service.
        /// </summary>
        public SpendCreditCommand(
            IOptions<BulkToolSettings> bulkToolSettings,
            IOptions<ApiSettings> apiSettings,
            ILogger<SpendCreditCommand> logger,
            BulkToolActions actions,
            IBookingCreditService bookingCreditService
            )
        {
            _logger = logger;
            _actions = actions;
            _bookingCreditService = bookingCreditService;
            try
            {
                _bulkToolSettings = bulkToolSettings.Value ?? throw new ArgumentNullException(nameof(bulkToolSettings));
                _statusesSettings = _bulkToolSettings.Statuses ?? throw new ArgumentNullException(nameof(_bulkToolSettings));
                _voucherSettings = apiSettings?.Value?.Vouchers ?? throw new ArgumentNullException(nameof(_voucherSettings));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cannot get settings");
                throw;
            }
        }

        /// <summary>
        /// Add credit to booking
        /// </summary>
        /// <param name="booking"></param>
        /// <param name="request"></param>
        /// <param name="correlationId"></param>
        /// <returns></returns>
        public async Task<BulkToolResponse> Invoke(BookingResponse booking, BulkToolRequest request, string correlationId)
        {
            var reference = booking?.BookingReference;
            BulkToolResponse ErrorResponse(string msg) => new BulkToolResponse() { Message = msg, Reference = reference, CorrelationId = correlationId, Note = string.Empty };

            if (booking == null)
            {
                return ErrorResponse($"{nameof(booking)} is null");
            }

            if (request == null)
            {
                return ErrorResponse($"{nameof(request)} is null");
            }

            try
            {
                var amountPounds = decimal.Parse(request.Booking.Amount, CultureInfo.InvariantCulture) / 100;
                var command = _actions.GetCommandName(request);
                var invalidStatuses = new List<string> {
                    _statusesSettings.Canceled,
                    _statusesSettings.Lock,
                    _statusesSettings.Quote,
                    _statusesSettings.Option,
                };

                // Validate booking status
                if (invalidStatuses.Contains(booking.BookingStatus))
                {
                    return ErrorResponse($"Cannot process booking with status {booking.BookingStatus}");
                }

                // Validate customer email
                if (!request.Booking.Email.Equals(booking.CustomerDetails?.Email ?? string.Empty, StringComparison.OrdinalIgnoreCase))
                {
                    return ErrorResponse($"Customer email is different from booking email");
                }

                // Redeem customer credits
                var customer = await _actions.GetCustomerByEmailOrCreate(request.Booking.Email);

                try
                {
                    var spendResults = await _bookingCreditService.SpendCredit(booking, amountPounds, "GBP", customer.SourceId ?? customer.Id, new RedemptionMetadata()
                    {
                        Action = _voucherSettings.Action.Spend,
                        Source = _voucherSettings.Source.BulkTool
                    });
                    var voucherIds = spendResults.Select(x => x.VouchersIds);
                    return new BulkToolResponse() { Message = "Successfully added credit to booking", Reference = reference, CorrelationId = string.Empty, Note = string.Join(", ", voucherIds) };
                }
                catch (Exception ex)
                {
                    if (ex is ApiException)
                    {
                        // Do exceptions mapping to keep call center exception codes
                        var apiEx = (ApiException)ex;
                        var exCode = apiEx.Code.Code;
                        if (exCode == ApiExceptionCodes.CreditsSpendCreditsFullyPaid.Code)
                        {
                            return ErrorResponse($"Booking is fully paid");
                        }
                        else if (exCode == ApiExceptionCodes.CreditsSpendCreditsPriceNegative.Code)
                        {
                            return ErrorResponse($"Credit amount should be greater than 0");
                        }
                        else if (exCode == ApiExceptionCodes.CreditsSpendCreditsInvalidPrice.Code)
                        {
                            return ErrorResponse($"Credit amount should not be less than due amount");
                        }
                        else if (exCode == ApiExceptionCodes.CreditsSpendCreditsCreditsDisabled.Code)
                        {
                            return ErrorResponse($"Credit service is not available");
                        }
                        else if (exCode == ApiExceptionCodes.CreditsInsufficientFunds.Code)
                        {
                            return ErrorResponse($"Insufficient funds");
                        }
                    }

                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to add credit to booking");
                return ErrorResponse("Failed to add credit to booking");
            }
        }
    }
}
