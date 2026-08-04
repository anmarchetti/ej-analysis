using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.Hotels.Facilities;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Themes;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Cms.Tests.Services
{
    public class ReferenceDataServiceTests
    {
        private readonly IFixture _fixture;

        public ReferenceDataServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            var cacheSettings = Options.Create(new CacheSettings
            {
                Buckets = new Buckets
                {
                    CMSReferenceData = "CMSReferenceData"
                }
            });
            _fixture.Inject(cacheSettings);
        }

        [Theory]
        [MemberData(nameof(AllLanguagesTestData))]
        public async Task RefreshCacheDataByLanguage_CacheKeyContainsLanguage(string language)
        {
            var langService = _fixture.Freeze<Mock<ILanguageService>>();
            langService.Setup(x => x.GetCurrentLanguage()).Returns(language);

            var cacheServiceMock = _fixture.Freeze<Mock<ICacheService>>();

            var sut = _fixture.Freeze<ReferenceDataService>();

            await sut.RefreshCacheData(new[] { language });

            VerifyGetOrAddAsync_CacheKeyContainsLanguage<List<Holidays.Api.Domain.Data.ReferenceData.Airport>>(cacheServiceMock, language);
            VerifyGetOrAddAsync_CacheKeyContainsLanguage<List<Holidays.Api.Domain.Data.ReferenceData.Country>>(cacheServiceMock, language);
            VerifyGetOrAddAsync_CacheKeyContainsLanguage<List<DialingCode>>(cacheServiceMock, language);
            VerifyGetOrAddAsync_CacheKeyContainsLanguage<List<Holidays.Api.Domain.Data.ReferenceData.BoardType>>(cacheServiceMock, language);
            VerifyGetOrAddAsync_CacheKeyContainsLanguage<List<FilteredFacility>>(cacheServiceMock, language);
            VerifyGetOrAddAsync_CacheKeyContainsLanguage<List<PackageTheme>>(cacheServiceMock, language);
            VerifyGetOrAddAsync_CacheKeyContainsLanguage<SpecialRequests>(cacheServiceMock, language);
            VerifyGetOrAddAsync_CacheKeyContainsLanguage<List<DestinationItem>>(cacheServiceMock, language);
            VerifyGetOrAddAsync_CacheKeyContainsLanguage<List<FlightFilters>>(cacheServiceMock, language);
            VerifyGetOrAddAsync_CacheKeyContainsLanguage<Dictionary<string, HotelTransfer>>(cacheServiceMock, language);
        }

        private void VerifyGetOrAddAsync_CacheKeyContainsLanguage<T>(Mock<ICacheService> cacheService, string language)
        {
            cacheService.Verify(x => x.GetOrAddAsync(It.IsAny<string>(), It.Is<string[]>(keys => keys.Contains(language)), It.IsAny<Func<Task<T>>>(), It.IsAny<bool>()));
        }

        public static IEnumerable<object[]> AllLanguagesTestData()
        {
            yield return new object[] { "en" };
            yield return new object[] { "de-CH" };
            yield return new object[] { "fr-CH" };
        }
    }
}
