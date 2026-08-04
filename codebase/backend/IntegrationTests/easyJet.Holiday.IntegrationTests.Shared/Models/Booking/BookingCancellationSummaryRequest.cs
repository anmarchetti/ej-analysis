using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using System.Runtime.Serialization;

namespace easyJet.Holiday.IntegrationTests.Shared.Models.Booking
{
    public class BookingCancellationSummaryRequest : easyJet.Holidays.Api.Domain.Data.Booking.Cancellation.BookingCancellationSummaryRequest
    {
        [DataMember(Name = "customerCredentials")]
        public CustomerCredentials? CustomerCredentials { get; set; }
    }
    
    public class BookingCancellationWithFeeOverrideRequest : easyJet.Holidays.Api.Domain.Data.Booking.Cancellation.BookingCancellationWithFeeOverrideRequest
    {
        [DataMember(Name = "customerCredentials")]
        public CustomerCredentials? CustomerCredentials { get; set; }
    }

    public sealed class BookingCancellationSummaryResponse
    {
        /// <summary>
        /// List of possible refunds
        /// </summary>
        public IReadOnlyCollection<BookingCancellationSummaryRefundDetail> Refunds { get; init; } =
            new List<BookingCancellationSummaryRefundDetail>();

        /// <summary>
        /// Refund currency
        /// </summary>
        public string? Currency { get; init; }
        
        /// <summary>
        /// The hash to validate the cancellation
        /// </summary>
        public int RefundBreakdownValidationHash { get; init; }
    }

    public class BookingCancellationSummaryRefundDetail
    {
        /// <summary>
        /// Refund type
        /// </summary>
        public BookingCancellationRequestRefundOption RefundOption { get; init; }
        /// <summary>
        /// One time use credit amount
        /// </summary>
        public decimal OneTimeUseCredit { get; init; }
        /// <summary>
        /// Total amount
        /// </summary>
        public decimal Total { get; init; }
        public decimal? Credit { get; init; }
        public decimal? OriginalPayment { get; init; }

    }
}
