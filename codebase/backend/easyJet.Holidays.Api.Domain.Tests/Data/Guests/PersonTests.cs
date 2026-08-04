using easyJet.Holidays.Api.Domain.Data.Guests;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests
{
    public class PersonTests
    {
        [Theory]
        [InlineData("Age should be positive.", PersonType.Adult, -1, new[] { "Age should be positive." })]
        [InlineData("Default age.", PersonType.Adult, 0, new string[0])]

        [InlineData("Adult should be 16+(valid)", PersonType.Adult, 16, new string[0])]
        [InlineData("Adult should be 16+", PersonType.Adult, 15, new[] { "Adult age should be 16+." })]

        [InlineData("Child should be 2-15(valid)", PersonType.Child, 15, new string[0])]
        [InlineData("Child should be 2-15(valid)", PersonType.Child, 2, new string[0])]
        [InlineData("Child should be 2-15", PersonType.Child, 16, new[] { "Child age should be 2 to 15." })]
        [InlineData("Child should be 2-15", PersonType.Child, 1, new[] { "Child age should be 2 to 15." })]

        [InlineData("Infant age should be under 2.(valid)", PersonType.Infant, 1, new string[0])]
        [InlineData("Infant age should be under 2.", PersonType.Infant, 3, new[] { "Infant age should be under 2." })]
        [InlineData("Infant age should be under 2.", PersonType.Infant, 2, new[] { "Infant age should be under 2." })]
        public void Validate_Age(string because, PersonType type, int age, string[] errors)
        {
            // Arrange
            var p = new Person()
            {
                Age = age,
                Sex = Sex.Male,
                Type = type
            };

            // Act
            var messages = p.Validate(null).Select(x => x.ErrorMessage).ToList();

            // Assert
            messages.Should().BeEquivalentTo(errors, because);
        }
    }
}
