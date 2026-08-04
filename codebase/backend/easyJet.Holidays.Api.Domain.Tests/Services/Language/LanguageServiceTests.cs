using AutoFixture;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Language
{
    public class LanguageServiceTests
    {
        private readonly IFixture _fixture;

        public LanguageServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _fixture.Inject(Options.Create(new LanguageSettings { DefaultLanguage = "en" }));
            _fixture.Inject(Options.Create(new CookiesSettings { }));
        }

        [Fact]
        public async Task GetCurrentLanguage_NoContext_ReturnsDefaultLanguage()
        {
            var httpAccessor = _fixture.Freeze<Mock<IHttpContextAccessor>>();
            httpAccessor.Setup(x => x.HttpContext).Returns(() => null);

            var sut = _fixture.Create<LanguageService>();
            var result = sut.GetCurrentLanguage();
            Assert.Equal("en", result);
        }
    }
}
