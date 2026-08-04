using AutoFixture;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Cms.Services;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Cms.Tests.Services
{
    public class HotelsSearchServiceTests
    {
        private readonly IFixture _fixture;

        public HotelsSearchServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _fixture.Inject(Options.Create(new CmsSettings
            {
                Host = "http://cms-domain",
                Api = new CmsApiSettings(),
            }));
        }

        [Theory]
        [MemberData(nameof(MissingCodesTestData))]
        public async Task GetMissingCodes_EmptyCache(string because, HashSet<string> cached, List<string> ids, List<string> expected)
        {
            var refDataMock = _fixture.Freeze<Mock<IReferenceDataService>>();
            refDataMock.Setup(x => x.GetHotelCodes()).ReturnsAsync(cached);

            var sut = _fixture.Freeze<HotelsSearchService>();

            var actual = await sut.GetMissingCodes(ids);

            actual.Should().BeEquivalentTo(expected, because);
        }

        public static IEnumerable<object[]> MissingCodesTestData()
        {
            yield return new object[]
            {
                "Null cache. Everything is valid",
                null,
                new List<string> {"1", "2", "3"},
                new List<string>()
            };

            yield return new object[]
            {
                "Empty cache. Everything is valid",
                new HashSet<string>(),
                new List<string> {"1", "2", "3"},
                new List<string>()
            };

            yield return new object[]
            {
                "Everything in cache",
                new HashSet<string> {"1", "2", "3", "4"},
                new List<string> {"1", "2", "3"},
                new List<string>()
            };

            yield return new object[]
            {
                "Some missing in cache",
                new HashSet<string> {"1", "2", "3", "4"},
                new List<string> {"14", "2", "23"},
                new List<string> {"14", "23"}
            };
        }
    }
}