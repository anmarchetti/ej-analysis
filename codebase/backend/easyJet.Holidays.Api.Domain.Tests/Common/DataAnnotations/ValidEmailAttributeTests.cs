using easyJet.Holidays.Api.Domain.Data.Common.DataAnnotations;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Common.DataAnnotations;

public class ValidEmailAttributeTests
{
    [Theory]
    [InlineData("@example.com")]
    [InlineData("user@")]
    [InlineData("user@.com")]
    [InlineData("user@domain")]
    [InlineData("user@domain.")]
    [InlineData("user@domain..com")]
    [InlineData("user@domain.c")]
    [InlineData("user@domain@com")]
    [InlineData("user@domain.com@")]
    [InlineData("user@domain_com")]
    public void ValidEmailAttribute_InvalidEmails_ShouldGiveValidationError(string invalidInput)
    {
        var validEmailAttribute = new ValidEmailAttribute();
        var result = validEmailAttribute.IsValid(invalidInput);
        result.Should().BeFalse();
    }

    [Theory]
    [InlineData("user@example.com")]
    [InlineData("john.doe123@gmail.co.uk")]
    [InlineData("jane_doe@company.org")]
    [InlineData("info@website.net")]
    [InlineData("support@myapp.io")]
    [InlineData("contact@blog.info")]
    [InlineData("sales@ecommerce.store")]
    [InlineData("admin@university.edu")]
    [InlineData("webmaster@forum.site")]
    [InlineData("hello@personal.name")]
    public void ValidEmailAttribute_ValidEmails_ShouldAcceptTheEmail(string validInput)
    {
        var validEmailAttribute = new ValidEmailAttribute();
        var result = validEmailAttribute.IsValid(validInput);
        result.Should().BeTrue();
    }
}