using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Voucherify.Models.Domain;
using easyJet.Foundation.Voucherify.Models.Domain.Validation;
using easyJet.Foundation.Voucherify.Validator;
using FluentValidation.TestHelper;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.Mappers
{
    public class PromotionValidatorTests
    {
        [Fact]
        public void Constructor_Should_Set_ClassLevelCascadeMode()
        {
            // Arrange
            var cascadeMode = FluentValidation.CascadeMode.Stop;
            var validationRules = new PromotionValidationRules();

            // Act
            var validator = new PromotionValidator(cascadeMode, validationRules);

            // Assert
            Assert.Equal(cascadeMode, validator.ClassLevelCascadeMode);
        }

        [Fact]
        public void Validate_Should_Pass_When_HotelType_Matches_Criteria()
        {
            // Arrange
            var validationRules = new PromotionValidationRules
            {
                HotelTypes = new ValidationRule<List<DatasourceObject>>
                {
                    Criteria = new List<DatasourceObject> { new DatasourceObject { Code = "adu" } },
                    ValidationResult = new ValidationResult("ERR001", () => "invalid hotel type")
                }
            };

            var validator = new PromotionValidator(FluentValidation.CascadeMode.Continue, validationRules);
            var cmsBooking = new ValidateBooking { HotelType = "adu" };

            // Act
            var result = validator.TestValidate(cmsBooking);

            // Assert
            Assert.True(result.IsValid);
        }

        [Fact]
        public void Validate_Should_Fail_When_HotelType_Does_Not_Match_Criteria()
        {
            // Arrange
            var validationRules = new PromotionValidationRules
            {
                HotelTypes = new ValidationRule<List<DatasourceObject>>
                {
                    Criteria = new List<DatasourceObject> { new DatasourceObject { Code = "adu" } },
                    ValidationResult = new ValidationResult("ERR001", () => "invalid hotel type")
                }
            };

            var validator = new PromotionValidator(FluentValidation.CascadeMode.Continue, validationRules);
            var cmsBooking = new ValidateBooking { HotelType = "fam" };

            // Act
            var result = validator.TestValidate(cmsBooking);

            // Assert
            Assert.False(result.IsValid);
            result.ShouldHaveValidationErrorFor(x => x.HotelType)
                .WithErrorMessage("invalid hotel type")
                .WithErrorCode("ERR001");
        }

        [Fact]
        public void Validate_Should_Pass_When_PromoCollections_Matches_Criteria()
        {
            // Arrange
            var validationRules = new PromotionValidationRules
            {
                PromoCollectionCodes = new ValidationRule<IList<PromoCollection>>
                {
                    Criteria = new List<PromoCollection> { new PromoCollection { Key = "lux", PromotionCodes = "EUBX,EUCX" } },
                    ValidationResult = new ValidationResult("ERR001", () => "invalid promo collection")
                }
            };

            var validator = new PromotionValidator(FluentValidation.CascadeMode.Continue, validationRules);
            var cmsBooking = new ValidateBooking { PromoCollectionCode = "EUBX" };

            // Act
            var result = validator.TestValidate(cmsBooking);

            // Assert
            Assert.True(result.IsValid);
        }

        [Fact]
        public void Validate_Should_Fail_When_PromoCollections_Does_Not_Match_Criteria()
        {
            // Arrange
            var validationRules = new PromotionValidationRules
            {
                PromoCollectionCodes = new ValidationRule<IList<PromoCollection>>
                {
                    Criteria = new List<PromoCollection> { new PromoCollection { Key = "lux", PromotionCodes = "EUBX,EUCX" } },
                    ValidationResult = new ValidationResult("ERR001", () => "invalid promo collection")
                }
            };

            var validator = new PromotionValidator(FluentValidation.CascadeMode.Continue, validationRules);
            var cmsBooking = new ValidateBooking { PromoCollectionCode = "not-EUBX" };

            // Act
            var result = validator.TestValidate(cmsBooking);

            // Assert
            Assert.False(result.IsValid);
            result.ShouldHaveValidationErrorFor(x => x.PromoCollectionCode)
                .WithErrorMessage("invalid promo collection")
                .WithErrorCode("ERR001");
        }

        [Fact]
        public void Validate_Should_Pass_When_Destination_Matches_Through_SourceCodes()
        {
            // Arrange
            var validationRules = new PromotionValidationRules
            {
                Destinations = new ValidationRule<List<DatasourceObject>>
                {
                    Criteria = new List<DatasourceObject>
                    {
                        new DatasourceObject
                        {
                            Code = "RESORT-001",
                            SourceCodes = new[] { "HOTEL-001", "HOTEL-002" }
                        }
                    },
                    ValidationResult = new ValidationResult("ERR001", () => "invalid destination")
                }
            };

            var validator = new PromotionValidator(FluentValidation.CascadeMode.Continue, validationRules);
            var cmsBooking = new ValidateBooking
            {
                Destinations = new List<DatasourceObject>
                {
                    new DatasourceObject { Code = "HOTEL-001" }
                }
            };

            // Act
            var result = validator.TestValidate(cmsBooking);

            // Assert
            Assert.True(result.IsValid);
        }
    }
}
