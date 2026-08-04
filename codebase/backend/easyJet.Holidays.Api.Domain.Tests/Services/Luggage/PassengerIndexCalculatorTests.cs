using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Luggage;

public class PassengerIndexCalculatorTests
{
    private readonly IPassengerIndexCalculator _calculator = new PassengerIndexCalculator();

    [Fact]
    public void CalculatePassengerIndex_WhenCalledEachPassengers_ShouldWrapAround()
    {
        // Arrange
        var numberOfAdults = 2;
        var numberOfChildren = 2;
        var numberOfInfants = 2;

        // Act & Assert
        // Call the method twice the number of adults to check for wrap-around.
        _calculator.CalculatePassengerIndex(PersonType.Adult, numberOfAdults, numberOfChildren, numberOfInfants).Should().Be(1);
        _calculator.CalculatePassengerIndex(PersonType.Adult, numberOfAdults, numberOfChildren, numberOfInfants).Should().Be(2);
        _calculator.CalculatePassengerIndex(PersonType.Adult, numberOfAdults, numberOfChildren, numberOfInfants).Should().Be(1);
        _calculator.CalculatePassengerIndex(PersonType.Adult, numberOfAdults, numberOfChildren, numberOfInfants).Should().Be(2);

        _calculator.CalculatePassengerIndex(PersonType.Child, numberOfAdults, numberOfChildren, numberOfInfants).Should().Be(3);
        _calculator.CalculatePassengerIndex(PersonType.Child, numberOfAdults, numberOfChildren, numberOfInfants).Should().Be(4);
        _calculator.CalculatePassengerIndex(PersonType.Child, numberOfAdults, numberOfChildren, numberOfInfants).Should().Be(3);
        _calculator.CalculatePassengerIndex(PersonType.Child, numberOfAdults, numberOfChildren, numberOfInfants).Should().Be(4);

        _calculator.CalculatePassengerIndex(PersonType.Infant, numberOfAdults, numberOfChildren, numberOfInfants).Should().Be(5);
        _calculator.CalculatePassengerIndex(PersonType.Infant, numberOfAdults, numberOfChildren, numberOfInfants).Should().Be(6);
        _calculator.CalculatePassengerIndex(PersonType.Infant, numberOfAdults, numberOfChildren, numberOfInfants).Should().Be(5);
        _calculator.CalculatePassengerIndex(PersonType.Infant, numberOfAdults, numberOfChildren, numberOfInfants).Should().Be(6);
    }

    [Theory]
    [InlineAutoData(-1)]
    [InlineAutoData(0)]
    public void CalculatePassengerIndex_WithNegativeOrZeroInfants_ShouldThrowArgumentOutOfRangeException(int numberOfInfants)
    {
        // Arrange
        // Act
        // adults and children are not relevant here
        Action act = () => _calculator.CalculatePassengerIndex(PersonType.Infant, 0, 0, numberOfInfants);

        // Assert
        act.Should().Throw<ArgumentOutOfRangeException>()
            .WithMessage(
                "*Number of infants cannot be less than or equal to zero.*");
    }

    [Theory]
    [InlineAutoData(-1)]
    [InlineAutoData(0)]
    public void CalculatePassengerIndex_WithNegativeOrZeroChildren_ShouldThrowArgumentOutOfRangeException(int numberOfChildren)
    {
        // Arrange
        // Act
        // adults and infants are not relevant here
        Action act = () => _calculator.CalculatePassengerIndex(PersonType.Child, 0, numberOfChildren, 0);

        // Assert
        act.Should().Throw<ArgumentOutOfRangeException>()
            .WithMessage(
                "*Number of children cannot be less than or equal to zero.*");
    }

    [Theory]
    [InlineAutoData(-1)]
    [InlineAutoData(0)]
    public void CalculatePassengerIndex_WithNegativeOrZeroAdults_ShouldThrowArgumentOutOfRangeException(int numberOfAdults)
    {
        // Arrange
        // Act
        // children and infants are not relevant here
        Action act = () => _calculator.CalculatePassengerIndex(PersonType.Adult, numberOfAdults, 0, 0);

        // Assert
        act.Should().Throw<ArgumentOutOfRangeException>()
            .WithMessage(
                "*Number of adults cannot be less than or equal to zero.*");
    }
}