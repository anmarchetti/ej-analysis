using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.AWS.LivePriceSync.Services;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Tests.Services;

public class OffersPreparationServiceTests
{
    private readonly Mock<IOffersMapper> _offersMapper;
    private readonly Mock<ILuggageOfferService> _luggageOfferService;
    private readonly Mock<IPromotionCollectionsService> _promotionCollectionsService;
    private readonly MarketSettings _marketSettings;

    private readonly OffersPreparationService _sut;

    public OffersPreparationServiceTests()
    {
        _offersMapper = new();
        _luggageOfferService = new();
        _promotionCollectionsService = new();
        _marketSettings = new();

        _sut = new(
            _offersMapper.Object,
            _luggageOfferService.Object,
            _promotionCollectionsService.Object,
            Options.Create(_marketSettings)
        );
    }

    [Fact]
    public async Task MapAndEnrichOffers_CompletesFlow()
    {
        // Arrange
        var input = new List<AvCacheResultOffersOffer>() { new() };

        var offers = new List<Offer>() { new(), };

        _offersMapper.Setup(
            mock => mock.ConvertOffers(input, It.IsAny<string[]>(), _marketSettings, null)
        ).ReturnsAsync(offers);

        // Act
        var result = await _sut.MapAndEnrichOffers(input, []);

        // Assert
        result.Should().BeEquivalentTo(offers);

        _luggageOfferService.Verify(mock => mock.EnrichOffersWithComplimentaryLuggage(offers));
        _promotionCollectionsService.Verify(mock => mock.EnrichWithPromotionCollectionsAsync(offers));
    }
}