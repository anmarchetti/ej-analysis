using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.CallCentre;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.BulkTool;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using Force.DeepCloner;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net;
using Voucherify.DataModel;

namespace easyJet.Holidays.Api.Domain.Services.CallCentre
{
    public class CallCentreService : ICallCentreService
    {
        private readonly IVouchersService _vouchersService;
        private readonly IVouchersCustomerRepository _voucherifyCustomersRepository;
        private readonly BulkToolActions _actions;
        private readonly IBookingCreditService _bookingCreditService;
        private readonly IBookingRefundEligibleService _bookingRefundEligibleService;
        private readonly ILogger<CallCentreService> _logger;
        private readonly CallCentreCommandsSettings _callCentreCommandsSettings;
        private readonly VoucherSettings _voucherSettings;

        public CallCentreService(
            IVouchersService vouchersService,
            BulkToolActions actions,
            IVouchersCustomerRepository customerRepository,
            IBookingCreditService bookingCreditService,
            IBookingRefundEligibleService bookingRefundEligibleService,
            IOptions<ApiSettings> apiSettings,
            IOptions<CallCentreSettings> callCentreSettings,
            ILogger<CallCentreService> logger)
        {
            _voucherSettings = apiSettings?.Value?.Vouchers ?? throw new ArgumentNullException(nameof(apiSettings));
            _callCentreCommandsSettings = callCentreSettings.Value?.Commands ?? throw new ArgumentNullException(nameof(callCentreSettings));
            _vouchersService = vouchersService;
            _voucherifyCustomersRepository = customerRepository;
            _bookingRefundEligibleService = bookingRefundEligibleService;
            _actions = actions;
            _bookingCreditService = bookingCreditService;
            _logger = logger;
        }

        ///  <inheritdoc />
        public async Task<MyCreditInfo> AddCredit(AddCreditsRequest request)
        {
            try
            {
                // Add credits here
                var customer = await GetCustomerDetails(request.EmailAddress, false);
                if (customer == null)
                {
                    _logger.LogInformation("Creating customer {EmailAddress}", request.EmailAddress);
                    customer = await _voucherifyCustomersRepository.GetOrCreate(null, new Data.Authentication.CustomerDetails
                    {
                        Email = request.EmailAddress
                    });
                }

                var voucherId = _actions.GetCallCentreId();
                var meta = _actions.GetCallCentreCreditMetadata(_callCentreCommandsSettings.GiveCreditCommand, request.BookingReference, request.AgentId, request.Currency).ToDictionary(x => x.Key, x => x.Value);
                await _vouchersService.CreateAndPublishVoucher(voucherId, request.Amount, request.Currency, customer.SourceId ?? customer.Id, meta, request.Reason);

                return await GetUserCredits(request.EmailAddress, request.Currency, customer.SourceId ?? customer.Id, true);
            }
            catch (ApiException ex)
            {
                _logger.LogError(ex, "Failed to add credits");
                throw new ApiException(ex, ex.StatusCode ?? HttpStatusCode.BadRequest);
            }
        }

