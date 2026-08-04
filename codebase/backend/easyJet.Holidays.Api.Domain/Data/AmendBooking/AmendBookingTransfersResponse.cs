using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Settings;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    [Serializable]
    [DataContract]
    public class AmendBookingTransfersResponse
    {
        /// <summary>
        /// Transfers with amend charges
        /// </summary>
        [DataMember(Name = "transfers")]
        [Required]
        public IEnumerable<AmendTransferItem> Transfers { get; set; }
    }

    public class AmendTransferItem
    {
        [DataMember]
        public decimal? AmendmentCharges { get; set; }

        [DataMember]
        public Currency Currency { get; set; }

        [DataMember]
        public TransferItem Transfer { get; set; }

        [DataMember]
        public PromoCodeBreakDown PromoCodeBreakDown { get; set; }

        /// <summary>
        /// Amend payment info
        /// </summary>
        [DataMember]
        public AmendmentPaymentInfo AmendmentPaymentInfo { get; set; }
    }
}