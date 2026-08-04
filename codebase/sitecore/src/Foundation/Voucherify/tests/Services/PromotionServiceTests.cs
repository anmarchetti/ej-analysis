using System;
using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.Voucherify.ContentSearch.Repositories;
using easyJet.Foundation.Voucherify.Mappers;
using easyJet.Foundation.Voucherify.Models.Domain;
using easyJet.Foundation.Voucherify.Models.Domain.Validation;
using easyJet.Foundation.Voucherify.Models.Requests;
using easyJet.Foundation.Voucherify.Services;
using easyJet.Foundation.Voucherify.Validator;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.Services
{
    public class PromotionServiceTests
    {
        private readonly PromotionService promotionService;
        private readonly IHtmlCacheRepository cache;
        private readonly IValidateBookingRequestMapper validateBookingRequestMapper;
        private readonly ISitecoreContext sitecoreContext;
        private readonly IPromotionValidationService validationService;
        private readonly IPromotionRepository promotionRepository;

        public PromotionServiceTests()
        {
            cache = Substitute.ForPartsOf<HtmlCacheRepository>();
            validateBookingRequestMapper = Substitute.For<IValidateBookingRequestMapper>();
            sitecoreContext = Substitute.For<ISitecoreContext>();
            promotionRepository = Substitute.For<IPromotionRepository>();
            validationService = Substitute.For<IPromotionValidationService>();
            promotionService =
                new PromotionService(cache, validateBookingRequestMapper, promotionRepository, sitecoreContext, validationService);
        }

        [Theory]
        [InlineAutoData("", "")]
        [InlineAutoData(null, "")]
        [InlineAutoData(null, null)]
        public void GetPromotionByAtcomPromoCode_ShouldReturnNull_IfArgsIsNullOrEmpty(string promoCode, string marketCode)
        {
            // Act
            var actual = promotionService.GetPromotionByAtcomPromoCode(promoCode, marketCode);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void GetPromotionByCode_ShouldReturnBeNull_IfPromotionItemIsNotExist(string promoCode, string marketCode)
        {
            // Arrange
            List<Promotion> nullObject = null;
            var emptyItem = Array.Empty<Item>();
            cache.GetItem<List<Promotion>>(Arg.Any<string>()).Returns(nullObject);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<List<Promotion>>(), Arg.Any<int>()).Returns(nullObject);

            var lang = Substitute.For<Language>(new object[0]);
            sitecoreContext.Language.Returns(lang);

            promotionRepository.GetPromotions(promoCode, marketCode, Arg.Any<Language>()).Returns(emptyItem);

            // Act
            var actual = promotionService.GetPromotionsByCode(promoCode, marketCode);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetPromotionByCode_ShouldReturnPromotion_IfPromotionItemIsExistInCache(string promoCode, string marketCode)
        {
            // Arrange
            var expected = new Promotion(null)
            {
                Id = "ID",
                Title = "Title"
            };

            var list = new List<Promotion>() { expected };

            cache.GetItem<List<Promotion>>(Arg.Any<string>()).Returns(list);
            var lang = Substitute.For<Language>(new object[0]);
            sitecoreContext.Language.Returns(lang);

            // Act
            var actual = promotionService.GetPromotionsByCode(promoCode, marketCode);

            // Assert
            actual.First().Id.Should().Be(expected.Id.ToString());
            actual.First().Title.Should().Be(expected.Title);
        }

        [Theory]
        [AutoData]
        public void GetPromotionByCode_ShouldReturnPromotion_IfPromotionItemIsExist(string promoCode, string marketCode)
        {
            // Arrange
            List<Promotion> nullObject = null;
            cache.GetItem<List<Promotion>>(Arg.Any<string>()).Returns(nullObject);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<List<Promotion>>(), Arg.Any<int>()).Returns(nullObject);

            var lang = Substitute.For<Language>(new object[0]);
            sitecoreContext.Language.Returns(lang);

            var fakeItem = new FakeItem();
            fakeItem.WithField(Templates.Promotion.Fields.CustomerPromoCode, promoCode);

            // Act
            promotionRepository.GetPromotions(promoCode, marketCode, Arg.Any<Language>()).Returns(new Item[] { fakeItem });

            var actual = promotionService.GetPromotionsByCode(promoCode, marketCode);

            // Assert
            actual.First().Id.Should().Be(fakeItem.ID.ToString());
            actual.First().Title.Should().Be(promoCode);
        }

        [Theory]
        [InlineAutoData("", "")]
        [InlineAutoData(null, "")]
        [InlineAutoData(null, null)]
        public void GetPromotionByAtcomPromoCode_ShouldReturnEmptyCollection_IfArgsIsNullOrEmpty(string promoCode, string marketCode)
        {
            // Act
            var actual = promotionService.GetPromotionsByCode(promoCode, marketCode);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetPromotionByAtcomPromoCode_ShouldReturnNull_IfPromotionItemIsNotExist(string promotionCode, string marketCode)
        {
            // Arrange
            Promotion nullObject = null;
            Item nullItem = null;
            cache.GetItem<Promotion>(Arg.Any<string>()).Returns(nullObject);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<Promotion>(), Arg.Any<int>()).Returns(nullObject);

            var lang = Substitute.For<Language>(new object[0]);
            sitecoreContext.Language.Returns(lang);

            promotionRepository.GetPromotionByAtcomCode(promotionCode, marketCode).Returns(nullItem);

            // Act
            var actual = promotionService.GetPromotionByAtcomPromoCode(promotionCode, marketCode);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void GetPromotionByAtcomPromoCode_ShouldReturnPromotion_IfPromotionItemIsExistInCache(string promoCode, string marketCode)
        {
            // Arrange
            var expected = new Promotion(null)
            {
                Id = "ID",
                Title = "Title"
            };

            cache.GetItem<Promotion>(Arg.Any<string>()).Returns(expected);
            var lang = Substitute.For<Language>(new object[0]);
            sitecoreContext.Language.Returns(lang);

            // Act
            var actual = promotionService.GetPromotionByAtcomPromoCode(promoCode, marketCode);

            // Assert
            actual.Id.Should().Be(expected.Id.ToString());
            actual.Title.Should().Be(expected.Title);
        }

        [Theory]
        [AutoData]
        public void GetPromotionByAtcomPromoCode_ShouldReturnPromotion_IfPromotionItemIsExist(string promoCode, string marketCode)
        {
            // Arrange
            Promotion nullObject = null;
            cache.GetItem<Promotion>(Arg.Any<string>()).Returns(nullObject);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<Promotion>(), Arg.Any<int>()).Returns(nullObject);

            var lang = Substitute.For<Language>(new object[0]);
            sitecoreContext.Language.Returns(lang);

            var fakeItem = new FakeItem();
            fakeItem.WithField(Templates.Promotion.Fields.CustomerPromoCode, promoCode);

            promotionRepository.GetPromotionByAtcomCode(promoCode, marketCode).Returns(fakeItem);

            // Act
            var actual = promotionService.GetPromotionByAtcomPromoCode(promoCode, marketCode);

            // Assert
            actual.Id.Should().Be(fakeItem.ID.ToString());
            actual.Title.Should().Be(promoCode);
        }

        [Theory]
        [AutoData]
        public void GetAll_ShouldReturnPromotions_IfPromotionsItemsAreExist(string marketCode, string promoCode)
        {
            // Arrange
            List<Promotion> nullObject = null;
            cache.GetItem<IEnumerable<Promotion>>(Arg.Any<string>()).Returns(nullObject);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<Promotion>>(), Arg.Any<int>()).Returns(nullObject);

            var lang = Substitute.For<Language>(new object[0]);
            sitecoreContext.Language.Returns(lang);

            var fakeItem = new FakeItem();
            fakeItem.WithField(Templates.Promotion.Fields.CustomerPromoCode, promoCode);
            Item[] fakeItems = new Item[]
            {
                fakeItem
            };

            promotionRepository.GetAll(marketCode).Returns(fakeItems);

            // Act
            var actual = promotionService.GetAll(marketCode).ToArray();

            // Assert
            actual[0].Id.Should().Be(fakeItem.ID.ToString());
            actual[0].Title.Should().Be(promoCode);
        }

        [Theory]
        [AutoData]
        public void GetAllWithAtcomCode_ShouldReturnPromotions_IfPromotionsItemsAreExist(string marketCode, string promoCode)
        {
            // Arrange
            List<Promotion> nullObject = null;
            cache.GetItem<IEnumerable<Promotion>>(Arg.Any<string>()).Returns(nullObject);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<Promotion>>(), Arg.Any<int>()).Returns(nullObject);

            var lang = Substitute.For<Language>(new object[0]);
            sitecoreContext.Language.Returns(lang);

            var fakeItem = new FakeItem();
            fakeItem.WithField(Templates.Promotion.Fields.CustomerPromoCode, promoCode);
            Item[] fakeItems = new Item[]
            {
                fakeItem
            };

            promotionRepository.GetAll(marketCode).Returns(fakeItems);

            // Act
            var actual = promotionService.GetAll(marketCode).ToArray();

            // Assert
            actual[0].Id.Should().Be(fakeItem.ID.ToString());
            actual[0].Title.Should().Be(promoCode);
        }

        [Theory]
        [AutoData]
        public void MatchPromocodeForOffers_ShouldBeEmpty_IfCannotFindPromoCodeByAtcomCode(string marketCode)
        {
            // Act
            var actual = promotionService.MatchPromocodeForOffers(null, Array.Empty<ValidateBookingRequest>(), marketCode);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void MatchPromocodeForOffers_ShouldBeEmpty_IfCannotFindPromoCode(string promoCode, string marketCode)
        {
            // Arrange
            var expected = new Promotion(null)
            {
                Id = "ID",
                Title = null
            };

            cache.GetItem<Promotion>(Arg.Any<string>()).Returns(expected);
            var lang = Substitute.For<Language>(new object[0]);
            sitecoreContext.Language.Returns(lang);

            // Act
            var actual = promotionService.MatchPromocodeForOffers(promoCode, Array.Empty<ValidateBookingRequest>(), marketCode);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void MatchPromocodeForOffers_ShouldNotBeEmpty_IfPromoCodeMatchOffers(
            string promoId,
            string promoCode,
            string title,
            ValidateBookingRequest validateBookingRequest,
            string marketCode,
            string airportCode)
        {
            // Arrange
            var promotion = new Promotion(null)
            {
                Id = promoId,
                Title = title,
                ValidationRules = new PromotionValidationRules(),
                PromotionCodes = new[] { new PromotionCode { AtcomPromoCode = "test" }, }
            };

            var validateBooking = new ValidateBooking()
            {
                Airport = airportCode,
                VoucherCode = promoCode,
                Id = promoId
            };

            cache.GetItem<Promotion>(Arg.Any<string>()).Returns(promotion);
            var lang = Substitute.For<Language>(new object[0]);
            sitecoreContext.Language.Returns(lang);
            validationService.Validate(Arg.Any<Promotion>(), validateBooking).Returns(new List<ValidationFailure>());
            validationService.Validate(Arg.Any<PromotionCode>(), validateBooking).Returns(new List<ValidationFailure>());

            validateBookingRequestMapper.MapFromValidateBookingRequest(Arg.Any<ValidateBookingRequest[]>()).Returns(new ValidateBooking[] { validateBooking });

            // Act
            var actual = promotionService.MatchPromocodeForOffers(promoCode, new ValidateBookingRequest[1] { validateBookingRequest }, marketCode);

            // Assert
            actual.Should().NotBeEmpty();
        }

        [Theory]
        [AutoData]
        public void MatchPromoCodeOffers_EmptyResult_PromotionIsNotValid(
            string promoId,
            string promoCode,
            string title,
            ValidateBookingRequest validateBookingRequest,
            string marketCode,
            string airportCode)
        {
            // Arrange
            var promotion = new Promotion(null)
            {
                Id = promoId,
                Title = title,
                ValidationRules = new PromotionValidationRules(),
                PromotionCodes = new[] { new PromotionCode { AtcomPromoCode = "test" }, }
            };

            var validateBooking = new ValidateBooking()
            {
                Airport = airportCode,
                VoucherCode = promoCode,
                Id = promoId
            };

            cache.GetItem<Promotion>(Arg.Any<string>()).Returns(promotion);
            var lang = Substitute.For<Language>(new object[0]);
            sitecoreContext.Language.Returns(lang);
            validationService.Validate(Arg.Any<Promotion>(), validateBooking).Returns(new List<ValidationFailure>() { new ValidationFailure() });
            validationService.Validate(Arg.Any<PromotionCode>(), validateBooking).Returns(new List<ValidationFailure>());

            validateBookingRequestMapper.MapFromValidateBookingRequest(Arg.Any<ValidateBookingRequest[]>()).Returns(new ValidateBooking[] { validateBooking });

            // Act
            var actual = promotionService.MatchPromocodeForOffers(promoCode, new ValidateBookingRequest[1] { validateBookingRequest }, marketCode);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void MatchPromoCodeOffers_EmptyResult_PromotionCodeIsNotValid(
            string promoId,
            string promoCode,
            string title,
            ValidateBookingRequest validateBookingRequest,
            string marketCode,
            string airportCode)
        {
            // Arrange
            var promotion = new Promotion(null)
            {
                Id = promoId,
                Title = title,
                ValidationRules = new PromotionValidationRules(),
                PromotionCodes = new[] { new PromotionCode { AtcomPromoCode = "test" }, }
            };

            var validateBooking = new ValidateBooking()
            {
                Airport = airportCode,
                VoucherCode = promoCode,
                Id = promoId
            };

            cache.GetItem<Promotion>(Arg.Any<string>()).Returns(promotion);
            var lang = Substitute.For<Language>(new object[0]);
            sitecoreContext.Language.Returns(lang);
            validationService.Validate(Arg.Any<Promotion>(), validateBooking).Returns(new List<ValidationFailure>());
            validationService.Validate(Arg.Any<PromotionCode>(), validateBooking).Returns(new List<ValidationFailure>() { new ValidationFailure() });

            validateBookingRequestMapper.MapFromValidateBookingRequest(Arg.Any<ValidateBookingRequest[]>()).Returns(new ValidateBooking[] { validateBooking });

            // Act
            var actual = promotionService.MatchPromocodeForOffers(promoCode, new ValidateBookingRequest[1] { validateBookingRequest }, marketCode);

            // Assert
            actual.Should().BeEmpty();
        }
    }
}
