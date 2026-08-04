using System;
using System.Globalization;
using easyJet.Foundation.Voucherify.Models.Domain;
using easyJet.Foundation.Voucherify.Validator;
using FluentAssertions;
using FluentValidation;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.Validator
{
    public class PromotionCodeValidatorTests
    {
        [Fact]
        public void PromotionCodeValidator_ListIsEmpty_PromotionIsValidDateTimRange()
        {
            // Arrange
            var validateBooking = new ValidateBooking()
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
            var validateBooking = new ValidateBooking()
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
            result.Errors[0].ErrorMessage.Should().Be(".dateRangeOfValidityError");
        }

        [Fact]
        public void PromotionCodeValidator_ListIsEmpty_PromotionIsValid()
        {
            // Arrange
            var validateBooking = new ValidateBooking()
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
            var validateBooking = new ValidateBooking()
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
            result.Errors[0].ErrorMessage.Should().Be(".minimumPriceError");
        }

        [Fact]
        public void PromotionCodeValidator_ListNotEmpty_PromotionIsNotValidPerPersonError()
        {
            var validateBooking = new ValidateBooking()
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
            result.Errors[0].ErrorMessage.Should().Be(".per-personPriceError");
        }

        private static PromotionCode GetPromoCode(decimal? totalPrice, decimal? perPersonPrice, bool withDate)
        {
            var parentItem = new FakeItem()
                .WithTemplate(Templates.PromotionCodeConfiguration.Id)
                .WithField(Templates.Promotion.Fields.MinimumPriceErrorCode, "minimumPriceError")
                .WithField(Templates.Promotion.Fields.PerPersonPriceErrorCode, "per-personPriceError")
                .WithField(Templates.Promotion.Fields.DateRangeOfValidityErrorCode, "dateRangeOfValidityError");

            var item = new FakeItem()
                .WithTemplate(Templates.PromotionCodeConfiguration.Id)
                .WithField(Templates.Promotion.Fields.DateValidityFrom, withDate ? "2025011T153045Z" : null)
                .WithField(Templates.Promotion.Fields.DateValidityTo, withDate ? "20260814T153045Z" : null)
                .WithField(Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode, "test1")
                .WithField(Templates.PromotionCodeConfiguration.Fields.MinimumSpend, totalPrice?.ToString(CultureInfo.InvariantCulture))
                .WithField(Templates.PromotionCodeConfiguration.Fields.MinimumSpendPerPerson, perPersonPrice?.ToString(CultureInfo.InvariantCulture))
                .WithField(Templates.PromotionCodeConfiguration.Fields.DiscountAmountPerBooking, "0.3")
                .WithField(Templates.PromotionCodeConfiguration.Fields.PercentageDiscountPerBooking, "0.4")
                .WithField(Templates.PromotionCodeConfiguration.Fields.AdultDiscountAmountPerPerson, "0.5")
                .WithField(Templates.PromotionCodeConfiguration.Fields.AdultPercentageAmountPerPerson, "0.6")
                .WithField(Templates.PromotionCodeConfiguration.Fields.ChildDiscountAmountPerPerson, "0.7")
                .WithField(Templates.PromotionCodeConfiguration.Fields.ChildPercentageAmountPerPerson, "0.8")
                .WithParent(parentItem)
                .WithField(Sitecore.FieldIDs.Sortorder, "10")
                .ToSitecoreItem();

            var promotionCode = new PromotionCode(item, parentItem);

            return promotionCode;
        }
    }
}