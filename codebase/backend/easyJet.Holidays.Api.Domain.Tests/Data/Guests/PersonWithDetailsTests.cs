using easyJet.Holidays.Api.Domain.Data.Guests;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests
{
    public class PersonWithDetailsTests
    {
        [Theory]
        [InlineData("The Title field is required.", PersonType.Adult, "", new[] { "The Title field is required." })]
        [InlineData("The Title field is required.", PersonType.Child, "", new[] { "The Title field is required." })]
        [InlineData("The Title field can only be one of Mr, Mrs, Miss, Ms, Chd, Mr+Inf, Mrs+Inf, Miss+Inf or Ms+Inf.", PersonType.Adult, "Mstr", new[] { "The Title field can only be one of Mr, Mrs, Miss, Ms, Chd, Mr+Inf, Mrs+Inf, Miss+Inf or Ms+Inf." })]
        [InlineData("The Title field can only be one of Mr, Mrs, Miss, Ms, Chd, Mr+Inf, Mrs+Inf, Miss+Inf or Ms+Inf.", PersonType.Child, "Mss", new[] { "The Title field can only be one of Mr, Mrs, Miss, Ms, Chd, Mr+Inf, Mrs+Inf, Miss+Inf or Ms+Inf." })]
        public void Validate_PersonIsAdultOrChildAndTitleEmptyOrIncorrect_HasError(string because, PersonType type, string title, string[] errors)
        {
            // Arrange
            var p = new PersonWithDetails
            {
                Sex = Sex.Male,
                Type = type,
                Title = title
            };

            // Act
            var messages = p.Validate(null).Select(x => x.ErrorMessage).ToList();

            // Assert
            messages.Any(errors.Contains).Should().BeTrue();
        }

        [Theory]
        [InlineData("The Title field is required. (valid)", PersonType.Infant, "", new string[0])]
        [InlineData("The Title field can only be one of Mr, Mrs, Miss, Ms, Chd, Mr+Inf, Mrs+Inf, Miss+Inf or Ms+Inf. (valid)", PersonType.Infant, "Mstr", new string[0])]
        public void Validate_PersonIsInfantAndTitleEmptyOrIncorrect_HasNoError(string because, PersonType type, string title, string[] errors)
        {
            // Arrange
            var p = new PersonWithDetails
            {
                Sex = Sex.Male,
                Type = type,
                Title = title
            };

            // Act
            var messages = p.Validate(null).Select(x => x.ErrorMessage).ToList();

            // Assert
            messages.Should().BeEquivalentTo(errors, because);
        }

        [Theory]
        [InlineData("The Date Of Birth field is required.", PersonType.Child, null, new[] { "The Date Of Birth field is required." })]
        public void Validate_PersonIsChildAndDateOfBirthIsNull_HasError(string because, PersonType type, DateTimeOffset? dateOfBirth, string[] errors)
        {
            // Arrange
            var p = new PersonWithDetails
            {
                Sex = Sex.Male,
                Type = type,
                DateOfBirth = dateOfBirth
            };

            // Act
            var messages = p.Validate(null).Select(x => x.ErrorMessage).ToList();

            // Assert
            messages.Any(errors.Contains).Should().BeTrue();
        }

        [Theory]
        [InlineData("The Date Of Birth field is required. (valid)", PersonType.Adult, null, new[] { "The Date Of Birth field is required." })]
        [InlineData("The Date Of Birth field is required. (valid)", PersonType.Infant, null, new[] { "The Date Of Birth field is required." })]
        public void Validate_PersonIsAdultOrInfantAndDateOfBirthIsNull_HasNoError(string because, PersonType type, DateTimeOffset? dateOfBirth, string[] errors)
        {
            // Arrange
            var p = new PersonWithDetails
            {
                Sex = Sex.Male,
                Type = type,
                DateOfBirth = dateOfBirth
            };

            // Act
            var messages = p.Validate(null).Select(x => x.ErrorMessage).ToList();

            // Assert
            messages.Any(errors.Contains).Should().BeFalse();
        }
    }
}