        ///  <inheritdoc />
        public async Task<MyCreditInfo> SpendCredit(SpendCreditRequest request)
        {
            try
            {
                var booking = await GetBooking(request.BookingRef, request.Date, request.LastName);
                if (request.Currency != booking.Currency.Code)
                {
                    throw new ApiException(ApiExceptionCodes.CallCentreCurrencyNotMatching);
                }

                var customer = await GetCustomerDetails(booking.LeadPassenger.Email);

                var credits = await GetUserCredits(customer.Email, request.Currency, customer.SourceId ?? customer.Id, false);
                if (credits == null || credits.Balance < request.Amount)
                {
                    throw new ApiException(ApiExceptionCodes.CallCentreNotEnoughCredits);
                }

                try
                {
                    await _bookingCreditService.SpendCredit(booking, request.Amount, request.Currency, customer.SourceId ?? customer.Id, new RedemptionMetadata()
                    {
                        Action = _voucherSettings.Action.Spend,
                        Source = _voucherSettings.Source.CallCentre,
                    });
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
                            throw new ApiException(ApiExceptionCodes.CallCentreSpendCreditsFullyPaid, "Booking is fully paid.", null, null);
                        }
                        else if (exCode == ApiExceptionCodes.CreditsSpendCreditsPriceNegative.Code)
                        {
                            throw new ApiException(ApiExceptionCodes.CallCentreSpendCreditsPriceNegative, "Credit amount should be greater than 0", null, null);
                        }
                        else if (exCode == ApiExceptionCodes.CreditsSpendCreditsInvalidPrice.Code)
                        {
                            throw new ApiException(ApiExceptionCodes.CallCentreSpendCreditsInvalidPrice, $"Credit amount should not be gretter then due amount", null, null);
                        }
                        else if (exCode == ApiExceptionCodes.CreditsSpendCreditsCreditsDisabled.Code)
                        {
                            throw new ApiException(ApiExceptionCodes.CallCentreSpendCreditsCreditsDisabled, "Credit service is not available", null, null, HttpStatusCode.ServiceUnavailable);
                        }

                        throw new ApiException(ApiExceptionCodes.CallCentreSpendCredits, "Failed to redeem user credits.", apiEx.InnerErrors, ex);
                    }
                    throw;
                }

