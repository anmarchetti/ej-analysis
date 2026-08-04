using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Mappers.Search.Filters;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search.Filters;

public class TransferDurationFilterTests
{
    private readonly TransferDurationFilter _sut = new();

    [Fact]
    public async Task FilterBy_WithNullOffers_Throws()
    {
        // Arrange
        var request = new PackagesSearchRequest { MinTransferDuration = 10, MaxTransferDuration = 20 };

        // Act
        var act = async () => await _sut.FilterBy(null, request);

        // Assert
        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task FilterBy_WithNoMinAndMax_ReturnsSameOffers()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer(5),
            CreateOffer(15)
        };
        var request = new PackagesSearchRequest();

        // Act
        var result = await _sut.FilterBy(offers, request);

        // Assert
        result.Should().BeEquivalentTo(offers);
    }

    [Theory]
    [InlineData(5, 15, 5, 15)]
    [InlineData(5, null, 5, 15)]
    [InlineData(null, 10, 0, 5)]
    public async Task FilterBy_FiltersByRange(int? min, int? max, int expectedMin, int expectedMax)
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer(null),
            CreateOffer(0),
            CreateOffer(5),
            CreateOffer(15)
        };
        var request = new PackagesSearchRequest { MinTransferDuration = min, MaxTransferDuration = max };

        // Act
        var result = await _sut.FilterBy(offers, request);

        // Assert
        result.Should().OnlyContain(offer =>
            (offer.TransferDuration ?? 0) >= expectedMin &&
            (offer.TransferDuration ?? 0) <= expectedMax);
    }

    [Fact]
    public async Task GetOptions_WithEmptyOffers_ReturnsEmpty()
    {
        // Arrange
        ApplyAllFiltersFunc applyAllOtherFilters = (set, request) => Task.FromResult(set);

        // Act
        var result = await _sut.GetOptions(new List<AvCacheResultOffersOfferExtended>(), new PackagesSearchRequest(), applyAllOtherFilters);

        // Assert
        result.Should().BeEquivalentTo(FilterOptions.Empty);
    }

    [Fact]
    public async Task GetOptions_WithNoNonZeroDurations_ReturnsEmpty()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer(null),
            CreateOffer(0)
        };
        ApplyAllFiltersFunc applyAllOtherFilters = (set, request) => Task.FromResult(set);

        // Act
        var result = await _sut.GetOptions(offers, new PackagesSearchRequest(), applyAllOtherFilters);

        // Assert
        result.Should().BeEquivalentTo(FilterOptions.Empty);
    }

    [Fact]
    public async Task GetOptions_WithValidDurations_ReturnsMinMaxAndCount()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer(null),
            CreateOffer(0),
            CreateOffer(10),
            CreateOffer(20)
        };
        ApplyAllFiltersFunc applyAllOtherFilters = (set, request) => Task.FromResult(set);

        // Act
        var result = await _sut.GetOptions(offers, new PackagesSearchRequest(), applyAllOtherFilters);

        // Assert
        result.Options.Should().ContainSingle();
        result.Options[0].MinTransferDuration.Should().Be(10);
        result.Options[0].MaxTransferDuration.Should().Be(20);
        result.Options[0].Count.Should().Be(2);
    }

    private static AvCacheResultOffersOfferExtended CreateOffer(int? transferDuration)
    {
        return new AvCacheResultOffersOfferExtended
        {
            TransferDuration = transferDuration
        };
    }
}

