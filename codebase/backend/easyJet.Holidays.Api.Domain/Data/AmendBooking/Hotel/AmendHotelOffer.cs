#nullable enable

using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel
{
    /// <summary>
    /// Representing alternative hotel offer
    /// </summary>
    [Serializable]
    public class AmendHotelOffer
    {
        /// <summary>
        /// ctor
        /// </summary>
        public AmendHotelOffer()
        {
            Accom = new Accom();
            Transfers = [];
            Hotel = new OfferHotel();
            AmendmentChargesInfo = new AmendmentChargesInfo();
        }

        /// <summary>
        /// Accommodation details
        /// </summary>
        [DataMember(Name = "accom")]
        public Accom Accom { get; set; }

        /// <summary>
        /// Collection of offer transfers
        /// </summary>
        [DataMember(Name = "transfer")]
        public IList<TransferItem> Transfers { get; set; }

        /// <summary>
        /// Hotel information
        /// </summary>
        [DataMember(Name = "hotel")]
        public OfferHotel Hotel { get; set; }

        /// <summary>
        /// Amendment charges info
        /// </summary>
        [DataMember(Name = "amendmentCharges")]
        public AmendmentChargesInfo AmendmentChargesInfo { get; set; }

        /// <summary>
        /// Amend payment info, not returned from amend-hotel/hotel-list endpoint
        /// </summary>
        [DataMember(Name = "amendmentPaymentInfo")]
        public AmendmentPaymentInfo? AmendmentPaymentInfo { get; set; }
        
        /// <summary>
        /// taxes and fees for tourist taxes mapped for manage flow
        /// </summary>
        [DataMember(Name = "taxesAndFees")]
        public List<TaxesAndFees>? TaxesAndFees { get; set; }
    }
}
