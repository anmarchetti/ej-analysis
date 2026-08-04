using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.TripAdvisor;
using easyJet.Holidays.Api.Domain.Data.Hotels.Reviews;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Dflo.Models.Search;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.TripAdvisor.Services;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace easyJet.Holidays.External.TripAdvisor.Tests.Services;

public class TripAdvisorAdaptorTests
{
    private readonly Mock<IOptions<TripAdvisorSettings>> _tripAdvisorSettings;
    private readonly Mock<IOptions<AwsSettings>> _settings;
    private readonly Mock<IApiService> _apiService;
    private readonly Mock<IAWSDbRepository<TripAdvisorCache>> _tripAdvisorRepository;
    private readonly IFixture _fixture;

    public TripAdvisorAdaptorTests()
    {
        _fixture = FixtureUtils.AutoMoqFixture();

        _tripAdvisorSettings = _fixture.Freeze<Mock<IOptions<TripAdvisorSettings>>>();
        _settings = _fixture.Freeze<Mock<IOptions<AwsSettings>>>();
        _apiService = _fixture.Freeze<Mock<IApiService>>();
        _tripAdvisorRepository = _fixture.Freeze<Mock<IAWSDbRepository<TripAdvisorCache>>>();

        _settings
            .Setup(x => x.Value)
            .Returns(new AwsSettings { TTL = new AwsSettingsTTL { TripAdvisorCache = 100 } });

        _tripAdvisorSettings.Setup(tas => tas.Value)
            .Returns(new TripAdvisorSettings { ReviewsDisplayed = 3, Host = "https://api.tripadvisor.com", Api = new TripAdvisorApiSettings() { Location = "/api/partner/2.0/location" } });
    }

    [Fact]
    public async Task GetReviews_ValidCacheData_ReturnsCache()
    {
        HotelReviews? expected;
        var id = "1234";
        var lang = "en";
        var key = $"{id}_{lang}";

        var cacheData = await File.ReadAllTextAsync("./cacheData.json");
        expected = JsonConvert.DeserializeObject<HotelReviews>(cacheData);

        TripAdvisorCache tripAdvisorCache = new() { Data = cacheData, Key = key, TTL = DateTime.UtcNow.AddSeconds(100) };

        _tripAdvisorRepository.Setup(tar => tar.GetItemAsync(tripAdvisorCache.Key))
            .ReturnsAsync(tripAdvisorCache);

        var sut = _fixture.Create<TripAdvisorAdaptor>();

        var result = await sut.GetReviews(id, lang);

        result.Should().BeEquivalentTo(expected);
        _tripAdvisorRepository.Verify();
    }

    [Fact]
    public async Task GetReviews_InvalidCacheData_CallsTripAdvisor()
    {
        HotelReviews? expected;
        var id = "1234";
        var lang = "en";
        var key = $"{id}_{lang}";

        var cacheData = await File.ReadAllTextAsync("./cacheData.json");
        var tripAdvisorResponse = JsonConvert.DeserializeObject<HotelReviews>(await File.ReadAllTextAsync("./tripAdvisorResponse.json"))!;
        expected = tripAdvisorResponse;

        TripAdvisorCache tripAdvisorCache = new() { Data = cacheData, Key = key, TTL = DateTime.UtcNow.AddSeconds(-100) };

        _tripAdvisorRepository.Setup(tar => tar.GetItemAsync(tripAdvisorCache.Key))
            .ReturnsAsync(tripAdvisorCache)
            .Verifiable();

        _tripAdvisorRepository.Setup(tar => tar.SaveAsync(It.IsAny<TripAdvisorCache>()))
            .Verifiable();

        _apiService.Setup(@as => @as.GetResponseContentAsync<LocationRequest, LocationResponse>(It.IsAny<LocationRequest>()))
            .ReturnsAsync(new LocationResponse() { Payload = new Domain.Models.Api.Payload.JsonApiPayload<HotelReviews> { Body = tripAdvisorResponse } });

        var sut = _fixture.Create<TripAdvisorAdaptor>();

        var result = await sut.GetReviews(id, lang);

        _tripAdvisorRepository.Verify();
        result.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public async Task GetReviews_NotEnoughReviews_ReturnsEmpty()
    {
        HotelReviews? expected = new();
        var id = "1234";
        var lang = "en";
        var key = $"{id}_{lang}";

        var cacheJsonData = await File.ReadAllTextAsync("./cacheData.json");
        var cachedData = JsonConvert.DeserializeObject<HotelReviews>(cacheJsonData)!;
        cachedData.Reviews = cachedData.Reviews.Take(1);

        TripAdvisorCache tripAdvisorCache = new() { Data = JsonConvert.SerializeObject(cachedData), Key = key, TTL = DateTime.UtcNow.AddSeconds(100) };

        _tripAdvisorRepository.Setup(tar => tar.GetItemAsync(tripAdvisorCache.Key))
            .ReturnsAsync(tripAdvisorCache)
            .Verifiable();

        var sut = _fixture.Create<TripAdvisorAdaptor>();

        var result = await sut.GetReviews(id, lang);

        result.Should().BeEquivalentTo(expected);
        _tripAdvisorRepository.Verify();
    }

    [Theory]
    [ClassData(typeof(TestData))]
    public async Task GetReviews_MixedEnoughResults_ReturnsReviewsForLanguage(string language, HotelReviews expectedHotelReviews)
    {
        _tripAdvisorSettings.Setup(tas => tas.Value)
            .Returns(new TripAdvisorSettings { ReviewsDisplayed = 1, Host = "https://api.tripadvisor.com", Api = new TripAdvisorApiSettings() { Location = "/api/partner/2.0/location" } });

        HotelReviews? expected = new();
        var id = "1234";
        var key = $"{id}_{language}";

        var cacheJsonData = await File.ReadAllTextAsync("./cacheData-mixedLanguages.json");
        var cachedData = JsonConvert.DeserializeObject<HotelReviews>(cacheJsonData)!;

        TripAdvisorCache tripAdvisorCache = new() { Data = JsonConvert.SerializeObject(cachedData), Key = key, TTL = DateTime.UtcNow.AddSeconds(100) };

        _tripAdvisorRepository.Setup(tar => tar.GetItemAsync(tripAdvisorCache.Key))
            .ReturnsAsync(tripAdvisorCache)
            .Verifiable();

        var sut = _fixture.Create<TripAdvisorAdaptor>();

        var result = await sut.GetReviews(id, language);

        result.Reviews.Should().BeEquivalentTo(expectedHotelReviews!.Reviews);
        _tripAdvisorRepository.Verify();
    }
}

internal class TestData : TheoryData<string, HotelReviews>
{
    static HotelReviews data = JsonConvert.DeserializeObject<HotelReviews>(File.ReadAllText("./cacheData-mixedLanguages.json"))!;

    public TestData()
    {
        Add("en",
            new HotelReviews()
            {
                Reviews = data.Reviews.Where(r => r.Lang == "en")
            });

        Add("fr-FR", new HotelReviews()
        {
            Reviews = data.Reviews.Where(r => r.Lang == "fr")
        });

        Add("fr-CH", new HotelReviews()
        {
            Reviews = data.Reviews.Where(r => r.Lang == "fr")
        });

        Add("de-CH", new HotelReviews() { Reviews = data.Reviews.Where(r => r.Lang == "de") });

        Add("de-DE", new HotelReviews() { Reviews = data.Reviews.Where(r => r.Lang == "de") });
    }

}