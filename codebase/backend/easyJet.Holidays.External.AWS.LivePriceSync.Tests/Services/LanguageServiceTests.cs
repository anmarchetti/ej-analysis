using easyJet.Holidays.External.AWS.LivePriceSync.Services;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Tests.Services;

public class LanguageServiceTests
{
    private readonly LanguageService _sut;

    public LanguageServiceTests()
    {
        _sut = new LanguageService(string.Empty);
    }

    [Fact]
    public void SetLanguage_ReturnsLanguage()
    {
        var lang = "en";

        _sut.SetLanguage(lang);

        _sut.GetCurrentLanguage().Should().Be(lang);
    }
}
