using easyJet.Holidays.Api.Domain.Data.AmendBooking.Builders;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Factories.PromoCodeBreakDownFactory
{
    public class PromoCodeBreakDownFactory : IPromoCodeBreakDownFactory
    {
        private readonly AtcomSettings _atcomSettings;

        public PromoCodeBreakDownFactory(IOptions<AtcomSettings> atcomSettings)
        {
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
        }

        public PromoCodeBreakDown Create(ValidateAmendBookingResponse amendBookingInfo, BookingResponse bookingResponse)
        {
            var priceBreakdownBuilder = new PromoCodeBreakDownBuilder();

            if (bookingResponse is null)
            {
                return priceBreakdownBuilder;
            }

            var originalPromoCodeData = bookingResponse?.PriceBreakdown?.SingleOrDefault(x => string.Equals(x.Code, _atcomSettings.PromotionsCodeName, StringComparison.OrdinalIgnoreCase));

            if (originalPromoCodeData is null)
            {
                return priceBreakdownBuilder;
            }

            priceBreakdownBuilder
                .WithPromoCodeAppliedOriginally()
                .AddValidationMessages(new List<Errors.ApiError>());

            var newAppliedPromoCodeData = amendBookingInfo?.PriceBreakdown?.SingleOrDefault(x => string.Equals(x.Code, _atcomSettings.PromotionsCodeName, StringComparison.OrdinalIgnoreCase));

            if (amendBookingInfo?.ApiErrors?.Select(x => x.Code).ToHashSet().Intersect(_atcomSettings.PromoCodeErrorCodesToIgnore?.Select(x => x.Key)?.ToHashSet() ?? new HashSet<string>()).Any() == true)
            {
                return priceBreakdownBuilder
                    .AddDue(Math.Abs(originalPromoCodeData.Amount))
                    .SetError();
            }

            if (newAppliedPromoCodeData is null || (amendBookingInfo?.ApiErrors?.Any() ?? false))
            {
                return priceBreakdownBuilder
                     .AddDue(Math.Abs(originalPromoCodeData.Amount))
                     .WithPromoCodeRemoved()
                     .AddValidationMessages(amendBookingInfo?.ApiErrors?.ToList());
            }

            return priceBreakdownBuilder
                .AddDue(newAppliedPromoCodeData.Amount)
                .DetermineUpgrade(amendBookingInfo, bookingResponse, newAppliedPromoCodeData.Amount, originalPromoCodeData.Amount)
                .WithPromoCode(amendBookingInfo?.DiscountCode);
        }
    }
}
