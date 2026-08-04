using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.External.Cms.Mappers.PromotionValidators;
using easyJet.Holidays.External.Cms.Models.Common;
using easyJet.Holidays.External.Cms.Models.Promotion;
using FluentValidation.TestHelper;
using Xunit;

namespace easyJet.Holidays.External.Cms.Tests.Mappers
{
    public class PromotionValidatorTests
    {
        [Fact]
        public void Constructor_Should_Set_ClassLevelCascadeMode()
        {
            // Arrange
            var cascadeMode = FluentValidation.CascadeMode.Stop;
            var validationRules = new ValidationRules();

            // Act
            var validator = new PromotionValidator(cascadeMode, validationRules);

            // Assert
            Assert.Equal(cascadeMode, validator.ClassLevelCascadeMode);
        }

        [Fact]
        public void Validate_Should_Pass_When_ValidationRules_Are_Null()
        {
            // Arrange
            var validator = new PromotionValidator(FluentValidation.CascadeMode.Continue, null);
            var cmsBooking = new ValidateCmsBooking();

            // Act
            var result = validator.TestValidate(cmsBooking);

            // Assert
            Assert.True(result.IsValid);
        }

        [Fact]
        public void Validate_Should_Pass_When_HotelType_Matches_Criteria()
        {
            // Arrange
            var validationRules = new ValidationRules
            {
                HotelTypes = new ValidationRule<List<DatasourceObject>>
                {
                    Criteria = [new DatasourceObject { Code = "adu" }],
                    ValidationResult = new ValidationResult { Message = "Invalid hotel type", Code = "ERR001" }
                }
            };

            var validator = new PromotionValidator(FluentValidation.CascadeMode.Continue, validationRules);
            var cmsBooking = new ValidateCmsBooking { HotelType = "adu" };

            // Act
            var result = validator.TestValidate(cmsBooking);

            // Assert
            Assert.True(result.IsValid);
        }

        [Fact]
        public void Validate_Should_Fail_When_HotelType_Does_Not_Match_Criteria()
        {
            // Arrange
            var validationRules = new ValidationRules
            {
                HotelTypes = new ValidationRule<List<DatasourceObject>>
                {
                    Criteria = [new DatasourceObject { Code = "adu" }],
                    ValidationResult = new ValidationResult { Message = "Invalid hotel type", Code = "ERR001" }
                }
            };

            var validator = new PromotionValidator(FluentValidation.CascadeMode.Continue, validationRules);
            var cmsBooking = new ValidateCmsBooking { HotelType = "fam" };

            // Act
            var result = validator.TestValidate(cmsBooking);

            // Assert
            Assert.False(result.IsValid);
            result.ShouldHaveValidationErrorFor(x => x.HotelType)
                .WithErrorMessage("Invalid hotel type")
                .WithErrorCode("ERR001");
        }
        
        [Fact]
        public void Validate_Should_Pass_When_PromoCollection_Matches_Criteria()
        {
            // Arrange
            var validationRules = new ValidationRules
            {
                PromoCollectionCodes = new ValidationRule<List<KeyedPromotion>>
                {
                    Criteria = [new KeyedPromotion(null, "EUBX,EUCX", null, null, null, null, null)],
                    ValidationResult = new ValidationResult { Message = "Invalid promo collection", Code = "ERR001" }
                }
            };

            var validator = new PromotionValidator(FluentValidation.CascadeMode.Continue, validationRules);
            var cmsBooking = new ValidateCmsBooking { PromoCollectionCode = "EUBX" };

            // Act
            var result = validator.TestValidate(cmsBooking);

            // Assert
            Assert.True(result.IsValid);
        }

        [Fact]
        public void Validate_Should_Fail_When_PromoCollectionCode_Does_Not_Match_Criteria()
        {
            // Arrange
            var validationRules = new ValidationRules
            {
                PromoCollectionCodes = new ValidationRule<List<KeyedPromotion>>
                {
                    Criteria = [new KeyedPromotion(null, "EUBX,EUCX", null, null, null, null, null)],
                    ValidationResult = new ValidationResult { Message = "Invalid promo collection", Code = "ERR001" }
                }
            };

            var validator = new PromotionValidator(FluentValidation.CascadeMode.Continue, validationRules);
            var cmsBooking = new ValidateCmsBooking { PromoCollectionCode = "not-EUBX" };

            // Act
            var result = validator.TestValidate(cmsBooking);

            // Assert
            Assert.False(result.IsValid);
            result.ShouldHaveValidationErrorFor(x => x.PromoCollectionCode)
                .WithErrorMessage("Invalid promo collection")
                .WithErrorCode("ERR001");
        }
    }
}