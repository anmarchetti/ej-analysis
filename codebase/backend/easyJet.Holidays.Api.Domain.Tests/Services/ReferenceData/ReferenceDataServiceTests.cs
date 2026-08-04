using easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Settings.Ancillaries;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Cms.Models.ItemByPath;
using easyJet.Holidays.External.Domain.Api;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.ReferenceData;

public class ReferenceDataServiceTests
{
    private readonly ReferenceDataService _sut;
    private readonly Mock<ILanguageService> _languageServiceMock;
    private readonly Mock<IReferenceDataProvider> _referenceDataProviderMock;
    private readonly Mock<ICacheService> _cacheServiceMock;

    public ReferenceDataServiceTests()
    {
        _cacheServiceMock = new Mock<ICacheService>();
        _referenceDataProviderMock = new Mock<IReferenceDataProvider>();
        var cacheOptionsMock = new Mock<IOptions<CacheSettings>>();
        cacheOptionsMock.Setup(x => x.Value).Returns(new CacheSettings
        { Buckets = new Buckets { CmsGiataMappings = "CmsGiataMappings", CMSReferenceData = "CMSReferenceData" } });
        var b2BReferenceDataProviderMock = new Mock<IB2BReferenceDataProvider>();
        var loggerMock = new Mock<ILogger<ReferenceDataService>>();
        _languageServiceMock = new Mock<ILanguageService>();

        _sut = new ReferenceDataService(_referenceDataProviderMock.Object, _cacheServiceMock.Object,
            cacheOptionsMock.Object, b2BReferenceDataProviderMock.Object, loggerMock.Object,
            _languageServiceMock.Object, null);
    }

    [Theory]
    [InlineData("fr-CH")]
    [InlineData("de-CH")]
    [InlineData("en")]
    public async Task GiataMapping_ShouldBeStoredAccordingToCurrentLanguage(string language)
    {
        // Arrange
        const string accomodationId = "FDF1010231";
        const string giataCode = "1111";
        _referenceDataProviderMock.Setup(x =>
                x.GetAccommodationToGiataMappings(
                    language, It.Is<IEnumerable<string>>(request => request.Contains(accomodationId))))
            .ReturnsAsync(new Dictionary<string, string>
            {
                { accomodationId, giataCode }
            });
        _languageServiceMock.Setup(x => x.GetCurrentLanguage()).Returns(language);

        // Act
        await _sut.GetAccommodationToGiataMappings(new[] { accomodationId });

        // Assert
        _cacheServiceMock.Verify(x => x.GetOrAddAsync(
                It.IsAny<string>(),
                It.Is<ICollection<string>>(col => col.First() == accomodationId && col.Skip(1).First() == language),
                It.IsAny<Func<Task<string>>>(),
                It.IsAny<bool>()),
            Times.Exactly(1));
    }

    [Fact]
    public async Task GetComplimentarySettings_CacheMiss_ReturnsComplimentarySettings()
    {
        // Arrange
        var language = "en";
        var sitecoreSettings = new SitecoreComplimentarySettings
        {
            Complements = new[]
            {
                new PromotionComplements
                {
                    Codes = new[] { "EUBO" },
                    Luggage = new[]
                    {
                        new ComplimentaryLuggage { Code = "LUG", Quantity = (1, 1, 0) }
                    }
                }
            }
        };
        _cacheServiceMock
            .Setup(x => x.GetOrAddAsync(
                It.IsAny<string>(),
                It.IsAny<ICollection<string>>(),
                It.IsAny<Func<Task<ComplimentarySettings>>>(),
                It.IsAny<bool>())
            )
            .Returns((string _, IEnumerable<object> _, Func<Task<ComplimentarySettings>> factory,
                bool _) => factory());
        _referenceDataProviderMock
            .Setup(x => x.GetSitecoreSetting<SitecoreComplimentarySettings>(
                SitecoreSettings.ComplimentarySettings,
                language,
                It.IsAny<bool>())
            )
            .ReturnsAsync(sitecoreSettings);

        // Act
        var result = await _sut.GetComplimentarySettings(language);

        // Assert
        result.Should().BeEquivalentTo(new ComplimentarySettings(sitecoreSettings));
    }

