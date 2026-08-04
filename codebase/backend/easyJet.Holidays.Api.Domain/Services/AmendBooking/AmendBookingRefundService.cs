using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using Microsoft.Extensions.Logging;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking
{
    /// <summary>
    /// Amend booking refund service
    /// </summary>
    public class AmendBookingRefundService : IAmendBookingRefundService
    {
        private readonly IBookingRefundEligibleService _bookingRefundEligibleService;
        private readonly IBookingCreditService _bookingCreditService;
        private readonly ILogger<AmendBookingRefundService> _logger;
        private readonly IBookingRepository _bookingRepository;

        /// <summary>
        /// Amend booking refund service ctor 
        /// </summary>
        /// <param name="logger"></param>
        /// <param name="bookingRefundEligibleService"></param>
        /// <param name="bookingRepository"></param>
        public AmendBookingRefundService(IBookingRefundEligibleService bookingRefundEligibleService,
            IBookingRepository bookingRepository, IBookingCreditService bookingCreditService,
            ILogger<AmendBookingRefundService> logger)
        {
            _logger = logger;
            _bookingCreditService = bookingCreditService;
            _bookingRepository = bookingRepository;
            _bookingRefundEligibleService = bookingRefundEligibleService;
        }

        /// <summary>
        /// Refund process 
        /// </summary>
        /// <param name="bookingRequest"></param>
        /// <param name="validateResponse"></param>
        /// <param name="bookingResponse"></param>
        /// <param name="convertType"></param>
        /// <returns></returns>
        public async Task<BookingResponse> ProcessRefund(BookingRequest bookingRequest,
            ValidateAmendBookingResponse validateResponse, BookingResponse bookingResponse, ConvertType convertType)
        {
            //Firstly commit booking changes to Atcom
            //Then carry out refund/credit process
            //If error happens during refund/credit process, user should reach out to the CallCenter
            var finalBookingResponse = await _bookingRepository.CommitAmendBooking(bookingRequest);

            _logger.LogInformation($"Booking was updated successfully: {finalBookingResponse.BookingReference}");

            //if we must return to user amount <= balanceDueAmount, then we should only confirm amending with Atcom
            //and  balanceDueAmount will be automatically reduced by this amount by Atcom.
            if (bookingRequest.PaymentInfo.Amount * (-1) <= validateResponse.PaymentInfo.BalanceDueAmount)
            {
                return finalBookingResponse;
            }

            #region RefundBookingToCashOrCredit

            //balanceDueAmount = 30
            //amount to refund or credit = -50
            //we should return to user only difference = 20, because balanceDueAmount will be charged automatically by Atcom
            var refundAmount = (bookingRequest.PaymentInfo.Amount + bookingResponse.PaymentInfo.BalanceDueAmount) * -1;

            await _bookingCreditService.PartialRefund(bookingResponse, convertType, refundAmount);

            #endregion

            _logger.LogInformation(
                $"Refund action: {convertType} with amount {-(refundAmount)} was completed");

            return finalBookingResponse;
        }

        /// <summary>
        /// Get eligible for partial refund by amount
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        public async Task<EligibleForRefund> EligibleForPartialRefund(AmendBookingPartialRefundRequest request)
        {
            var booking = await _bookingRepository.GetBooking(
                new GetBookingRequest
                {
                    BookingReference = request.BookingReference,
                    Date = request.Date,
                    LastName = request.LastName
                });
            var canBeConverted = await _bookingRefundEligibleService.IsEligibleForPartialRefund(booking, request.RefundAmount, null);
            return canBeConverted;
        }
    }
}
