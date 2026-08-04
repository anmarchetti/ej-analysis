using easyJet.Holidays.Api.Domain.Data.Common;
using easyJet.Holidays.External.Cms.Mappers;
using easyJet.Holidays.External.Cms.Models.Promotion;
using FluentAssertions;
using FluentValidation;
using Xunit;

namespace easyJet.Holidays.External.Cms.Tests.Mappers;

public class PromotionCodeValidatorTests
{
    [Fact]
    public void PromotionCodeValidator_ListIsEmpty_PromotionIsValidDateTimRange()
    {
        // Arrange
        var validateBooking = new ValidateCmsBooking()
        {
            BookingDate = new DateTime(2025, 4, 25)
        };

        var promotionCode = GetPromoCode(null, null, true);

        // Act
        var result = new PromotionCodeValidator(CascadeMode.Continue, promotionCode.ValidationRules).Validate(validateBooking);

        // Assert
        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public void PromotionCodeValidator_ListIsNoEmpty_PromotionIsValidDateTimRange()
    {
        // Arrange
        var validateBooking = new ValidateCmsBooking()
        {
            BookingDate = new DateTime(2028, 4, 25)
        };

        var promotionCode = GetPromoCode(null, null, true);

        // Act
        var result = new PromotionCodeValidator(CascadeMode.Continue, promotionCode.ValidationRules).Validate(validateBooking);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().NotBeEmpty();
        result.Errors.Count.Should().Be(1);
        result.Errors[0].ErrorCode.Should().Be(".dateTime-range");
        result.Errors[0].ErrorMessage.Should().Be("dateTime-range-message");
    }


    [Fact]
    public void PromotionCodeValidator_ListIsEmpty_PromotionIsValid()
    {
        // Arrange
        var validateBooking = new ValidateCmsBooking()
        {
            TotalPrice = 2500,
            PerPersonPrice = 100,
        };

        var promotionCode = GetPromoCode(200, 30, false);

        // Act
        var result = new PromotionCodeValidator(CascadeMode.Continue, promotionCode.ValidationRules).Validate(validateBooking);

        // Assert
        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public void PromotionCodeValidator_ListNotEmpty_PromotionIsNotValidMinimumSpendError()
    {
        var validateBooking = new ValidateCmsBooking()
        {
            TotalPrice = 2500,
            PerPersonPrice = 100,
        };

        var promotionCode = GetPromoCode(20000, 30, false);

        // Act
        var result = new PromotionCodeValidator(CascadeMode.Continue, promotionCode.ValidationRules).Validate(validateBooking);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().NotBeEmpty();
        result.Errors.Count.Should().Be(1);
        result.Errors[0].ErrorCode.Should().Be(".total-price");
        result.Errors[0].ErrorMessage.Should().Be("total-price-message");
    }

    [Fact]
    public void PromotionCodeValidator_ListNotEmpty_PromotionIsNotValidPerPersonError()
    {
        var validateBooking = new ValidateCmsBooking()
        {
            TotalPrice = 2500,
            PerPersonPrice = 100,
        };

        var promotionCode = GetPromoCode(null, 500, false);

        // Act
        var result = new PromotionCodeValidator(CascadeMode.Continue, promotionCode.ValidationRules).Validate(validateBooking);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().NotBeEmpty();
        result.Errors.Count.Should().Be(1);
        result.Errors[0].ErrorCode.Should().Be(".per-person-price");
        result.Errors[0].ErrorMessage.Should().Be("per-person-price-message");
    }

    private static PromotionCodeCmsModel GetPromoCode(decimal? totalPrice, decimal? perPersonPrice, bool withDateTimeRule)
    {
        var totalPriceValidationRule = totalPrice != null ? new ValidationRule<decimal?>()
        {
            Criteria = totalPrice,
            ValidationResult = new ValidationResult()
            {
                Code = ".total-price",
                Message = "total-price-message"
            }
        } : null;
        var perPersonValidationRule = perPersonPrice != null
            ? new ValidationRule<decimal?>()
            {
                Criteria = perPersonPrice,
                ValidationResult = new ValidationResult()
                {
                    Code = ".per-person-price", Message = "per-person-price-message"
                }
            }
            : null;
        
        var dateTimeRule = withDateTimeRule ? new ValidationRule<DateTimeRange>()
        {
            Criteria = new DateTimeRange(new DateTime(2025, 01, 01), new DateTime(2026, 01, 01)),
            ValidationResult = new ValidationResult()
            {
                Code = ".dateTime-range", Message = "dateTime-range-message"
            }
        } : null;
        
        return new PromotionCodeCmsModel
        {
            AtcomPromoCode = "test1",
            MinimumSpend = totalPrice ?? 0,
            MinimumSpendPerPerson = perPersonPrice ?? 0,
            DiscountAmountPerBooking = 0.3M,
            PercentageDiscountPerBooking = 0.4M,
            AdultDiscountAmountPerPerson = 0.5M,
            AdultPercentageAmountPerPerson = 0.6M,
            ChildDiscountAmountPerPerson = 0.7M,
            ChildPercentageAmountPerPerson = 0.8M,
            ValidationRules = new PromotionCodeValidationRules()
            {
                DateRangeOfValidity = dateTimeRule,
                TotalPrice = totalPriceValidationRule,
                PerPersonPrice = perPersonValidationRule,
            }
        };
    }
}