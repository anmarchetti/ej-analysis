using System.Linq;
using easyJet.Foundation.Voucherify.Models.Domain;
using easyJet.Foundation.Voucherify.Models.Domain.Validation;
using FluentValidation;

namespace easyJet.Foundation.Voucherify.Validator
{
    public class PromotionValidator : AbstractValidator<ValidateBooking>
    {
        public PromotionValidator(CascadeMode cascadeMode, PromotionValidationRules promotionValidationRules)
        {
            ClassLevelCascadeMode = cascadeMode;

            // Apply rules if they exist.
            TryInitDepartureAndDestinationsAirportsRule(promotionValidationRules);
            TryInitBoardRules(promotionValidationRules);
            TryInitDatesRules(promotionValidationRules);
            TryInitDurationRules(promotionValidationRules);
            TryInitThemeAndTypesRules(promotionValidationRules);
            TryInitPaxMixRules(promotionValidationRules);
            TryInitPromoCollections(promotionValidationRules);
        }

        private void TryInitBoardRules(PromotionValidationRules promotionValidationRules)
        {
            if (promotionValidationRules.Boards != null)
            {
                RuleFor(r => r.BoardType)
                    .Must(board => promotionValidationRules.Boards.Criteria.Any(x => x.Code == board))
                    .WithMessage(promotionValidationRules.Boards.ValidationResult.Message)
                    .WithErrorCode(promotionValidationRules.Boards.ValidationResult.Code);
            }
        }

        private void TryInitDepartureAndDestinationsAirportsRule(PromotionValidationRules promotionValidationRules)
        {
            if (promotionValidationRules.Airports != null)
            {
                RuleFor(r => r.Airport)
                    .Must(airport => promotionValidationRules.Airports.Criteria.Any(x => x.Code == airport))
                    .WithMessage(promotionValidationRules.Airports.ValidationResult.Message)
                    .WithErrorCode(promotionValidationRules.Airports.ValidationResult.Code);
            }

            if (promotionValidationRules.Destinations != null)
            {
                var criterias = promotionValidationRules.Destinations.Criteria;
                RuleFor(r => r.Destinations)
                    .Must(dests => criterias.Exists(criteria => dests.Exists(dest => dest.Code == criteria.Code || criteria.SourceCodes.Contains(dest.Code))))
                    .WithMessage(promotionValidationRules.Destinations.ValidationResult.Message)
                    .WithErrorCode(promotionValidationRules.Destinations.ValidationResult.Code);
            }
        }

        private void TryInitDatesRules(PromotionValidationRules promotionValidationRules)
        {
            if (promotionValidationRules.DateRangeOfValidity != null)
            {
                var dateRange = promotionValidationRules.DateRangeOfValidity.Criteria;
                RuleFor(r => r.BookingDate)
                    .Must(bookingData => bookingData > dateRange.From && bookingData < dateRange.To)
                    .WithMessage(promotionValidationRules.DateRangeOfValidity.ValidationResult.Message)
                    .WithErrorCode(promotionValidationRules.DateRangeOfValidity.ValidationResult.Code);
            }

            if (promotionValidationRules.DepartureDate != null)
            {
                var dateRange = promotionValidationRules.DepartureDate.Criteria;
                RuleFor(r => r.DepartureDate)
                    .Must(bookingData => bookingData > dateRange.From && bookingData < dateRange.To)
                    .WithMessage(promotionValidationRules.DepartureDate.ValidationResult.Message)
                    .WithErrorCode(promotionValidationRules.DepartureDate.ValidationResult.Code);
            }

            if (promotionValidationRules.ReturnDate != null)
            {
                var dateRange = promotionValidationRules.ReturnDate.Criteria;
                RuleFor(r => r.ReturnDate)
                    .Must(bookingData => bookingData > dateRange.From && bookingData < dateRange.To)
                    .WithMessage(promotionValidationRules.ReturnDate.ValidationResult.Message)
                    .WithErrorCode(promotionValidationRules.ReturnDate.ValidationResult.Code);
            }
        }

