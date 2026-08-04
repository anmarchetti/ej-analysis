using easyJet.Holidays.Api.Domain.Data.DynamoDB.SearchPodValidation;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.MissedSearches;
using easyJet.Holidays.Tests.Domain;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.MissedSearches
{
    public class MissedSearchesServiceTests
    {
        private MissedSearchesService _sut;
        private Mock<ILanguageService> _languageServiceMock = new();
        private Mock<IMarketService> _marketServiceMock = new();
        private Mock<IAWSDbRepository<MissedDestinationSearch>> _missedDestinationSearchRepositoryMock = new();

        public MissedSearchesServiceTests()
        {
            _sut = new MissedSearchesService(
                _languageServiceMock.Object,
                _marketServiceMock.Object,
                _missedDestinationSearchRepositoryMock.Object);
        }

        [Theory]
        [InlineData("abc", "abc")]
        [InlineData("äöüß", "äöüß")]
        [InlineData("1a2b3c4", "*a*b*c*")]
        [InlineData("01.01.1900", "**********")]
        [InlineData("Password123", "Password***")]
        public void RedactSensitiveDataFromQueryTests(string input, string expected)
        {
            var result = MissedSearchesService.RedactSensitiveDataFromQuery(input);

            Assert.Equal(expected, result);
        }

        [Theory]
        [AutoMoqData]
        public async Task Save_CheckSavedData(string language, string market, int flexibleDays, DateTime? startDate, DateTime? endDate)
        {
            var query = "query";
            var from = "from";

            _languageServiceMock.Setup(x => x.GetCurrentLanguage()).Returns(language);
            _marketServiceMock.Setup(x => x.GetCurrentMarket()).Returns(new Domain.Data.Settings.MarketSettings { Code = market });

            await _sut.Save(query, from, flexibleDays, startDate, endDate);

            _missedDestinationSearchRepositoryMock
                .Verify(x => x.SaveAsync(It.Is<MissedDestinationSearch>(search =>
                    search.Language == language &&
                    search.Market == market &&
                    search.StartDate == startDate &&
                    search.EndDate == endDate &&
                    search.FlexibleDays == flexibleDays &&
                    search.Query == query &&
                    search.From == from)));
        }
    }
}