                return await GetUserCredits(booking.LeadPassenger.Email, request.Currency, customer.SourceId ?? customer.Id, true);
            }
            catch (ApiException ex)
            {
                _logger.LogError(ex, "Failed to spend user credits for booking {BookingRef}", request.BookingRef);
                throw new ApiException(ex, ex.StatusCode ?? HttpStatusCode.BadRequest);
            }
        }

        ///  <inheritdoc />
        public async Task<MyCreditInfo> CreditBooking(CreditBookingRequest request)
        {
            try
            {
                var booking = await GetBooking(request.BookingRef, request.Date, request.LastName);
                var customer = await GetCustomerDetails(booking.LeadPassenger.Email, false);

                // Only FirstName, LastName, Email is needed from customer details.
                Data.Authentication.CustomerDetails customerDetails = new Data.Authentication.CustomerDetails()
                {
                    FirstName = booking.Guests?.FirstOrDefault(x => x.IsLead).FirstName,
                    LastName = booking.Guests?.FirstOrDefault(x => x.IsLead).LastName,
                    Email = booking.LeadPassenger.Email,
                };

                if (customer == null)
                {
                    // Create customer if customer does not exists in Voucherify.
                    customer = await _voucherifyCustomersRepository.GetOrCreate(null, customerDetails);
                }

                var credit = await _bookingCreditService.RefundBooking(new ConvertBookingToCreditRequest()
                {
                    BookingReference = request.BookingRef,
                    Date = request.Date,
                    LastName = request.LastName,
                    Type = ConvertType.CREDIT,
                    Source = _voucherSettings.Source.CallCentre
                }, customer.SourceId ?? customer.Id, customerDetails);
                return credit.Credit;
            }
            catch (ApiException ex)
            {
                _logger.LogError(ex, "Failed to convert booking {BookingRef}", request.BookingRef);
                throw new ApiException(ex, ex.StatusCode ?? HttpStatusCode.BadRequest);
            }
        }

        ///  <inheritdoc />
        public async Task<MyCreditInfo> GetCredit(string email, string currency, string customerId = null, bool force = false)
        {
            try
            {
                return await GetUserCredits(email, currency, customerId, force);
            }
            catch (ApiException ex)
            {
                throw new ApiException(ex, ex.StatusCode ?? HttpStatusCode.BadRequest);
            }
        }

        public async Task<CallCentrePartialRefundResponse> PartialRefund(CallCentrePartialRefundRequest request)
        {
            var booking = await GetBooking(request.BookingReference, request.BookingDate.ToDateTime(TimeOnly.MinValue), request.LeadPaxLastName);

            //the main reason why we need this payment is to use its PayMethodCode to issue refund with same reason
            var paymentToRefund = booking.PaymentInfo.PaymentHistory.FirstOrDefault(x => x.PayId == request.PaymentId);

            if (paymentToRefund is null)
            {
                throw new ApiException(ApiExceptionCodes.RefundError, $"Cannot refund payment {request.PaymentId} - payment doesn't exist");
            }

            if (!string.IsNullOrEmpty(paymentToRefund.RefundAgainstId))
            {
                throw new ApiException(ApiExceptionCodes.RefundError, $"Payment {paymentToRefund.PayId} is a refund of a previous payment");
            }

            var customerDetails = new Data.Authentication.CustomerDetails()
            {
                FirstName = booking.Guests?.FirstOrDefault(x => x.IsLead)?.FirstName,
                LastName = booking.Guests?.FirstOrDefault(x => x.IsLead)?.LastName,
                Email = booking.LeadPassenger.Email,
            };

            var refund = await _bookingRefundEligibleService.IsEligibleForCallCentrePartialRefund(booking, paymentToRefund, customerDetails, request.RefundAmount);

            //only refunding credits here
            var creditRefund = refund.Credit;

            if (!creditRefund.IsEligible)
            {
                throw new ApiException(ApiExceptionCodes.RefundError, $"Not eligible for credit refund");
            }

            var customer = await _voucherifyCustomersRepository.GetOrCreate(null, customerDetails);
            var voucherifyCustomerId = customer.SourceId ?? customer.Id;
            var meta = _actions.GetCallCentreCreditMetadata(_voucherSettings.Action.PartialRefund, request.BookingReference, request.CallCentreAgentId, paymentToRefund.CurIso);
            var voucherId = _actions.GetCallCentreId();

            //this is only needed for refunding promo as promo payment settings are looked up based on paymentItem's PayMethodCode
            //however to not complicate logic further doing it for all cases
            var bookingWithSinglePayment = booking.DeepClone();
            bookingWithSinglePayment.PaymentInfo.PaymentHistory = new PaymentHistoryItem[] { paymentToRefund };

            //this method refunds promo based on priorities, but we want to refund specifically from one payment, that's why we are passing bookingWithSinglePayment
            var createdVouchers = await _vouchersService.AddCreditToBooking(voucherifyCustomerId, creditRefund.CreditBreakdown,
                voucherId, bookingWithSinglePayment, meta, false);

            //should always be a single voucher
            var createdVoucher = createdVouchers.Single();

            return new CallCentrePartialRefundResponse() { Reason = createdVoucher.Reason, VoucherId = createdVoucher.Code };
        }

        private async Task<MyCreditInfo> GetUserCredits(string email, string currency, string customerId = null, bool force = false)
        {
            var sourseId = customerId;
            if (customerId == null)
            {
                var customer = await GetCustomerDetails(email);
                sourseId = customer.SourceId ?? customer.Id;
            }

            var credits = await _vouchersService.MyCredits(sourseId, force);

            return credits.GetValueOrDefault(new Currency { Code = currency });
        }

        /// <summary>
        /// Get customer information
        /// </summary>
        /// <param name="email">Customer email.</param>
        /// <param name="throwIfNull">Throw exception if customer not found.</param>
        /// <returns>Customer info</returns>
        private async Task<Customer> GetCustomerDetails(string email, bool throwIfNull = true)
        {
            try
            {
                var customer = (await _voucherifyCustomersRepository.GetCustomersByEmail(email))?.Customers?.FirstOrDefault();
                if (customer == null && throwIfNull)
                {
                    _logger.LogError("Customer {Email} not found", email);
                    throw new ApiException(ApiExceptionCodes.CallCentreUserNotFound, "Customer not found", null, null, HttpStatusCode.BadRequest);
                }
                return customer;
            }
            catch (ApiException ex)
            {
                if (ex.Code.Code == ApiExceptionCodes.VoucherCustomersGet.Code)
                {
                    throw new ApiException(ex, HttpStatusCode.InternalServerError);
                }
                throw;
            }
        }

        /// <summary>
        /// Validate booking reference.
        /// </summary>
        /// <param name="bookingRef">Booking ref</param>
        /// <returns>Booking</returns>
        private async Task<BookingResponse> GetBooking(string bookingRef, DateTime bookingDate, string lastName)
        {
            // Spend credits here
            var booking = await _actions.TryGetBooking(bookingRef, bookingDate, lastName);
            await _actions.ValidateBooking(booking, true);
            return booking;
        }
    }
}