    [Fact]
    public async Task GetComplimentarySettings_CacheHit_ReturnsComplimentarySettings()
    {
        // Arrange
        var language = "en";
        var cachedSettings = new ComplimentarySettings(new SitecoreComplimentarySettings
        {
            Complements = new[]
            {
                new PromotionComplements
                {
                    Codes = new[] { "EUBO" },
                    Luggage = new[]
                    {
                        new ComplimentaryLuggage { Code = "LUG", Adult = 1, Child = 1, Infant = 0 }
                    }
                }
            }
        });
        _cacheServiceMock
            .Setup(x => x.GetOrAddAsync(
                It.IsAny<string>(),
                It.IsAny<ICollection<string>>(),
                It.IsAny<Func<Task<ComplimentarySettings>>>(),
                It.IsAny<bool>()
            ))
            .ReturnsAsync(cachedSettings);

        // Act
        var result = await _sut.GetComplimentarySettings(language);

        // Assert
        result.Should().BeEquivalentTo(cachedSettings);
    }

    [Fact]
    public void ComplimentarySettings_MapsSitecoreAncillarySettings_Correctly()
    {
        // Arrange
        var sitecoreSettings = new SitecoreComplimentarySettings
        {
            Complements = new[]
            {
                new PromotionComplements
                {
                    Codes = new[] { "EUBO", "DEBO" },
                    Luggage = new[]
                    {
                        new ComplimentaryLuggage { Code = "LUG", Quantity = (1, 1, 0) }
                    }
                }
            }
        };

        // Act
        var result = new ComplimentarySettings(sitecoreSettings);

        // Assert
        result.ComplimentaryIndex.Should().BeEquivalentTo(new Dictionary<string, PromotionComplements>
        {
            {
                "EUBO",
                new PromotionComplements
                {
                    Codes = new[] { "EUBO", "DEBO" },
                    Luggage = new[] { new ComplimentaryLuggage { Code = "LUG", Quantity = (1, 1, 0) } }
                }
            },
            {
                "DEBO",
                new PromotionComplements
                {
                    Codes = new[] { "EUBO", "DEBO" },
                    Luggage = new[] { new ComplimentaryLuggage { Code = "LUG", Quantity = (1, 1, 0) } }
                }
            }
        });
    }

    [Fact]
    public void ComplimentarySettings_MapsEmptySitecoreAncillarySettings_Correctly()
    {
        // Arrange
        var sitecoreSettings = new SitecoreComplimentarySettings { Complements = Array.Empty<PromotionComplements>() };

        // Act
        var result = new ComplimentarySettings(sitecoreSettings);

        // Assert
        result.ComplimentaryIndex.Should().BeEmpty();
    }

    [Fact]
    public void ComplimentarySettings_DeserializeResponseValidJson_ReturnsCorrectObject()
    {
        // Arrange
        var json = @"{
            'Children': [
                {
                    'Comment': 'Beach Holiday complimentary, 23kg for each adult or child',
                    'PromotionType': 'beach-holiday',
                    'PromotionCodes': 'EUBO, DEBO',
                    'Children': [
                        {
                            'Code': 'LUG',
                            'Adult': '1',
                            'Infant': '0',
                            'Child': '1'
                        }
                    ]
                }
            ]
        }";
        var apiClientMock = new Mock<IApiClient>();
        var apiService = new TestApiService(apiClientMock.Object);

        // Act
        var response = apiService.DeserializeResponse<ItemByPathResponse<SitecoreComplimentarySettings>>(json);

