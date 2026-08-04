using System;
using easyjet.Foundation.Testing.Attributes;
using easyJet.Foundation.Voucherify.Pipelines.SaveUI;
using FluentAssertions;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Validators;
using Sitecore.FakeDb;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.Pipelines.SaveUI
{
    public class PromotionEarliestDateValidationTests
    {
        private readonly PromotionEarliestDateValidationProcessor processor;

        public PromotionEarliestDateValidationTests()
        {
            processor = new PromotionEarliestDateValidationProcessor();
        }

        [Fact]
        public void Process_ThrowArgumentNullException_IfArgsIsNull()
        {
            // Act
            Action actual = () => processor.Process(null);

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Theory]
        [AutoDbData]
        public void Process_ValidatorError_IfStartDateMoreThanEarliestDate(Db db)
        {
            // Arrange
            var itemPromoPage = new FakeItem()
                .WithRuntimeSettings()
                .WithUri()
                .WithTemplate(Templates.PromoPage.Id)
                .WithItemVersions()
                .WithField(Templates.PromoPage.Fields.StartDate, DateUtil.ToIsoDate(DateTime.Now.AddDays(1)))
                .WithField(Templates.PromoPage.Fields.EarliestDate, DateUtil.ToIsoDate(DateTime.Now));

            var validationRuleItem = new FakeItem()
                .WithRuntimeSettings()
                .WithUri()
                .WithTemplate(new ID("{8F8E2549-C77F-4860-B83B-54FA31E2BEFA}"))
                .WithItemVersions()
                .WithField("Title", "Promotion earliest date must be greater than start date")
                .WithField("Type", "easyJet.Foundation.Voucherify.Validator.PromotionEarliestDateValidator,easyJet.Foundation.Voucherify");

            var vItem = validationRuleItem.ToSitecoreItem();
            var pItem = itemPromoPage.ToSitecoreItem();

            var validator = ValidatorManager.BuildValidator(vItem, pItem);

            // Act
            validator.Validate(new ValidatorOptions(false));

            // Assert
            validator.IsValid.Should().BeFalse();
        }
    }
}
