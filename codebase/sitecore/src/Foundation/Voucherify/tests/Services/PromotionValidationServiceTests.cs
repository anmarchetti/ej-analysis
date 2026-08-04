using System;
using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Voucherify.Mappers;
using easyJet.Foundation.Voucherify.Models.Domain;
using easyJet.Foundation.Voucherify.Models.Domain.Validation;
using easyJet.Foundation.Voucherify.Models.Requests;
using easyJet.Foundation.Voucherify.Services;
using easyJet.Foundation.Voucherify.Validator;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.Services
{
    public class PromotionValidationServiceTests
    {
        private readonly IValidateBookingRequestMapper validateBookingRequestMapper;
        private IPromotionValidationService validationService;

        public PromotionValidationServiceTests()
        {
            validateBookingRequestMapper = Substitute.For<IValidateBookingRequestMapper>();
            validationService = new PromotionValidationService(validateBookingRequestMapper);
        }

        [Fact]
        public void Validate_ShouldReturnValidationResults_IfPromotionIsNotValid()
        {
            // Arrange
            var promotion = new Promotion(null)
            {
                ValidationRules = new PromotionValidationRules()
                {
                    Airports = new ValidationRule<List<DatasourceObject>>()
                    {
                        Criteria = new List<DatasourceObject>()
                        {
                            new DatasourceObject()
                            {
                                Code = "LGW",
                                Name = "London Gatwik"
                            }
                        },
                        ValidationResult = new ValidationResult("INVALID_AIRPORT", () => "Invalid airport")
                    }
                }
            };

            var validateBooking = new ValidateBooking()
            {
                Airport = "LTN"
            };

            // Act
            var actual = validationService.Validate(promotion, validateBooking);

            // Assert
            actual.Count.Should().Be(1);
            actual[0].Code.Should().Be("INVALID_AIRPORT");
            actual[0].Message.Should().Be("Invalid airport");
        }

        [Fact]
        public void Validate_ShouldReturnValidationResults_IfPromotionCodeIsNotValid()
        {
            // Arrange
            var promotion = new Promotion(null)
            {
                ValidationRules = new PromotionValidationRules { },
                PromotionCodes = new[]
                {
                    new PromotionCode
                    {
                        ValidationRules = new PromotionCodeValidationRules()
                        {
                            TotalPrice = new ValidationRule<decimal?>
                            {
                                Criteria = 300,
                                ValidationResult = new ValidationResult("InvalidPrice", () => "Invalid price")
                            },
                        }
                    }
                }
            };

            var validateBooking = new ValidateBooking()
            {
                TotalPrice = 200,
            };

            // Act
            var actual = validationService.Validate(promotion.PromotionCodes[0], validateBooking);

            // Assert
            actual.Count.Should().Be(1);
            actual[0].Code.Should().Be("InvalidPrice");
            actual[0].Message.Should().Be("Invalid price");
        }

        [Fact]
        public void Validate_ShouldBeEmptyValidationResults_IfBookingIsNotValid()
        {
            // Arrange
            var promotion = new Promotion(null)
            {
                ValidationRules = new PromotionValidationRules()
                {
                    Airports = new ValidationRule<List<DatasourceObject>>()
                    {
                        Criteria = new List<DatasourceObject>()
                        {
                            new DatasourceObject()
                            {
                                Code = "LGW",
                                Name = "London Gatwik"
                            }
                        },
                        ValidationResult = new ValidationResult("INVALID_AIRPORT", () => "Invalid airport")
                    }
                }
            };

            var validateBooking = new ValidateBooking()
            {
                Airport = "LGW"
            };

            // Act
            var actual = validationService.Validate(promotion, validateBooking);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void Validate_ShouldBeNotBeEmpty_IfBookingIsValid(PromotionValidationRules rules)
        {
            // Arrange
            var validateBooking = new ValidateBooking()
            {
                Destinations = new List<DatasourceObject>()
            };

            var promotion = new Promotion(null)
            {
                ValidationRules = rules,
                PromotionCodes = new[] { new PromotionCode() { AtcomPromoCode = "test" } }
            };

            // Act
            var actual = validationService.Validate(promotion, validateBooking);

            // Assert
            actual.Should().NotBeNull();
        }

        [Theory]
        [AutoData]
        public void Validate_ShouldReturnValidationResult_IfPromotionWasFound(string promotionTitle, ID id, PromotionValidationRules promotionValidationRules, ValidateBooking validateBooking)
        {
            // Assert
            Promotion promotion = new Promotion(null)
            {
                Title = promotionTitle,
                Id = id.ToString(),
                ValidationRules = promotionValidationRules,
                PromotionCodes = new[] { new PromotionCode() { AtcomPromoCode = "test" } }
            };

            validateBooking.BookingDate = null;

            // Act
            var actual = validationService.Validate(promotion, validateBooking);

            // Assert
            actual.First().Should().NotBeNull();
        }

        [Theory]
        [AutoData]
        public void ValidateBooking_ShouldReturnFailedValidationResults_IfPromoIsNotValid(
            string promoId,
            string promoCode,
            string title,
            ValidateBookingRequest validateBookingRequest)
        {
            // Arrange
            var promotion = new Promotion(null)
            {
                Id = promoId,
                Title = title,
                ValidationRules = new PromotionValidationRules()
                {
                    Airports = new ValidationRule<List<DatasourceObject>>()
                    {
                        Criteria = new List<DatasourceObject>()
                        {
                            new DatasourceObject()
                            {
                                Code = "LGW",
                            }
                        },
                        ValidationResult = new ValidationResult("ERROR-01", () => "Airport is wrong")
                    }
                },
                PromotionCodes = new PromotionCode[] { },
            };

            var validateBooking = new ValidateBooking()
            {
                Airport = "LTN",
                VoucherCode = promoCode,
                Id = promoId
            };

            var promotions = new List<Promotion> { promotion };

            validateBookingRequestMapper.MapFromValidateBookingRequest(Arg.Any<ValidateBookingRequest[]>()).Returns(new ValidateBooking[] { validateBooking });

            // Act
            var actual = validationService.ValidateBooking(validateBookingRequest, promotions);

            // Assert
            actual.ValidationResults.Should().NotBeNull();
        }

        [Theory]
        [AutoData]
        public void ValidateBooking_ShouldReturnEmptyValidationResults_IfPromoIsValid(
          string promoId,
          string promoCode,
          string title,
          ValidateBookingRequest validateBookingRequest)
        {
            // Arrange
            var promotion = new Promotion(null)
            {
                Id = promoId,
                Title = title,
                ValidationRules = new PromotionValidationRules(),
                PromotionCodes = new[]
                {
                    new PromotionCode()
                    {
                        AtcomPromoCode = "test",
                        ValidationRules = new PromotionCodeValidationRules()
                    }
                }
            };

            var promotions = new List<Promotion> { promotion };

            var validateBooking = new ValidateBooking()
            {
                VoucherCode = promoCode,
                Id = promoId
            };

            validateBookingRequestMapper.MapFromValidateBookingRequest(Arg.Any<ValidateBookingRequest[]>()).Returns(new ValidateBooking[] { validateBooking });

            // Act
            var actual = validationService.ValidateBooking(validateBookingRequest, promotions);

            // Assert
            actual.ValidationResults.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void ValidateBooking_ShouldReturnEmptyValidationResults_IfPromoCodeIsNotValid(
            string promoId,
            string promoCode,
            string title,
            ValidateBookingRequest validateBookingRequest)
        {
            // Arrange
            var promotion = new Promotion(null)
            {
                Id = promoId,
                Title = title,
                ValidationRules = new PromotionValidationRules(),
                PromotionCodes = new[]
                {
                    new PromotionCode()
                    {
                        AtcomPromoCode = "test",
                        ValidationRules = new PromotionCodeValidationRules()
                        {
                            TotalPrice = new ValidationRule<decimal?>
                            {
                                Criteria = 300,
                                ValidationResult = new ValidationResult("InvalidPrice", () => "Invalid price")
                            },
                        }
                    }
                }
            };

            var promotions = new List<Promotion> { promotion };

            var validateBooking = new ValidateBooking()
            {
                VoucherCode = promoCode,
                Id = promoId,
                TotalPrice = 200,
            };

            validateBookingRequestMapper.MapFromValidateBookingRequest(Arg.Any<ValidateBookingRequest[]>()).Returns(new ValidateBooking[] { validateBooking });

            // Act
            var actual = validationService.ValidateBooking(validateBookingRequest, promotions);

            // Assert
            actual.ValidationResults.Should().NotBeEmpty();
        }

        [Theory]
        [AutoData]
        public void ValidateBooking_ShouldReturnEmptyValidationResults_DateRangeRuleNull(
            string promoId,
            string promoCode,
            string title,
            ValidateBookingRequest validateBookingRequest)
        {
            // Arrange
            var promotion = new Promotion(null)
            {
                Id = promoId,
                Title = title,
                ValidationRules = new PromotionValidationRules(),
                PromotionCodes = new[]
                {
                    new PromotionCode()
                    {
                        AtcomPromoCode = "test",
                        ValidationRules = new PromotionCodeValidationRules()
                        {
                            DateRangeOfValidity = null,
                        }
                    }
                }
            };
            var promotions = new List<Promotion> { promotion };

            var validateBooking = new ValidateBooking()
            {
                VoucherCode = promoCode,
                Id = promoId
            };

            validateBookingRequestMapper.MapFromValidateBookingRequest(Arg.Any<ValidateBookingRequest[]>()).Returns(new ValidateBooking[] { validateBooking });

            // Act
            var actual = validationService.ValidateBooking(validateBookingRequest, promotions);

            // Assert
            actual.ValidationResults.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void ValidateBooking_ShouldReturnEmptyValidationResults_DateRangeRuleIsValid(
            string promoId,
            string promoCode,
            string title,
            ValidateBookingRequest validateBookingRequest)
        {
            // Arrange
            var promotion = new Promotion(null)
            {
                Id = promoId,
                Title = title,
                ValidationRules = new PromotionValidationRules(),
                PromotionCodes = new[]
                {
                    new PromotionCode()
                    {
                        Id = "test",
                        AtcomPromoCode = "test",
                        ValidationRules = new PromotionCodeValidationRules()
                        {
                            DateRangeOfValidity = new ValidationRule<DateTimeRange>()
                            {
                                Criteria = new DateTimeRange()
                                {
                                    From = new DateTime(2025, 1, 1),
                                    To = new DateTime(2026, 1, 1),
                                },
                                ValidationResult = new ValidationResult("INVALID_DATETIME", () => "Invalid date time"),
                            },
                        }
                    }
                }
            };
            var promotions = new List<Promotion> { promotion };

            var validateBooking = new ValidateBooking()
            {
                VoucherCode = promoCode,
                Id = promoId,
                BookingDate = new DateTime(2025, 4, 25)
            };

            validateBookingRequestMapper.MapFromValidateBookingRequest(Arg.Any<ValidateBookingRequest[]>()).Returns(new ValidateBooking[] { validateBooking });

            // Act
            var actual = validationService.ValidateBooking(validateBookingRequest, promotions);

            // Assert
            actual.ValidationResults.Should().BeEmpty();
            actual.VoucherCode.Should().Be("test");
        }

        [Theory]
        [AutoData]
        public void ValidateBooking_ShouldReturnFailedValidationResults_DateRangeRuleIsNotValid(
            string promoId,
            string promoCode,
            string title,
            ValidateBookingRequest validateBookingRequest)
        {
            // Arrange
            var promotion = new Promotion(null)
            {
                Id = promoId,
                Title = title,
                ValidationRules = new PromotionValidationRules(),
                PromotionCodes = new[]
                {
                    new PromotionCode()
                    {
                        Id = "test",
                        AtcomPromoCode = "test",
                        ValidationRules = new PromotionCodeValidationRules()
                        {
                            DateRangeOfValidity = new ValidationRule<DateTimeRange>()
                            {
                                Criteria = new DateTimeRange()
                                {
                                    From = new DateTime(2025, 1, 1),
                                    To = new DateTime(2026, 1, 1),
                                },
                                ValidationResult = new ValidationResult("INVALID_DATETIME", () => "Invalid date time"),
                            },
                        }
                    }
                }
            };
            var promotions = new List<Promotion> { promotion };

            var validateBooking = new ValidateBooking()
            {
                VoucherCode = promoCode,
                Id = promoId,
                BookingDate = new DateTime(2027, 4, 25)
            };

            validateBookingRequestMapper.MapFromValidateBookingRequest(Arg.Any<ValidateBookingRequest[]>()).Returns(new ValidateBooking[] { validateBooking });

            // Act
            var actual = validationService.ValidateBooking(validateBookingRequest, promotions);

            // Assert
            actual.ValidationResults.Should().NotBeNull();
            actual.VoucherCode.Should().Be("test");
            actual.ValidationResults.First().Code.Should().Be("INVALID_DATETIME");
            actual.ValidationResults.First().Message.Should().Be("Invalid date time");
        }

        [Theory]
        [AutoData]
        public void ValidateBooking_ShouldReturnCorrectValidationResults_TwoPromoCodesOneIsValid(
            string promoId,
            string promoCode,
            string title,
            ValidateBookingRequest validateBookingRequest)
        {
            // Arrange
            var promotion = new Promotion(null)
            {
                Id = promoId,
                Title = title,
                ValidationRules = new PromotionValidationRules(),
                PromotionCodes = new[]
                {
                    new PromotionCode()
                    {
                        Id = "test",
                        AtcomPromoCode = "test",
                        ValidationRules = new PromotionCodeValidationRules()
                        {
                            DateRangeOfValidity = new ValidationRule<DateTimeRange>()
                            {
                                Criteria = new DateTimeRange()
                                {
                                    From = new DateTime(2025, 3, 2),
                                    To = new DateTime(2026, 1, 1),
                                },
                                ValidationResult = new ValidationResult("INVALID_DATETIME", () => "Invalid date time"),
                            },
                        }
                    },
                    new PromotionCode()
                    {
                        Id = "test2",
                        AtcomPromoCode = "test2",
                        ValidationRules = new PromotionCodeValidationRules()
                        {
                            DateRangeOfValidity = new ValidationRule<DateTimeRange>()
                            {
                                Criteria = new DateTimeRange()
                                {
                                    From = new DateTime(2025, 1, 1),
                                    To = new DateTime(2025, 3, 1),
                                },
                                ValidationResult = new ValidationResult("INVALID_DATETIME", () => "Invalid date time"),
                            },
                        }
                    }
                }
            };
            var promotions = new List<Promotion> { promotion };

            var validateBooking = new ValidateBooking()
            {
                VoucherCode = promoCode,
                Id = promoId,
                BookingDate = new DateTime(2025, 2, 21)
            };

            validateBookingRequestMapper.MapFromValidateBookingRequest(Arg.Any<ValidateBookingRequest[]>()).Returns(new ValidateBooking[] { validateBooking });

            // Act
            var actual = validationService.ValidateBooking(validateBookingRequest, promotions);

            // Assert
            actual.ValidationResults.Should().NotBeNull();
            actual.VoucherCode.Should().Be("test2");
            actual.ValidationResults.Should().BeEmpty();
        }
    }
}