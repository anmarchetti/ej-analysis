using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    /// <summary>
    /// Info modify booking request
    /// </summary>
    [Serializable]
    [DataContract]
    public class AmendInfoBookingRequest : GetBookingRequest, IValidatableObject
    {
        /// <summary>
        /// Collection of new transfers to amend
        /// </summary>
        [DataMember(Name = "transfers")]
        public IEnumerable<TransferItem> Transfers { get; set; }

        /// <summary>
        /// New transport data to amend
        /// </summary>
        [DataMember(Name = "transport")]
        public Transport Transport { get; set; }

        /// <summary>
        /// Gets or sets the passengers.
        /// </summary>
        /// <value>
        /// The passengers.
        /// </value>
        [DataMember(Name = "passengers")]
        public IEnumerable<AmendPersonWithDetails> Pax { get; set; }

        /// <summary>
        /// Seat selection data
        /// </summary>
        [DataMember(Name = "seatSelection")]
        public List<SeatMap> SeatSelection { get; set; }

        /// <summary>
        /// Extra luggage info
        /// </summary>
        [DataMember(Name = "extraLuggageInfo")]
        public ExtraLuggageInfo ExtraLuggageInfo { get; set; }

        /// <summary>
        /// ChangeDate offer config.
        /// </summary>
        [DataMember(Name = "offer")]
        public Offer Offer { get; set; }

        /// <summary>
        /// Room and board selection information
        /// </summary>
        [DataMember(Name = "units")]
        public List<Unit> Units { get; set; }

        /// <summary>
        /// promo code for alternative package
        /// </summary>
        [DataMember(Name = "discountCode")]
        public string DiscountCode { get; set; }

        /// <summary>
        /// Promocode validation result
        /// </summary>
        [DataMember(Name = "promoCodeBreakDown")]
        public PromoCodeBreakDown PromoCodeBreakDown { get; set; }

        /// <summary>
        /// Amend accommodation information
        /// </summary>
        [DataMember(Name = "amendHotelOffer")]
        public AmendHotelOffer AmendHotelOffer { get; set; }

        /// <summary>
        /// Validation
        /// </summary>
        /// <param name="validationContext"></param>
        /// <returns></returns>
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            int optionsToChange = 0;

            if (!Transfers.IsNullOrEmpty())
            {
                optionsToChange++;
            }

            if (Transport != null)
            {
                optionsToChange++;
            }

            if (!SeatSelection.IsNullOrEmpty())
            {
                optionsToChange++;
            }

            if (ExtraLuggageInfo?.Items != null)
            {
                optionsToChange++;
            }

            if (Offer is not null)
            {
                optionsToChange++;
            }

            if (optionsToChange > 1)
            {
                yield return new ValidationResult("Can modify only one option (route, transfer, so on) at a time");
            }
        }
    }
}