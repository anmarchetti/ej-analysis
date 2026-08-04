using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using Microsoft.Extensions.Logging;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;

namespace easyJet.Holidays.Api.Domain.Services.Booking
{
    public class VoucherPaymentFlowService : IVoucherPaymentFlowService
    {
        private readonly IBookingPaymentsRepository _bookingPaymentsRepository;
        private readonly IVouchersService _vouchersService;
        private readonly ILogger<VoucherPaymentFlowService> _logger;

        public VoucherPaymentFlowService(
            ILogger<VoucherPaymentFlowService> logger,
            IBookingPaymentsRepository bookingPaymentsRepository,
            IVouchersService vouchersService
            )
        {
            _bookingPaymentsRepository = bookingPaymentsRepository;
            _logger = logger;
            _vouchersService = vouchersService;
        }

        /// <inheritdoc />
        public virtual async Task<List<CreditSpend>> Redeem(decimal amount, string currency, string bookingReference, string accomCode, string bookingMarketCode, string customerId = null, RedemptionMetadata redemptionMetadata = null)
        {
            return await _vouchersService.SpendCredits(amount, new Currency { Code = currency }, bookingReference, accomCode, bookingMarketCode, customerId, redemptionMetadata);
        }

        /// <inheritdoc />
        public virtual async Task<List<CreditSpend>> RedeemFiltered(decimal amount, string currency, string bookingReference, string accomCode, string bookingMarketCode, string customerId = null, RedemptionMetadata redemptionMetadata = null)
        {
            return await _vouchersService.SpendFilteredCredits(amount, new Currency { Code = currency }, bookingReference, accomCode, bookingMarketCode, customerId, redemptionMetadata);
        }

        /// <inheritdoc />
        public virtual async Task AddPaymentInfo(List<CreditSpend> spendVoucherResults, LeadPassenger leadPassenger, string bookingReference, string bookingMarket, string bookingLanguage, string sessionId, string requestId, IList<string> promotionCollections)
        {
            if (!spendVoucherResults.Any()) return;

            // Add credit payment
            foreach (var spendResult in spendVoucherResults)
            {
                await _bookingPaymentsRepository.AddCreditPaymentInfo(spendResult.ReasonCode, spendResult.Amount, leadPassenger, bookingReference, bookingMarket, bookingLanguage, spendResult.VouchersIds, sessionId, requestId, promotionCollections);
            }
        }

        /// <inheritdoc />
        public virtual async Task<ApiException> Rollback(List<CreditSpend> spendVoucherResults, string customerId = null)
        {
            ApiException ex = null;
            if (spendVoucherResults?.Count() > 0)
            {
                try
                {
                    await _vouchersService.RollBackCreditRedemptions(spendVoucherResults.Select(x => x.RedemptionIds), "Failed to cancel payment after commit failure", customerId);
                }
                catch (ApiException e)
                {
                    _logger.LogError(e, "Failed to rollback redemption");
                    ex = e;
                }
            }

            return ex;
        }
    }
}