        // Assert
        response.Payload.Body.Should().BeEquivalentTo(new SitecoreComplimentarySettings
        {
            Complements = new[]
            {
                new PromotionComplements
                {
                    Comment = "Beach Holiday complimentary, 23kg for each adult or child",
                    PromotionType = "beach-holiday",
                    Codes = new[] { "EUBO", "DEBO" },
                    Luggage = new[]
                    {
                        new ComplimentaryLuggage { Code = "LUG", Quantity = (1, 1, 0) }
                    }
                }
            }
        });
    }

    [Fact]
    public void LuggageSettings_DeserializeResponseValidJson_ReturnsCorrectObject()
    {
        // Arrange
        var json = @"{'LuggageCategories' :[
            {
                'Code': 'CABI',
                'Name': 'Cabin Bags',
                'Type': 'Cabin Bags',
                'Children': [
                    {
                        'Code': 'SCB1',
                        'Name': 'Large Cabin Bags',
                        'Description': '',
                        'Icon': '/-/jssmedia/464888db56b84dfab6fb182f7623cef2.ashx',
                        'IsLuggageItemEnabled': true
                    }
                ]
            },
            {
                'Code': 'ADDB',
                'Name': 'Extra Hold Luggage',
                'Type': 'Bag',
                'Children': [
                    {
                        'Code': 'LUSE',
                        'Name': 'extra 15kg hold bag',
                        'Description': 'Maximum 15kg per bag, stored in the plane hold. Outbound and return.',
                        'Icon': '/-/jssmedia/464888db56b84dfab6fb182f7623cef2.ashx',
                        'IsLuggageItemEnabled': true
                    },
                    {
                        'Code': 'LUGE',
                        'Name': 'extra 23kg hold bag',
                        'Description': 'Maximum 23kg per bag, stored in the plane hold. Outbound and return.',
                        'Icon': '/-/jssmedia/84aae8b301394b87bb0f76eb2279cfd9.ashx',
                        'IsLuggageItemEnabled': true
                    },
                    {
                        'Codes': ['LUSE', 'LUGE'],
                        'Type': 'CombinedLuggageItem',
                        'Name': 'extra 38 kg hold bag',
                        'Description': 'Maximum 38kg per bag, stored in the plane hold. Outbound and return.',
                        'Icon': '/-/jssmedia/84aae8b301394b87bb0f76eb2279cfd9.ashx',
                        'IsLuggageItemEnabled': true
                    }
                ]
            },
        ]}";

        var settings = new JsonSerializerSettings();
        settings.Converters.Add(new LuggageItemConverter());

        // Act
        var response = JsonConvert.DeserializeObject<Domain.Data.ReferenceData.Luggage.Luggage>(json, settings);

        // Assert
        response.Should().NotBeNull();
        response?.LuggageCategories.Count.Should().Be(2);
        response?.LuggageCategories.ElementAt(1).LuggageItems.First(i => i.GetType() == typeof(CombinedLuggageItem)).Should().NotBeNull();
    }

    [Fact]
    public async Task GetExternalExtras_WhenSettingIsFound_ReturnsCorrectly()
    {
        // Arrange
        ExternalExtrasSettings expectedSettings = new() { IsExternalExtrasEnabledString = "1" };
        _cacheServiceMock.Setup(c => c.GetOrAddAsync(
            It.IsAny<string>(), It.IsAny<ICollection<string>>(), It.IsAny<Func<Task<ExternalExtrasSettings>>>(),
            It.IsAny<bool>())).ReturnsAsync(expectedSettings);
        // Act
        ExternalExtrasSettings settings = await _sut.GetExternalExtrasSettings();

        // Assert
        settings.Should().BeEquivalentTo(expectedSettings);
    }

    [Fact]
    public async Task GetExternalExtras_WhenSettingIsNotFound_ReturnsToggleOff()
    {
        // Arrange
        ExternalExtrasSettings toggleOff = new() { IsExternalExtrasEnabledString = "0" };
        _cacheServiceMock.Setup(c => c.GetOrAddAsync(
            It.IsAny<string>(), It.IsAny<ICollection<string>>(), It.IsAny<Func<Task<ExternalExtrasSettings>>>(),
            It.IsAny<bool>())).ThrowsAsync(new Exception("error when loading setting"));

        // Act
        ExternalExtrasSettings settings = await _sut.GetExternalExtrasSettings();

        // Assert
        settings.Should().BeEquivalentTo(toggleOff);
    }
    
    [Fact]
    public async Task GetTradeAgentFeedbackAttachedFileSettings_WhenSettingIsNotFound_ReturnsDefaultSetting()
    {
        // Arrange
        AttachedFileSettings expectedSettings = new();
        _cacheServiceMock.Setup(c => c.GetOrAddAsync(
            It.IsAny<string>(), It.IsAny<ICollection<string>>(), It.IsAny<Func<Task<AttachedFileSettings>>>(),
#pragma warning disable CA2201
            It.IsAny<bool>())).ThrowsAsync(new Exception("error when loading setting"));
#pragma warning restore CA2201

        // Act
        AttachedFileSettings settings = await _sut.GetTradeAgentFeedbackAttachedFileSettings();

        // Assert
        settings.Should().BeEquivalentTo(expectedSettings);
    }
    
    [Fact]
    public async Task GetTradeAgentFeedbackAttachedFileSettings_WhenSettingIsFound_ReturnsExpectedSetting()
    {
        // Arrange
        AttachedFileSettings expectedSettings = new() { MaxFileCount = 3, MaxFileSize = 10, AllowedFileExtensions = ".jpg" };
        _cacheServiceMock.Setup(c => c.GetOrAddAsync(
            It.IsAny<string>(), It.IsAny<ICollection<string>>(), It.IsAny<Func<Task<AttachedFileSettings>>>(),
            It.IsAny<bool>())).ReturnsAsync(expectedSettings);

        // Act
        AttachedFileSettings settings = await _sut.GetTradeAgentFeedbackAttachedFileSettings();

        // Assert
        settings.Should().BeEquivalentTo(expectedSettings);
    }

    [Fact]
    public async Task GetAllTransferDurations_WhenCacheReturnsData_ReturnsExpected()
    {
        // Arrange
        var expected = new Dictionary<string, int> { { "P123", 45 } };
        _cacheServiceMock.Setup(c => c.GetOrAddAsync(
            It.IsAny<string>(),
            It.IsAny<ICollection<string>>(),
            It.IsAny<Func<Task<Dictionary<string, int>>>>(),
            It.IsAny<bool>())).ReturnsAsync(expected);

        // Act
        var result = await _sut.GetAllTransferDurations();

        // Assert
        result.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public async Task GetAllTransferDurations_WhenCacheThrows_ReturnsEmptyDictionary()
    {
        // Arrange
        _cacheServiceMock.Setup(c => c.GetOrAddAsync(
            It.IsAny<string>(),
            It.IsAny<ICollection<string>>(),
            It.IsAny<Func<Task<Dictionary<string, int>>>>(),
            It.IsAny<bool>()))
#pragma warning disable CA2201
            .ThrowsAsync(new Exception("cache error"));
#pragma warning restore CA2201

        // Act
        var result = await _sut.GetAllTransferDurations();

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetFilterPillsConfig_CacheHit_ReturnsExpectedConfig()
    {
        // Arrange
        var language = "en";
        var expected = new Api.Domain.Data.ReferenceData.FilterPillsConfig
        {
            RecommendedFilterConfig = new Api.Domain.Data.ReferenceData.RecommendedFilterConfig
            {
                MinNumberOfOffers = 5,
                Options = new List<Api.Domain.Data.ReferenceData.FilterPillOption>
                {
                    new Api.Domain.Data.ReferenceData.FilterPillOption
                    {
                        FilterCode = Api.Domain.Data.Filters.AvailableFilters.Board,
                        Code = "AI",
                        Name = "All Inclusive"
                    },
                    new Api.Domain.Data.ReferenceData.FilterPillOption
                    {
                        FilterCode = Api.Domain.Data.Filters.AvailableFilters.StarRating,
                        Code = "5",
                        Name = "5 Star Hotels"
                    }
                }
            }
        };

        _languageServiceMock.Setup(x => x.GetCurrentLanguage()).Returns(language);
        _cacheServiceMock.Setup(c => c.GetOrAddAsync(
            It.IsAny<string>(),
            It.IsAny<ICollection<string>>(),
            It.IsAny<Func<Task<Api.Domain.Data.ReferenceData.FilterPillsConfig>>>(),
            It.IsAny<bool>())).ReturnsAsync(expected);

        // Act
        var result = await _sut.GetFilterPillsConfig();

        // Assert
        result.Should().BeEquivalentTo(expected);
        result.RecommendedFilterConfig.MinNumberOfOffers.Should().Be(5);
        result.RecommendedFilterConfig.Options.Should().HaveCount(2);
        result.RecommendedFilterConfig.Options[0].Code.Should().Be("AI");
        result.RecommendedFilterConfig.Options[1].Code.Should().Be("5");
    }

    [Fact]
    public async Task GetFilterPillsConfig_WhenCacheThrows_ReturnsEmptyConfig()
    {
        // Arrange
        var language = "en";
        _languageServiceMock.Setup(x => x.GetCurrentLanguage()).Returns(language);
        _cacheServiceMock.Setup(c => c.GetOrAddAsync(
            It.IsAny<string>(),
            It.IsAny<ICollection<string>>(),
            It.IsAny<Func<Task<Api.Domain.Data.ReferenceData.FilterPillsConfig>>>(),
            It.IsAny<bool>()))
#pragma warning disable CA2201
            .ThrowsAsync(new Exception("cache error"));
#pragma warning restore CA2201

        // Act
        var result = await _sut.GetFilterPillsConfig();

        // Assert
        result.Should().NotBeNull();
        result.Options.Should().BeEmpty();
    }

    [Theory]
    [InlineData("en")]
    [InlineData("fr-CH")]
    [InlineData("de-CH")]
    public async Task GetFilterPillsConfig_DifferentLanguages_UsesCacheWithCorrectLanguage(string language)
    {
        // Arrange
        var expected = new Api.Domain.Data.ReferenceData.FilterPillsConfig
        {
            RecommendedFilterConfig = new Api.Domain.Data.ReferenceData.RecommendedFilterConfig
            {
                MinNumberOfOffers = 3,
                Options = new List<Api.Domain.Data.ReferenceData.FilterPillOption>
                {
                    new Api.Domain.Data.ReferenceData.FilterPillOption
                    {
                        FilterCode = Api.Domain.Data.Filters.AvailableFilters.Destination,
                        Code = "PMI",
                        Name = "Majorca"
                    }
                }
            }
        };

        _languageServiceMock.Setup(x => x.GetCurrentLanguage()).Returns(language);
        _referenceDataProviderMock.Setup(x => x.GetFilterPillsConfig(language))
            .ReturnsAsync(expected);
        _cacheServiceMock.Setup(c => c.GetOrAddAsync(
            It.IsAny<string>(),
            It.IsAny<ICollection<string>>(),
            It.IsAny<Func<Task<Api.Domain.Data.ReferenceData.FilterPillsConfig>>>(),
            It.IsAny<bool>())).ReturnsAsync(expected);

        // Act
        await _sut.GetFilterPillsConfig();

        // Assert
        _cacheServiceMock.Verify(x => x.GetOrAddAsync(
                It.IsAny<string>(),
                It.Is<ICollection<string>>(col => col.Contains(language)),
                It.IsAny<Func<Task<Api.Domain.Data.ReferenceData.FilterPillsConfig>>>(),
                It.IsAny<bool>()),
            Times.Once);
    }

    private class TestApiService : ApiService
    {
        public TestApiService(IApiClient apiClient) : base(apiClient)
        {
        }
    }
}