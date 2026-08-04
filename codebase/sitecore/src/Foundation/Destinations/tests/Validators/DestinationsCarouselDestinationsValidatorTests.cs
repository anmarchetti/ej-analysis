using easyJet.Foundation.Destinations.Validators;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Data.Validators;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Validators
{
    public class DestinationsCarouselDestinationsValidatorTests
    {
        [Fact]
        public void Evaluate_CriticalError_IfSelectedItemIsNotInPromoPageDestinationsTree()
        {
            // Arrange
            var selectedId = ID.NewID;
            var carouselItem = CreateCarouselItemUnderPromoPage(promoPageDestinationValue: ID.NewID.ToString());
            AddDestinationItem(carouselItem, selectedId, longId: $"/{ID.NewID}/{selectedId}");
            var validator = new TestableValidator(carouselItem, selectedId.ToString());

            // Act & Assert
            validator.EvaluateResult().Should().Be(ValidatorResult.CriticalError);
        }

        [Fact]
        public void Evaluate_CriticalError_IfPromoPageHasNoDestination()
        {
            // Arrange
            var selectedId = ID.NewID;
            var carouselItem = CreateCarouselItemUnderPromoPage(promoPageDestinationValue: string.Empty);
            AddDestinationItem(carouselItem, selectedId, longId: $"/{ID.NewID}/{selectedId}");
            var validator = new TestableValidator(carouselItem, selectedId.ToString());

            // Act & Assert
            validator.EvaluateResult().Should().Be(ValidatorResult.CriticalError);
        }

        [Fact]
        public void Evaluate_CriticalError_IfSelectedItemDoesNotExist()
        {
            // Arrange
            var carouselItem = CreateCarouselItemUnderPromoPage(promoPageDestinationValue: ID.NewID.ToString());
            var validator = new TestableValidator(carouselItem, ID.NewID.ToString());

            // Act & Assert
            validator.EvaluateResult().Should().Be(ValidatorResult.CriticalError);
        }

        [Fact]
        public void Evaluate_CriticalError_IfOnlySomeSelectedItemsAreInPromoPageDestinationsTree()
        {
            // Arrange
            var allowedDestinationId = ID.NewID;
            var missingDestinationId = ID.NewID;
            var carouselItem = CreateCarouselItemUnderPromoPage(promoPageDestinationValue: allowedDestinationId.ToString());
            AddDestinationItem(carouselItem, allowedDestinationId, longId: $"/{ID.NewID}/{allowedDestinationId}", name: "Allowed Destination");
            AddDestinationItem(carouselItem, missingDestinationId, longId: $"/{ID.NewID}/{missingDestinationId}", name: "Missing Destination");
            var validator = new TestableValidator(carouselItem, $"{allowedDestinationId}|{missingDestinationId}");

            // Act
            var result = validator.EvaluateResult();

            // Assert
            result.Should().Be(ValidatorResult.CriticalError);
            validator.Text.Should().Contain(TestableValidator.FieldName);
            validator.Text.Should().Contain("Missing Destination");
            validator.Text.Should().NotContain("Allowed Destination");
        }

        [Fact]
        public void Evaluate_Valid_IfSelectedItemsMatchPromoPageDestinations()
        {
            // Arrange
            var firstDestinationId = ID.NewID;
            var secondDestinationId = ID.NewID;
            var carouselItem = CreateCarouselItemUnderPromoPage($"{firstDestinationId}|{secondDestinationId}");
            AddDestinationItem(carouselItem, firstDestinationId, longId: $"/{ID.NewID}/{firstDestinationId}");
            AddDestinationItem(carouselItem, secondDestinationId, longId: $"/{ID.NewID}/{secondDestinationId}");
            var validator = new TestableValidator(carouselItem, $"{firstDestinationId}|{secondDestinationId}");

            // Act & Assert
            validator.EvaluateResult().Should().Be(ValidatorResult.Valid);
        }

        [Fact]
        public void Evaluate_Valid_IfSelectedItemIsDescendantOfPromoPageDestination()
        {
            // Arrange
            var promoPageDestinationId = ID.NewID;
            var selectedChildId = ID.NewID;
            var carouselItem = CreateCarouselItemUnderPromoPage(promoPageDestinationValue: promoPageDestinationId.ToString());
            AddDestinationItem(carouselItem, selectedChildId, longId: $"/{ID.NewID}/{promoPageDestinationId}/{selectedChildId}");
            var validator = new TestableValidator(carouselItem, selectedChildId.ToString());

            // Act & Assert
            validator.EvaluateResult().Should().Be(ValidatorResult.Valid);
        }

        [Fact]
        public void Evaluate_Valid_IfThereIsNoPromoPageAncestor()
        {
            // Arrange
            var regularPage = new FakeItem().WithTemplate(ID.NewID).ToSitecoreItem();
            var carouselItem = CreateCarouselItemWithAncestors(regularPage);
            var validator = new TestableValidator(carouselItem, ID.NewID.ToString());

            // Act & Assert
            validator.EvaluateResult().Should().Be(ValidatorResult.Valid);
        }

        [Fact]
        public void Evaluate_Valid_IfFieldIsEmpty()
        {
            // Arrange
            var carouselItem = CreateCarouselItemUnderPromoPage(promoPageDestinationValue: string.Empty);
            var validator = new TestableValidator(carouselItem, string.Empty);

            // Act & Assert
            validator.EvaluateResult().Should().Be(ValidatorResult.Valid);
        }

        private static Item CreateCarouselItemUnderPromoPage(string promoPageDestinationValue)
        {
            var promoPage = new FakeItem()
                .WithTemplate(Constants.TemplateIds.PromoPage)
                .WithField(Constants.Fields.PromoPage.Destination, promoPageDestinationValue)
                .ToSitecoreItem();

            return CreateCarouselItemWithAncestors(promoPage);
        }

        private static Item CreateCarouselItemWithAncestors(params Item[] ancestors)
        {
            var carouselItem = new FakeItem().ToSitecoreItem();

            var axes = Substitute.For<ItemAxes>(carouselItem);
            axes.GetAncestors().Returns(ancestors);
            carouselItem.Axes.Returns(axes);

            return carouselItem;
        }

        private static void AddDestinationItem(Item carouselItem, ID destinationItemId, string longId, string name = null)
        {
            var destinationItem = new FakeItem(destinationItemId).ToSitecoreItem();

            if (name != null)
            {
                destinationItem.Name.Returns(name);
            }

            var paths = Substitute.For<ItemPath>(destinationItem);
            paths.LongID.Returns(longId);
            destinationItem.Paths.Returns(paths);

            carouselItem.Database.GetItem(destinationItemId).Returns(destinationItem);
        }

        private class TestableValidator : DestinationsCarouselDestinationsValidator
        {
            public const string FieldName = "Destinations";

            private readonly Item item;
            private readonly string fieldValue;

            public TestableValidator(Item item, string fieldValue)
            {
                this.item = item;
                this.fieldValue = fieldValue;
            }

            public ValidatorResult EvaluateResult() => Evaluate();

            protected override Item GetItem() => item;

            protected override string GetControlValidationValue() => fieldValue;

            // The base implementation resolves the validator definition item from the context database,
            // which depends on global Sitecore state and is not available in unit tests.
            protected override string GetText(string text, params string[] arguments) => string.Format(text, arguments);

            // The base implementation resolves the field display name via Translate.Text,
            // which depends on global Sitecore state and is not available in unit tests.
            protected override string GetFieldName() => FieldName;
        }
    }
}
