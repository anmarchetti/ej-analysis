using AutoFixture;
using AutoFixture.AutoMoq;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Services;

public class PromotionCollectionsServiceTests
{
    private readonly Mock<ICacheService> _cacheServiceMock;
    private readonly Mock<IReferenceDataProvider> _referenceDataProviderMock;
    private readonly Mock<ILanguageService> _languageServiceMock;
    private readonly Mock<ILogger<PromotionCollectionsService>> _loggerMock;
    private readonly CacheSettings _cacheSettings;
    private readonly PromotionCollectionsService _sut;
    private readonly IFixture _fixture;
    private const string CurrentLanguage = "en-GB";

    public PromotionCollectionsServiceTests()
    {
        _fixture = new Fixture().Customize(new AutoMoqCustomization());
        
        _cacheServiceMock = new Mock<ICacheService>();
        _referenceDataProviderMock = new Mock<IReferenceDataProvider>();
        _languageServiceMock = new Mock<ILanguageService>();
        _loggerMock = new Mock<ILogger<PromotionCollectionsService>>();

        _cacheSettings = new CacheSettings
        {
            Buckets = new Buckets
            {
                PromotionCollections = "promotionCollections"
            }
        };

        var cacheSettingsOptions = Options.Create(_cacheSettings);

        _languageServiceMock.Setup(ls => ls.GetCurrentLanguage())
            .Returns(CurrentLanguage);

        _sut = new PromotionCollectionsService(
            _cacheServiceMock.Object,
            cacheSettingsOptions,
            _referenceDataProviderMock.Object,
            _loggerMock.Object,
            _languageServiceMock.Object);
    }

    [Fact]
    public async Task EnrichWithPromotionCollectionsAsync_WithNullOffers_ThrowsArgumentNullException()
    {
        // Act
        Func<Task> act = () => _sut.EnrichWithPromotionCollectionsAsync(null);

        // Assert
        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task EnrichWithPromotionCollectionsAsync_WithNullPromotionCollections_DoesNotEnrichOffers()
    {
        // Arrange
        var offers = new List<Offer> { new Offer() };
        _cacheServiceMock
            .Setup(cs => cs.GetOrAddAsync(
                _cacheSettings.Buckets.PromotionCollections, 
                It.Is<ICollection<string>>(keys => keys.Contains(SitecoreSettings.PromotionsCollectionsConfig.ToString()) && keys.Contains(CurrentLanguage)),
                It.IsAny<Func<Task<PromotionCollections>>>(),
                false))
            .ReturnsAsync((PromotionCollections)null);

        // Act
        await _sut.EnrichWithPromotionCollectionsAsync(offers);

        // Assert
        offers[0].PromotionCollections.Should().BeNull();
    }

    [Fact]
    public async Task EnrichWithPromotionCollectionsAsync_UsesCorrectLanguage()
    {
        // Arrange
        const string expectedLanguage = "fr-FR";
        var offers = new List<Offer> { new Offer() };
        
        _languageServiceMock.Setup(ls => ls.GetCurrentLanguage())
            .Returns(expectedLanguage);

        // Act
        await _sut.EnrichWithPromotionCollectionsAsync(offers);

        // Assert
        _cacheServiceMock.Verify(
            cs => cs.GetOrAddAsync(
                _cacheSettings.Buckets.PromotionCollections,
                It.Is<ICollection<string>>(keys => keys.Contains(SitecoreSettings.PromotionsCollectionsConfig.ToString()) && keys.Contains(expectedLanguage)),
                It.IsAny<Func<Task<PromotionCollections>>>(),
                false),
            Times.Once);
    }

    [Fact]
    public async Task EnrichWithPromotionCollectionsAsync_LogsDebugOnCacheMiss()
    {
        // Arrange
        var offers = new List<Offer> { new Offer() };
        
        _cacheServiceMock
            .Setup(cs => cs.GetOrAddAsync(
                It.IsAny<string>(),
                It.IsAny<ICollection<string>>(),
                It.IsAny<Func<Task<PromotionCollections>>>(),
                It.IsAny<bool>()))
            .Callback<string, ICollection<string>, Func<Task<PromotionCollections>>, bool>(
                async (bucket, keys, getData, forceUpdate) => await getData());

        // Act
        await _sut.EnrichWithPromotionCollectionsAsync(offers);

        // Assert
        _loggerMock.Verify(
            l => l.Log(
                LogLevel.Trace,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v!.ToString()!.Contains("Cache miss")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }
    
        [Fact]
    public async Task EnrichBookingResponsesWithPromotionCollectionsAsync_WithNullOffers_ThrowsArgumentNullException()
    {
        // Act
        Func<Task> act = () => _sut.EnrichBookingResponsesWithPromotionCollectionsAsync(null);

        // Assert
        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task EnrichBookingResponsesWithPromotionCollectionsAsync_WithNullPromotionCollections_DoesNotEnrichOffers()
    {
        // Arrange
        var bookingResponses = new List<BookingResponse> { new () };
        _cacheServiceMock
            .Setup(cs => cs.GetOrAddAsync(
                _cacheSettings.Buckets.PromotionCollections, 
                It.Is<ICollection<string>>(keys => keys.Contains(SitecoreSettings.PromotionsCollectionsConfig.ToString()) && keys.Contains(CurrentLanguage)),
                It.IsAny<Func<Task<PromotionCollections>>>(),
                false))
            .ReturnsAsync((PromotionCollections)null);

        // Act
        await _sut.EnrichBookingResponsesWithPromotionCollectionsAsync(bookingResponses);

        // Assert
        bookingResponses[0].PromotionCollections.Should().BeNull();
    }

    [Fact]
    public async Task EnrichBookingResponsesWithPromotionCollectionsAsync_UsesCorrectLanguage()
    {
        // Arrange
        const string expectedLanguage = "fr-FR";
        var bookingResponses = new List<BookingResponse> { new () };
        
        _languageServiceMock.Setup(ls => ls.GetCurrentLanguage())
            .Returns(expectedLanguage);

        // Act
        await _sut.EnrichBookingResponsesWithPromotionCollectionsAsync(bookingResponses);

        // Assert
        _cacheServiceMock.Verify(
            cs => cs.GetOrAddAsync(
                _cacheSettings.Buckets.PromotionCollections,
                It.Is<ICollection<string>>(keys => keys.Contains(SitecoreSettings.PromotionsCollectionsConfig.ToString()) && keys.Contains(expectedLanguage)),
                It.IsAny<Func<Task<PromotionCollections>>>(),
                false),
            Times.Once);
    }

    [Fact]
    public async Task EnrichBookingResponsesWithPromotionCollectionsAsync_LogsDebugOnCacheMiss()
    {
        // Arrange
        var bookingResponses = new List<BookingResponse> { new () };
        
        _cacheServiceMock
            .Setup(cs => cs.GetOrAddAsync(
                It.IsAny<string>(),
                It.IsAny<ICollection<string>>(),
                It.IsAny<Func<Task<PromotionCollections>>>(),
                It.IsAny<bool>()))
            .Callback<string, ICollection<string>, Func<Task<PromotionCollections>>, bool>(
                async (bucket, keys, getData, forceUpdate) => await getData());

        // Act
        await _sut.EnrichBookingResponsesWithPromotionCollectionsAsync(bookingResponses);

        // Assert
        _loggerMock.Verify(
            l => l.Log(
                LogLevel.Trace,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v!.ToString()!.Contains("Cache miss")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }
}