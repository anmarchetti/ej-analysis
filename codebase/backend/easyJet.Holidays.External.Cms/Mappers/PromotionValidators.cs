using easyJet.Holidays.External.Cms.Models.Promotion;
using FluentValidation;

namespace easyJet.Holidays.External.Cms.Mappers.PromotionValidators
{
    public class PromotionValidator : AbstractValidator<ValidateCmsBooking>
    {
        public PromotionValidator(CascadeMode cascadeMode, ValidationRules validationRules)
        {
            ClassLevelCascadeMode = cascadeMode;

            if (validationRules == null)
                return;

            // Apply rules if they exist.
            if (validationRules.Airports != null)
            {
                RuleFor(r => r.Airport)
                    .Must(airport => validationRules.Airports.Criteria.Any(x => x.Code == airport))
                    .WithMessage(validationRules.Airports.ValidationResult.Message)
                    .WithErrorCode(validationRules.Airports.ValidationResult.Code);
            }

            if (validationRules.Boards != null)
            {
                RuleFor(r => r.BoardType)
                    .Must(board => validationRules.Boards.Criteria.Any(x => x.Code == board))
                   .WithMessage(validationRules.Boards.ValidationResult.Message)
                   .WithErrorCode(validationRules.Boards.ValidationResult.Code);
            }

            if (validationRules.DateRangeOfValidity != null)
            {
                var dateRange = validationRules.DateRangeOfValidity.Criteria;
                RuleFor(r => r.BookingDate)
                   .Must(bookingData => bookingData > dateRange.From && bookingData < dateRange.To)
                   .WithMessage(validationRules.DateRangeOfValidity.ValidationResult.Message)
                   .WithErrorCode(validationRules.DateRangeOfValidity.ValidationResult.Code);
            }

            if (validationRules.DepartureDate != null)
            {
                var dateRange = validationRules.DepartureDate.Criteria;
                RuleFor(r => r.DepartureDate)
                    .Must(bookingData => bookingData > dateRange.From && bookingData < dateRange.To)
                   .WithMessage(validationRules.DepartureDate.ValidationResult.Message)
                   .WithErrorCode(validationRules.DepartureDate.ValidationResult.Code);
            }

            if (validationRules.ReturnDate != null)
            {
                var dateRange = validationRules.ReturnDate.Criteria;
                RuleFor(r => r.ReturnDate)
                    .Must(bookingData => bookingData > dateRange.From && bookingData < dateRange.To)
                   .WithMessage(validationRules.ReturnDate.ValidationResult.Message)
                   .WithErrorCode(validationRules.ReturnDate.ValidationResult.Code);
            }

            if (validationRules.Destinations != null)
            {
                var criterias = validationRules.Destinations.Criteria;
                RuleFor(r => r.Destinations)
                    .Must(dests => criterias.Exists(criteria => dests.Exists(dest => dest.Code == criteria.Code)))
                   .WithMessage(validationRules.Destinations.ValidationResult.Message)
                   .WithErrorCode(validationRules.Destinations.ValidationResult.Code);
            }

            var isDurationRange = validationRules.MinimumDuration != null && validationRules.MaximumDuration != null;

            if (validationRules.Duration != null)
            {
                RuleFor(r => r.Duration)
                     .Equal(validationRules.Duration.Criteria)
                    .WithMessage(validationRules.Duration.ValidationResult.Message)
                    .WithErrorCode(validationRules.Duration.ValidationResult.Code);
            }
            else if (isDurationRange)
            {
                RuleFor(r => r.Duration)
                 .Must(x => x >= validationRules.MinimumDuration.Criteria && x <= validationRules.MaximumDuration.Criteria)
                .WithMessage(validationRules.DurationRange.ValidationResult.Message)
                .WithErrorCode(validationRules.DurationRange.ValidationResult.Code);
            }
            else if (validationRules.MinimumDuration != null)
            {
                RuleFor(r => r.Duration)
                     .Must(x => x >= validationRules.MinimumDuration.Criteria)
                    .WithMessage(validationRules.MinimumDuration.ValidationResult.Message)
                    .WithErrorCode(validationRules.MinimumDuration.ValidationResult.Code);
            }
            else if (validationRules.MaximumDuration != null)
            {
                RuleFor(r => r.Duration)
                     .Must(x => x <= validationRules.MaximumDuration.Criteria)
                    .WithMessage(validationRules.MaximumDuration.ValidationResult.Message)
                    .WithErrorCode(validationRules.MaximumDuration.ValidationResult.Code);
            }

            if (validationRules.HolidayThemes != null)
            {
                RuleFor(r => r.HolidayTheme)
                   .Must(theme => validationRules.HolidayThemes.Criteria.Any(x => x.Name == theme))
                   .WithMessage(validationRules.HolidayThemes.ValidationResult.Message)
                   .WithErrorCode(validationRules.HolidayThemes.ValidationResult.Code);
            }

            if (validationRules.HolidayTypes != null)
            {
                RuleFor(r => r.HolidayType)
                   .Must(type => validationRules.HolidayTypes.Criteria.Any(x => x.Name == type))
                   .WithMessage(validationRules.HolidayTypes.ValidationResult.Message)
                   .WithErrorCode(validationRules.HolidayTypes.ValidationResult.Code);
            }

            if (validationRules.HotelTypes != null)
            {
                RuleFor(r => r.HotelType)
                    .Must(type => validationRules.HotelTypes.Criteria.Any(x => x.Code == type))
                    .WithMessage(validationRules.HotelTypes.ValidationResult.Message)
                    .WithErrorCode(validationRules.HotelTypes.ValidationResult.Code);
            }
            
            if (validationRules.PromoCollectionCodes != null)
            {
                RuleFor(r => r.PromoCollectionCode)
                    .Must(code => validationRules.PromoCollectionCodes.Criteria != null && 
                                  validationRules.PromoCollectionCodes.Criteria.Any(x => 
                                      x.PromotionCodes != null && x.PromotionCodes.Split(',').Contains(code)))
                    .WithMessage(validationRules.PromoCollectionCodes.ValidationResult.Message)
                    .WithErrorCode(validationRules.PromoCollectionCodes.ValidationResult.Code);
            }

            if (validationRules.NAdults != null)
            {
                RuleFor(r => r.NAdults)
                    .Equal(validationRules.NAdults.Criteria)
                    .WithMessage(validationRules.NAdults.ValidationResult.Message)
                    .WithErrorCode(validationRules.NAdults.ValidationResult.Code);
            }

            if (validationRules.NChildren != null)
            {
                RuleFor(r => r.NChildren)
                    .Equal(validationRules.NChildren.Criteria)
                    .WithMessage(validationRules.NChildren.ValidationResult.Message)
                    .WithErrorCode(validationRules.NChildren.ValidationResult.Code);
            }

            if (validationRules.NInfants != null)
            {
                RuleFor(r => r.NInfants)
                    .Equal(validationRules.NInfants.Criteria)
                    .WithMessage(validationRules.NInfants.ValidationResult.Message)
                    .WithErrorCode(validationRules.NInfants.ValidationResult.Code);
            }
        }
    }
}