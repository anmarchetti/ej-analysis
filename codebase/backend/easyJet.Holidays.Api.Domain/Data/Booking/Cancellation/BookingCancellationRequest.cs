#nullable enable
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking.Cancellation
{
    /// <summary>
    /// Request object to cancel a booking
    /// </summary>
    public class BookingCancellationRequest : BookingCancellationRequestBase
    {
        /// <summary>
        /// Option the user choose how to refund the booking
        /// </summary>
        [DataMember(Name = "refundOption")]
        [Required]
        public BookingCancellationRequestRefundOption? RefundOption { get; set; }

        /// <summary>
        /// The hash of the booking breakdown validation
        /// </summary>
        [DataMember(Name = "bookingBreakdownValidationHash")]
        [Required]
        public int BookingBreakdownValidationHash { get; set; }

        /// <summary>
        /// The Source of the request: Web,Contact Centre/Back office Portal,Bulk Tool
        /// </summary>
        [DataMember(Name = "source")]
        [Required]
        public string Source { get; set; } = "Web";
        
        /// <summary>
        /// The agent name who cancelled the booking
        /// </summary>
        [DataMember(Name = "cancellationName")]
        public string? CancellationName { get; set; }
        
        /// <summary>
        /// The cancellation reason
        /// </summary>
        [DataMember(Name = "reason")]
        public CancellationReason? Reason { get; set; }
        
        /// <summary>
        /// The cancellation reason note
        /// </summary>
        [DataMember(Name = "note")]
        public string? Note { get; set; }
    }

    /// <summary>
    /// Option the user choose how to refund the booking
    /// </summary>
    public enum BookingCancellationRequestRefundOption
    {
        /// <summary>
        /// Customer will get no refund
        /// </summary>
        None,

        /// <summary>
        /// Customer will get refund in the original payment methods
        /// </summary>
        OriginalPayment,

        /// <summary>
        /// Customer will get refund in the form of credit
        /// </summary>
        Credit
    }
}