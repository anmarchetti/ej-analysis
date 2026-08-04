using System;
using System.Collections.Generic;
using System.Web.Mvc;
using AutoFixture.Xunit2;
using easyJet.Foundation.DynamoDb.Models;
using easyJet.Foundation.DynamoDb.Repositories.Base;
using easyJet.Foundation.Multisite.Services;
using easyJet.Foundation.Voucherify.Controllers;
using easyJet.Foundation.Voucherify.Logging;
using easyJet.Foundation.Voucherify.Models.Domain;
using easyJet.Foundation.Voucherify.Models.Requests;
using easyJet.Foundation.Voucherify.Models.Responses;
using easyJet.Foundation.Voucherify.Services;
using easyJet.Foundation.Voucherify.Validator;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.Controllers
{
    public class PromotionControllerTests
    {
        private readonly PromotionController promotionController;
        private readonly IPromotionService promotionService;
        private readonly IPromotionValidationService validationService;

        public PromotionControllerTests()
        {
            // Arrange
            promotionService = Substitute.For<IPromotionService>();
            var voucherifyLogger = Substitute.For<IVoucherifyLogger>();
            var marketSettingsService = Substitute.For<IMarketSettingsService>();
            validationService = Substitute.For<IPromotionValidationService>();

            promotionController = new PromotionController(
                promotionService,
                marketSettingsService,
                validationService,
                voucherifyLogger);
        }

        [Theory]
        [MemberData(nameof(NotValidValidateBookingRequest))]
        public void Validate_ThrowArgumentException_IfRequestIsNotValid(ValidateBookingRequest request)
        {
            // Act
            Action actual = () => promotionController.Validate(request);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [AutoData]
        public void Validate_ShouldReturnNotFound_IfPromotionWasNotFound(ValidateBookingRequest request)
        {
            // Assert
            promotionService.GetPromotionsByCode(Arg.Any<string>(), Arg.Any<string>())
                .Returns(new List<Promotion>());

            // Act
            var actual = promotionController.Validate(request);

            // Assert
            actual.Should().BeOfType<HttpNotFoundResult>();
        }

        [Theory]
        [AutoData]
        public void Validate_ShouldReturnSuccess_IfPromotionValidated(ValidateBookingRequest request)
        {
            // Assert
            var promotion = new List<Promotion>() { new Promotion(null) };
            promotionService.GetPromotionsByCode(Arg.Any<string>(), Arg.Any<string>()).Returns(promotion);
            validationService.ValidateBooking(request, promotion).Returns(new ValidatePromotionResponse());

            // Act
            var actual = promotionController.Validate(request);

            // Assert
            actual.Should().BeOfType<JsonResult>();
        }

        [Theory]
        [AutoData]
        public void MatchPromoCodes_ShouldThrowArgumentNull_IfPromoCodeIsNull(MatchPromocodesRequest request)
        {
            // Assert
            request.VoucherCode = null;

            // Act
            Action actual = () => promotionController.MatchPromoCodes(request);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [AutoData]
        public void MatchPromocodes_ShouldThrowArgumenntNull_IfValidateBookingRequestIsNull(MatchPromocodesRequest request)
        {
            // Assert
            request.ValidateBookingRequests = null;

            // Act
            Action actual = () => promotionController.MatchPromoCodes(request);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [AutoData]
        public void MatchPromoCodes_ReturnJson_NormalWorkflow(MatchPromocodesRequest request)
        {
            // Assert
            Dictionary<string, PromocodeDiscounts> promotionDiscounts = new Dictionary<string, PromocodeDiscounts>
            {
                { "1", new PromocodeDiscounts() }
            };

            promotionService.MatchPromocodeForOffers(Arg.Any<string>(), Arg.Any<List<ValidateBookingRequest>>(), Arg.Any<string>())
                .Returns(promotionDiscounts);

            // Act
            var actual = ((JsonResult)promotionController.MatchPromoCodes(request)).Data as MatchPromocodesResponse;

            // Assert
            actual.Should().NotBeNull();
        }

        [Theory]
        [AutoData]
        public void GetAll_ShouldReturnEmptyArray_IfPromotionsWereNotFound(string marketCode)
        {
            // Assert
            var promotions = Array.Empty<Promotion>();

            promotionService.GetAll(marketCode).Returns(promotions);

            // Act
            var actual = (promotionController.GetAll(marketCode) as JsonResult)?.Data as IEnumerable<Promotion>;

            // Assert
            actual.Should().HaveCount(0);
        }

        [Theory]
        [AutoData]
        public void GetAll_ShouldReturnPromotions_IfPromotionsWereFound(string marketCode)
        {
            // Assert
            List<Promotion> expected = new List<Promotion>()
            {
                new Promotion(null)
            };

            promotionService.GetAll(marketCode).Returns(expected);

            // Act
            var actual = ((JsonResult)promotionController.GetAll(marketCode)).Data as List<Promotion>;

            // Assert
            actual.Should().HaveCount(expected.Count);
        }

        [Theory]
        [AutoData]
        public void GetAllWithAtcomFlag_ShouldReturnPromotions_IfPromotionsWereFound(string marketCode)
        {
            // Assert
            List<Promotion> expected = new List<Promotion>()
            {
                new Promotion(null) { Title = "test" },
            };

            promotionService.GetAll(marketCode).Returns(expected);

            // Act
            var actual = ((JsonResult)promotionController.GetAll(marketCode)).Data as List<Promotion>;

            // Assert
            actual.Should().HaveCount(expected.Count);
            actual?[0].Title.Should().Be("test");
        }

        [Theory]
        [MemberData(nameof(NotValidCustomerPromoCodeRequest))]
        public void GetCustomerPromoCode_ThrowArgumentException_IfRequestIsNotValid(CustomerPromoCodeRequest request)
        {
            // Act
            Action actual = () => promotionController.GetCustomerPromoCode(request);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [AutoData]
        public void GetCustomerPromoCode_ShouldReturnNotFound_IfPromotionWasNotFound(CustomerPromoCodeRequest request)
        {
            // Assert
            promotionService.GetPromotionsByCode(Arg.Any<string>(), Arg.Any<string>())
                .Returns(new List<Promotion>());

            // Act
            var actual = promotionController.GetCustomerPromoCode(request);

            // Assert
            actual.Should().BeOfType<HttpNotFoundResult>();
        }

        [Theory]
        [AutoData]
        public void GetCustomerPromoCode_ShouldReturnResult_IfPromotionWasFound(CustomerPromoCodeRequest request, string promotionTitle)
        {
            // Arrange
            Promotion promotion = new Promotion(null)
            {
                Title = promotionTitle
            };

            promotionService.GetPromotionByAtcomPromoCode(Arg.Any<string>(), Arg.Any<string>())
                .Returns(promotion);

            // Act
            var actual = (promotionController.GetCustomerPromoCode(request) as JsonResult)?.Data as string;

            // Assert
            actual.Should().Be(promotion.Title);
        }

        public static IEnumerable<object[]> NotValidValidateBookingRequest
        {
            get
            {
                return new[]
                {
                    new object[] { new ValidateBookingRequest() },
                    new object[] { new ValidateBookingRequest() { VoucherCode = null } },
                    new object[] { new ValidateBookingRequest() { VoucherCode = string.Empty } }
                };
            }
        }

        public static IEnumerable<object[]> NotValidCustomerPromoCodeRequest
        {
            get
            {
                return new[]
                {
                    new object[] { new CustomerPromoCodeRequest() },
                    new object[] { new CustomerPromoCodeRequest() { AtcomPromoCode = null } },
                    new object[] { new CustomerPromoCodeRequest() { AtcomPromoCode = string.Empty } }
                };
            }
        }
    }
}