using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.Api.Domain.Services.BulkTool.Commands
{
    /// <summary>
    /// Transfer credit to another account
    /// </summary>
    public class TransferCreditCommand : IBulkToolCommand
    {
        private readonly BulkToolActions _actions;
        private readonly ILogger<TransferCreditCommand> _logger;
        private readonly IVouchersService _vouchersService;

        /// <summary>
        /// Initialize services and settings for bulk tool service.
        /// </summary>
        public TransferCreditCommand(
            ILogger<TransferCreditCommand> logger,
            BulkToolActions actions,
            IVouchersService vouchersService
            )
        {
            _logger = logger;
            _actions = actions;
            _vouchersService = vouchersService;
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
            BulkToolResponse ErrorResponse(string msg) => new BulkToolResponse() { Message = msg, Reference = request.Booking.Email, CorrelationId = correlationId, Note = string.Empty };

            try
            {
                var amountPences = int.Parse(request.Booking.Amount);
                var currency = request.Booking.Currency;
                if (string.IsNullOrEmpty(currency))
                {
                    return ErrorResponse($"Currency can not be empty");
                }

                var emailFrom = request.Booking.Reference;
                var emailTo = request.Booking.Email;
                if (string.IsNullOrEmpty(emailFrom) || string.IsNullOrEmpty(emailTo))
                {
                    return ErrorResponse($"Email can not be empty");
                }

                var customerFrom = await _actions.GetCustomerByEmailOrCreate(emailFrom);
                var customerTo = await _actions.GetCustomerByEmailOrCreate(emailTo);
                if (customerFrom == null || customerTo == null)
                {
                    return ErrorResponse($"Cannot get customer by email");
                }

                IEnumerable<VoucherWithCustomer> VouchersToMove(IEnumerable<VoucherWithCustomer> vouchers)
                {
                    var options = MathUtils.SubsetSum(vouchers.ToList(), v => v.Gift.Balance, amountPences).ToList();
                    options.Sort((a, b) => a.Count() - b.Count());
                    return options.FirstOrDefault() ?? new List<VoucherWithCustomer>();
                }

                var result = await _vouchersService.TransferVouchers(customerFrom.Id, customerTo.Id, currency, VouchersToMove);

                if (result.Failed != null && result.Failed.Any())
                {
                    return ErrorResponse($"Error during credits transfer. Failed vouchers: {string.Join(", ", result.Failed.ToArray())}");
                }

                return new BulkToolResponse() { Message = "Successfully transferred vouchers", Reference = request.Booking.Email, CorrelationId = string.Empty, Note = string.Join(", ", result.Successfull.ToArray()) };
            }
            catch (Exception ex)
            {
                if (ex is ApiException apiEx)
                {
                    // Do exceptions mapping to keep call center exception codes
                    var exCode = apiEx.Code.Code;
                    if (exCode == ApiExceptionCodes.CreditsTransferNoCustomer.Code)
                    {
                        return ErrorResponse($"Cannot get customer by email");
                    }
                    else if (exCode == ApiExceptionCodes.CreditsTransferNoVouchersSubset.Code)
                    {
                        return ErrorResponse($"No valid vouchers subset for requested amount");
                    }
                    else if (exCode == ApiExceptionCodes.CreditsTransferNoVouchers.Code)
                    {
                        return ErrorResponse($"No vouchers to transfer");
                    }
                }

                _logger.LogError(ex, "Failed to transfer vouchers");
                return ErrorResponse("Failed to transfer vouchers");
            }
        }
    }
}
