using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

namespace easyJet.Holidays.Api.Domain.Services.BulkTool.Commands
{
    /// <summary>
    /// Add credit command
    /// </summary>
    public class AddCreditCommand : IBulkToolCommand
    {
        private const string EmailPattern = @"^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$";
        private readonly IVouchersService _vouchersService;
        private readonly ILogger<AddCreditCommand> _logger;
        private readonly BulkToolActions _actions;
        private readonly List<string> _validReasonCodes;

        public AddCreditCommand(
            IVouchersService vouchersService,
            ILogger<AddCreditCommand> logger,
            BulkToolActions actions
            )
        {
            _vouchersService = vouchersService;
            _logger = logger;
            _actions = actions;
        }

        /// <summary>
        /// Add credit by booking reference or email
        /// 
        /// Method is idempotent and can be run multiple times 
        /// </summary>
        /// <param name="bookingNullable">Booking object.</param>
        /// <param name="request">Request model</param>
        /// <param name="correlationId">Correlation id</param>
        /// <returns>Cancellation and refund response object.</returns>
        public async Task<BulkToolResponse> Invoke(BookingResponse bookingNullable, BulkToolRequest request, string correlationId)
        {
            var command = _actions.GetCommandName(request);
            if (!string.IsNullOrWhiteSpace(request.Booking?.Reference) && string.IsNullOrWhiteSpace(request.Booking?.Email))
            {
                var booking = await _actions.TryGetBooking(request.Booking.Reference);
                request.Booking.Email = booking?.CustomerDetails.Email;
                await _actions.ValidateBooking(booking, false, command);
            }

            if (string.IsNullOrWhiteSpace(request.Booking?.Email))
            {
                _logger.LogWarning("Email can not be empty");
                throw new ApiException(ApiExceptionCodes.VoucherCustomersGet, new ApiError[] { }, "Email can not be empty");
            }

            var credit = request.Booking;
            var currency = "GBP"; // TODO: retrieve currency from booking
            ValidateReason(credit.Reason);
            try
            {
                if (!Regex.IsMatch(credit?.Email, EmailPattern))
                {
                    _logger.LogWarning("Invalid email address: {Email}", credit?.Email);
                    throw new ApiException(ApiExceptionCodes.VoucherCustomersGet, new ApiError[] { }, "Invalid email address");
                }

                var voucherId = await AddCreditByEmail(credit.Email, Convert.ToDecimal(credit.Amount), currency, credit.Memo, credit.Reason, command);

                _logger.LogInformation("Credit successfully added to {Reference}", credit.Reference);
                return new BulkToolResponse() { Message = "Credit successfully added", Reference = credit.Email, CorrelationId = string.Empty, Note = voucherId };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to add credit to {Email}", credit?.Email);
                throw new ApiException(ApiExceptionCodes.CreditsFailedToWithdrawFullAmmount, new ApiError[] { }, $"Failed to add credit to {credit?.Email}");
            }
        }

        /// <summary>
        /// Add credit to customer by email adress.
        /// </summary>
        /// <param name="email">Email adress.</param>
        /// <param name="totalAmountPence">Amount of credit.</param>
        /// <param name="memo">Memo.</param>
        /// <param name="reason">Reason.</param>
        /// <returns></returns>
        private async Task<string> AddCreditByEmail(string email, decimal totalAmountPence, string currency, string memo, string reason, string command)
        {
            var customer = await _actions.GetCustomerByEmailOrCreate(email);

            var voucherId = _actions.GetId();

            // Get metadata
            var meta = _actions.GetBulkCreditMetadata(memo, command, string.Empty, currency).Where(x => x.Key != "booking_ref").ToDictionary(x => x.Key, x => x.Value);
            await _vouchersService.CreateAndPublishVoucher(voucherId, totalAmountPence / 100, currency, customer.SourceId ?? customer.Id, meta, reason);

            return voucherId;
        }

        /// <summary>
        /// Prase reason. EMpty values treat as refunds
        /// </summary>
        /// <param name="reason"></param>
        /// <returns></returns>
        private void ValidateReason(string reason)
        {
            if (!_vouchersService.IsReasonCodeValid(reason))
            {
                throw new ApiException(ApiExceptionCodes.InvalidReasonValue, null, ApiExceptionCodes.InvalidReasonValue.Description);
            }
        }
    }
}
