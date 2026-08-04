using easyJet.Foundation.Voucherify.Models.Domain;
using easyJet.Foundation.Voucherify.Validator;
using FluentAssertions;
using FluentValidation;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.Validator
{
    public class PromotionValidatorTests
    {
        [Fact]
        public void PromotionValidator_ListIsEmpty_PromotionIsValid()
        {
            // Arrange
            var validateBooking = new ValidateBooking()
            {
                Duration = 8
            };

            var promotion = GetPromo(true, true);

            // Act
            var result = new PromotionValidator(CascadeMode.Continue, promotion.ValidationRules).Validate(validateBooking);

            // Assert
            result.IsValid.Should().BeTrue();
            result.Errors.Should().BeEmpty();
        }

        [Fact]
        public void PromotionValidator_ListIsNotEmpty_PromotionIsNotValidDurationError()
        {
            // Arrange
            var validateBooking = new ValidateBooking()
            {
                Duration = 12,
            };

            var promotion = GetPromo(true, true);

            // Act
            var result = new PromotionValidator(CascadeMode.Continue, promotion.ValidationRules).Validate(validateBooking);

            // Assert
            result.IsValid.Should().BeFalse();
            result.Errors.Should().NotBeEmpty();
            result.Errors.Count.Should().Be(1);
            result.Errors[0].ErrorMessage.Should().Be(".durationRangeErrorCode");
        }

        [Fact]
        public void PromotionValidator_ListIsNotEmpty_PromotionIsNotValidMinimumDurationError()
        {
            // Arrange
            var validateBooking = new ValidateBooking()
            {
                Duration = 3,
            };

            var promotion = GetPromo(true, false);

            // Act
            var result = new PromotionValidator(CascadeMode.Continue, promotion.ValidationRules).Validate(validateBooking);

            // Assert
            result.IsValid.Should().BeFalse();
            result.Errors.Should().NotBeEmpty();
            result.Errors.Count.Should().Be(1);
            result.Errors[0].ErrorMessage.Should().Be(".minimumDurationErrorCode");
        }

        [Fact]
        public void PromotionValidator_ListIsNotEmpty_PromotionIsNotValidMaximumDurationError()
        {
            // Arrange
            var validateBooking = new ValidateBooking()
            {
                Duration = 12,
            };

            var promotion = GetPromo(false, true);

            // Act
            var result = new PromotionValidator(CascadeMode.Continue, promotion.ValidationRules).Validate(validateBooking);

            // Assert
            result.IsValid.Should().BeFalse();
            result.Errors.Should().NotBeEmpty();
            result.Errors.Count.Should().Be(1);
            result.Errors[0].ErrorMessage.Should().Be(".maximumDurationErrorCode");
        }

        private static Promotion GetPromo(bool initMinimumDuration, bool initMaximumDuration)
        {
            var minimumDuration = initMinimumDuration ? "7" : string.Empty;
            var maximumDuration = initMaximumDuration ? "10" : string.Empty;
            var promotionItem = new FakeItem()
                .WithTemplate(Templates.Promotion.Id)
                .WithField(Templates.Promotion.Fields.CustomerPromoCode, "customerPromoCode")
                .WithField(Templates.Promotion.Fields.DurationRangeErrorCode, "durationRangeErrorCode")
                .WithField(Templates.Promotion.FieldsIds.MinimumDuration, minimumDuration)
                .WithField(Templates.Promotion.Fields.MinimumDurationErrorCode, "minimumDurationErrorCode")
                .WithField(Templates.Promotion.FieldsIds.MaximumDuration, maximumDuration)
                .WithField(Templates.Promotion.Fields.MaximumDurationErrorCode, "maximumDurationErrorCode")
                .ToSitecoreItem();

            var promotion = new Promotion(promotionItem);
            return promotion;
        }
    }
}