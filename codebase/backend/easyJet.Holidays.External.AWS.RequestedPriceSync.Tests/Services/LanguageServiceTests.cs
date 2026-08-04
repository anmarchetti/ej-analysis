using easyJet.Holidays.External.AWS.RequestedPriceSync.Services;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Tests.Services;

public class LanguageServiceTests
{
    private const string InitialLanguage = "tst";

    private readonly LanguageService _sut;

    public LanguageServiceTests()
    {
        _sut = new LanguageService(InitialLanguage);
    }

    [Fact]
    public void GetCurrentLanguage_WithoutSetting_ReturnsInitial()
    {
        // Arrange

        // Act
        var result = _sut.GetCurrentLanguage();

        // Assert
        result.Should().Be(InitialLanguage);
    }

    [Fact]
    public void GetDefaultLanguage_WithoutSetting_ReturnsInitial()
    {
        // Arrange

        // Act
        var result = _sut.GetCurrentLanguage();

        // Assert
        result.Should().Be(InitialLanguage);
    }

    [Fact]
    public void SetLanguage_WhenLanguageIsNull_Throws()
    {
        // Arrange

        // Act
        var action = () => _sut.SetLanguage(null);

        // Assert
        action.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void SetLanguage_ForValidLanguage_OverwritesInitial()
    {
        // Arrange
        const string newLanguage = "myNewFavouriteLanguage";

        // Act
        _sut.SetLanguage(newLanguage);

        var result = _sut.GetCurrentLanguage();

        // Assert
        result.Should().NotBe(InitialLanguage).And.Be(newLanguage);
    }
}