using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Builders
{
    public interface IPromoCodeBreakDownBuilder
    {
        PromoCodeBreakDown Build();
        PromoCodeBreakDownBuilder AddValidationMessages(List<ApiError> Errors);
        PromoCodeBreakDownBuilder SetError();
        PromoCodeBreakDownBuilder AddDue(decimal due);
        PromoCodeBreakDownBuilder WithPromoCodeAppliedOriginally();
        PromoCodeBreakDownBuilder WithPromoCodeRemoved();
        PromoCodeBreakDownBuilder DetermineUpgrade(ValidateAmendBookingResponse amendBookingInfo, BookingResponse bookingResponse, decimal newAppliedPromoCodeData, decimal originalPromoCodeData);
        PromoCodeBreakDownBuilder WithPromoCode(string newPromoCode);
    }
}
