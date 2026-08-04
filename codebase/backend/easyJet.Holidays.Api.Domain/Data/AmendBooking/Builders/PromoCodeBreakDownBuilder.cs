using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Builders
{
    public class PromoCodeBreakDownBuilder : IPromoCodeBreakDownBuilder
    {
        private readonly PromoCodeBreakDown PromoCodeBreakDown;

        public PromoCodeBreakDownBuilder()
        {
            this.PromoCodeBreakDown = PromoCodeBreakDown.Create();
        }

        public PromoCodeBreakDown Build()
        {
            return this.PromoCodeBreakDown;
        }

        public PromoCodeBreakDownBuilder AddValidationMessages(List<ApiError> Errors)
        {
            PromoCodeBreakDown.Errors = Errors ?? new();
            return this;
        }

        public PromoCodeBreakDownBuilder AddDue(decimal due)
        {
            PromoCodeBreakDown.Due = due;
            return this;
        }

        public PromoCodeBreakDownBuilder WithPromoCodeAppliedOriginally()
        {
            PromoCodeBreakDown.PromoCodeStatus = PromoCodeStatus.APPLIED_ORIGINALLY;
            return this;
        }

        public PromoCodeBreakDownBuilder WithPromoCodeRemoved()
        {
            PromoCodeBreakDown.PromoCodeStatus = PromoCodeStatus.PROMOCODE_REMOVED;
            return this;
        }

        public PromoCodeBreakDownBuilder DetermineUpgrade(ValidateAmendBookingResponse amendBookingInfo, BookingResponse bookingResponse, decimal newAppliedPromoCodeData, decimal originalPromoCodeData)
        {
            if (amendBookingInfo.DiscountCode.Equals(bookingResponse.DiscountCode, StringComparison.InvariantCultureIgnoreCase))
                return this;

            if (Math.Abs(newAppliedPromoCodeData) > Math.Abs(originalPromoCodeData))
            {
                PromoCodeBreakDown.PromoCodeStatus = PromoCodeStatus.TIER_UPGRADE;
            }
            if (Math.Abs(newAppliedPromoCodeData) < Math.Abs(originalPromoCodeData))
            {
                PromoCodeBreakDown.PromoCodeStatus = PromoCodeStatus.TIER_DOWNGRADE;
            }

            return this;
        }

        public PromoCodeBreakDownBuilder WithPromoCode(string newPromoCode)
        {
            PromoCodeBreakDown.PromoCode = newPromoCode;
            return this;
        }

        public PromoCodeBreakDownBuilder SetError()
        {
            PromoCodeBreakDown.PromoCodeStatus = PromoCodeStatus.ERROR;
            return this;
        }

        public static implicit operator PromoCodeBreakDown(PromoCodeBreakDownBuilder builder) => builder.PromoCodeBreakDown;
    }
}
