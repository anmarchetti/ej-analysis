using easyJet.Holidays.Api.Domain.Data.Errors;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    [Serializable]
    public class PromoCodeBreakDown
    {
        public PromoCodeBreakDown()
        {

        }
        /// <summary>
        /// Cost due to the promocode invalid for alternative package, negative means there is a discount
        /// </summary>
        public decimal Due { get; set; }

        /// <summary>
        /// Promo code validation error messages
        /// </summary>
        public List<ApiError> Errors { get; set; }
        /// <summary>
        /// Promocode valid for the alternative package
        /// </summary>
        public string PromoCode { get; set; }

        /// <summary>
        /// Status of the promo code from original booking
        /// </summary>
        public PromoCodeStatus PromoCodeStatus { get; set; }

        public static PromoCodeBreakDown Create()
        {
            return new PromoCodeBreakDown();
        }
    }
}
