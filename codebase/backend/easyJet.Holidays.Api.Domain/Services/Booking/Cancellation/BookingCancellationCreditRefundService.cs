using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using Microsoft.Extensions.Logging;
using CustomerDetails = easyJet.Holidays.Api.Domain.Data.Authentication.CustomerDetails;

namespace easyJet.Holidays.Api.Domain.Services.Booking.Cancellation
{
    /// <inheritdoc />
    public class BookingCancellationCreditRefundService(
        IBookingCancellationRequestService bookingCancellationRequestService,
        IBookingCancellationCalculateCreditRefundService bookingCancellationCalculateCreditRefundService,
        IVouchersService vouchersService,
        IAuthenticationService authenticationService,
        IVouchersCustomerRepository vouchersCustomerRepository,
        ILogger<BookingCancellationCreditRefundService> logger) : IBookingCancellationCreditRefundService
    {
        /// <inheritdoc />
        public async Task<BookingRefundExtendedResponse> RefundCreditAmount(BookingCancellationRequest bookingCancellationRequest, BookingResponse bookingResponse,
            BookingCancellationRefundBreakdown bookingCancellationRefundBreakdown, CancellationToken cancellationToken)
        {
            ArgumentNullException.ThrowIfNull(bookingCancellationRequest);
            ArgumentNullException.ThrowIfNull(bookingCancellationRequest.RefundOption);
            ArgumentNullException.ThrowIfNull(bookingResponse);

            var bookingCancellationCreditRefundBreakdown = await bookingCancellationCalculateCreditRefundService.CalculateCreditRefund(bookingResponse, bookingCancellationRefundBreakdown, bookingCancellationRequest.RefundOption.Value, cancellationToken);
            var customerDetails = await GetCustomerDetails(bookingResponse);
            var customerId = await GetCustomerId(customerDetails);

            if (string.IsNullOrEmpty(customerId))
            {
                logger.LogError("Customer not found for booking {BookingReference}", bookingResponse.BookingReference);
                throw new ApiException(ApiExceptionCodes.CustomerNoMappedId);
            }
            var bookingRefundResponse = await vouchersService.RefundCreditsAndUpdateBooking(bookingResponse, bookingCancellationCreditRefundBreakdown, bookingCancellationRequest.Source, customerId);
            return bookingRefundResponse;
        }

        /// <inheritdoc />
        public async Task<bool> RollbackCreditRefund(BookingResponse bookingResponse, IReadOnlyCollection<CreatedVoucher> vouchers)
        {
            ArgumentNullException.ThrowIfNull(vouchers);

            if (vouchers.Count == 0)
            {
                logger.LogInformation("There are no vouchers to rollback.");
                return true;
            }

            return await vouchersService.RollbackVouchers(bookingResponse, vouchers);
        }

        private async Task<CustomerDetails> GetCustomerDetails(BookingResponse bookingResponse)
        {
            if (await bookingCancellationRequestService.IsWebsiteRequest())
                return await authenticationService.CustomerDetails();

            return new CustomerDetails()
            {
                FirstName = bookingResponse.Guests?.FirstOrDefault(x => x.IsLead)?.FirstName,
                LastName = bookingResponse.Guests?.FirstOrDefault(x => x.IsLead)?.LastName,
                Email = bookingResponse.LeadPassenger.Email,
            };
        }

        private async Task<string> GetCustomerId(CustomerDetails customerDetails)
        {
            if (await bookingCancellationRequestService.IsWebsiteRequest())
            {
                //Get b2b customer id
                string customerId = await authenticationService.MappedCustomerId(customerDetails);
                if (string.IsNullOrEmpty(customerId))
                {
                    throw new ApiException(ApiExceptionCodes.CustomerNoMappedId);
                }

                //get or create customer in voucherify if customer does not exist. We need this to prevent error when trying to refund credits.
                await vouchersCustomerRepository.GetOrCreate(customerId, customerDetails);
                return customerId;
            }
            
            var customer = await vouchersCustomerRepository.GetOrCreate(null, customerDetails);
            return customer.SourceId ?? customer.Id;
        }
    }
}