        private void TryInitDurationRules(PromotionValidationRules promotionValidationRules)
        {
            var isDurationRange = promotionValidationRules.MinimumDuration != null && promotionValidationRules.MaximumDuration != null;

            if (promotionValidationRules.Duration != null)
            {
                RuleFor(r => r.Duration)
                    .Equal(promotionValidationRules.Duration.Criteria)
                    .WithMessage(promotionValidationRules.Duration.ValidationResult.Message)
                    .WithErrorCode(promotionValidationRules.Duration.ValidationResult.Code);
            }
            else if (isDurationRange)
            {
                RuleFor(r => r.Duration)
                    .Must(x => x >= promotionValidationRules.MinimumDuration.Criteria && x <= promotionValidationRules.MaximumDuration.Criteria)
                    .WithMessage(promotionValidationRules.DurationRange.ValidationResult.Message)
                    .WithErrorCode(promotionValidationRules.DurationRange.ValidationResult.Code);
            }
            else if (promotionValidationRules.MinimumDuration != null)
            {
                RuleFor(r => r.Duration)
                    .Must(x => x >= promotionValidationRules.MinimumDuration.Criteria)
                    .WithMessage(promotionValidationRules.MinimumDuration.ValidationResult.Message)
                    .WithErrorCode(promotionValidationRules.MinimumDuration.ValidationResult.Code);
            }
            else if (promotionValidationRules.MaximumDuration != null)
            {
                RuleFor(r => r.Duration)
                    .Must(x => x <= promotionValidationRules.MaximumDuration.Criteria)
                    .WithMessage(promotionValidationRules.MaximumDuration.ValidationResult.Message)
                    .WithErrorCode(promotionValidationRules.MaximumDuration.ValidationResult.Code);
            }
        }

        private void TryInitPaxMixRules(PromotionValidationRules promotionValidationRules)
        {
            if (promotionValidationRules.NAdults != null)
            {
                RuleFor(r => r.NAdults)
                    .Equal(promotionValidationRules.NAdults.Criteria)
                    .WithMessage(promotionValidationRules.NAdults.ValidationResult.Message)
                    .WithErrorCode(promotionValidationRules.NAdults.ValidationResult.Code);
            }

            if (promotionValidationRules.NChildren != null)
            {
                RuleFor(r => r.NChildren)
                    .Equal(promotionValidationRules.NChildren.Criteria)
                    .WithMessage(promotionValidationRules.NChildren.ValidationResult.Message)
                    .WithErrorCode(promotionValidationRules.NChildren.ValidationResult.Code);
            }

            if (promotionValidationRules.NInfants != null)
            {
                RuleFor(r => r.NInfants)
                    .Equal(promotionValidationRules.NInfants.Criteria)
                    .WithMessage(promotionValidationRules.NInfants.ValidationResult.Message)
                    .WithErrorCode(promotionValidationRules.NInfants.ValidationResult.Code);
            }
        }

        private void TryInitThemeAndTypesRules(PromotionValidationRules promotionValidationRules)
        {
            if (promotionValidationRules.HolidayThemes != null)
            {
                RuleFor(r => r.HolidayTheme)
                    .Must(theme => promotionValidationRules.HolidayThemes.Criteria.Any(x => x.Name == theme))
                    .WithMessage(promotionValidationRules.HolidayThemes.ValidationResult.Message)
                    .WithErrorCode(promotionValidationRules.HolidayThemes.ValidationResult.Code);
            }

            if (promotionValidationRules.HolidayTypes != null)
            {
                RuleFor(r => r.HolidayType)
                    .Must(type => promotionValidationRules.HolidayTypes.Criteria.Any(x => x.Name == type))
                    .WithMessage(promotionValidationRules.HolidayTypes.ValidationResult.Message)
                    .WithErrorCode(promotionValidationRules.HolidayTypes.ValidationResult.Code);
            }

            if (promotionValidationRules.HotelTypes != null)
            {
                RuleFor(r => r.HotelType)
                    .Must(type => promotionValidationRules.HotelTypes.Criteria.Any(x => x.Code == type))
                    .WithMessage(promotionValidationRules.HotelTypes.ValidationResult.Message)
                    .WithErrorCode(promotionValidationRules.HotelTypes.ValidationResult.Code);
            }
        }

        private void TryInitPromoCollections(PromotionValidationRules promotionValidationRules)
        {
            if (promotionValidationRules.PromoCollectionCodes != null)
            {
                RuleFor(r => r.PromoCollectionCode)
                    .Must(code => promotionValidationRules.PromoCollectionCodes.Criteria != null &&
                                  promotionValidationRules.PromoCollectionCodes.Criteria.Any(x =>
                                      x.PromotionCodes != null && x.PromotionCodes.Split(',').Contains(code)))
                    .WithMessage(promotionValidationRules.PromoCollectionCodes.ValidationResult.Message)
                    .WithErrorCode(promotionValidationRules.PromoCollectionCodes.ValidationResult.Code);
            }
        }
    }
}