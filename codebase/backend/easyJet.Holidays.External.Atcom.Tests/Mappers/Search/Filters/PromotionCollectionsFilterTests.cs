using System.Collections.ObjectModel;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.External.Atcom.Mappers.Search.Filters;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Services;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search.Filters;

public class PromotionCollectionsFilterTests
{
    private readonly Mock<IPromotionCollectionsService> _promotionCollectionsServiceMock;
    private readonly PromotionCollectionsFilter _sut;

    public PromotionCollectionsFilterTests()
    {
        _promotionCollectionsServiceMock = new Mock<IPromotionCollectionsService>();
        _sut = new PromotionCollectionsFilter(_promotionCollectionsServiceMock.Object);
    }

    [Fact]
    public void Constructor_NullService_ThrowsArgumentNullException()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => new PromotionCollectionsFilter(null));
    }

    #region Count Method Tests

    [Fact]
    public async Task Count_WhenFilterOptionsIsNull_ThrowsArgumentNullException()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>();
        var request = new PackagesSearchRequest();

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.Count(offers, null, request));
    }

    [Fact]
    public async Task Count_WhenOffersIsNull_SetsCountsCorrectly()
    {
        // Arrange
        var filterOptions = new FilterOptions
        {
            Options = new List<FilterOption>
            {
                new FilterOption { Code = "Collection1", Name = "Promotion 1", Count = 0 }
            }
        };
        var request = new PackagesSearchRequest();

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new KeyedPromotion("Collection1", "PROMO1,PROMO2", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1")
                })
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        await _sut.Count(null, filterOptions, request);

        // Assert
        filterOptions.Options[0].Count.Should().Be(0);
    }

    [Fact]
    public async Task Count_WhenOffersIsEmpty_SetsCountsToZero()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>();
        var filterOptions = new FilterOptions
        {
            Options = new List<FilterOption>
            {
                new FilterOption { Code = "Collection1", Name = "Promotion 1", Count = 0 }
            }
        };
        var request = new PackagesSearchRequest();

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new KeyedPromotion("Collection1", "PROMO1,PROMO2", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1")
                })
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        await _sut.Count(offers, filterOptions, request);

        // Assert
        filterOptions.Options[0].Count.Should().Be(0);
    }

    [Fact]
    public async Task Count_ValidOffersAndFilterOptions_SetsCountsCorrectly()
    {
        // Arrange
        var offers = CreateOffersList(new[] { "PROMO1", "PROMO1", "PROMO2", "PROMO3" });
        var filterOptions = new FilterOptions
        {
            Options = new List<FilterOption>
            {
                new FilterOption { Code = "Collection1", Name = "Promotion 1", Count = 0 }
            }
        };
        var request = new PackagesSearchRequest();

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new KeyedPromotion("Collection1", "PROMO1,PROMO2", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1")
                })
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        await _sut.Count(offers, filterOptions, request);

        // Assert
        filterOptions.Options[0].Count.Should().Be(3); // 2 offers with PROMO1 + 1 offer with PROMO2
    }

    [Fact]
    public async Task Count_CaseInsensitiveMatching_SetsCountsCorrectly()
    {
        // Arrange
        var offers = CreateOffersList(new[] { "promo1", "PROMO1", "Promo2" });
        var filterOptions = new FilterOptions
        {
            Options = new List<FilterOption>
            {
                new FilterOption { Code = "Collection1", Name = "Promotion 1", Count = 0 }
            }
        };
        var request = new PackagesSearchRequest();

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new KeyedPromotion("Collection1", "PROMO1,PROMO2", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1")
                })
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        await _sut.Count(offers, filterOptions, request);

        // Assert
        filterOptions.Options[0].Count.Should().Be(3); // Case insensitive matching should count all offers
    }

    [Fact]
    public async Task Count_MultipleFilterOptions_SetsAllOptionsToSameCount()
    {
        // Arrange
        var offers = CreateOffersList(new[] { "PROMO1", "PROMO2" });
        var filterOptions = new FilterOptions
        {
            Options = new List<FilterOption>
            {
                new FilterOption { Code = "Collection1", Name = "Promotion 1", Count = 0 },
                new FilterOption { Code = "Collection2", Name = "Promotion 2", Count = 0 }
            }
        };
        var request = new PackagesSearchRequest();

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new KeyedPromotion("Collection1", "PROMO1,PROMO2", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1")
                })
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        await _sut.Count(offers, filterOptions, request);

        // Assert
        filterOptions.Options[0].Count.Should().Be(2);
        filterOptions.Options[1].Count.Should().Be(0);
        // All filter options should have the same count regardless of their code
    }

    #endregion

    [Fact]
    public async Task FilterBy_NullOffers_ThrowsArgumentNullException()
    {
        // Arrange
        PackagesSearchRequest request = new();

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.FilterBy(null, request));
    }

    [Fact]
    public async Task FilterBy_NullRequest_ThrowsArgumentNullException()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>();

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.FilterBy(offers, null));
    }

    [Fact]
    public async Task FilterBy_EmptyPromc_ReturnsAllOffers()
    {
        // Arrange
        var offers = CreateOffersList(new[] { "PROMO1", "PROMO2" });
        var request = new PackagesSearchRequest
        {
            Promc = string.Empty
        };

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new KeyedPromotion("Collection1", "PROMO1", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1")
                })
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        var result = await _sut.FilterBy(offers, request);

        // Assert
        result.Should().BeEquivalentTo(offers);
    }

    [Fact]
    public async Task FilterBy_NullPromc_ReturnsAllOffers()
    {
        // Arrange
        var offers = CreateOffersList(new[] { "PROMO1", "PROMO2" });
        var request = new PackagesSearchRequest
        {
            Promc = null
        };

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new KeyedPromotion("Collection1", "PROMO1", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1")
                })
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        var result = await _sut.FilterBy(offers, request);

        // Assert
        result.Should().BeEquivalentTo(offers);
    }

    [Fact]
    public async Task FilterBy_NullConfig_ReturnsAllOffers()
    {
        // Arrange
        var offers = CreateOffersList(new[] { "PROMO1", "PROMO2" });
        var request = new PackagesSearchRequest
        {
            Promc = "Collection1"
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync((PromotionCollections)null);

        // Act
        var result = await _sut.FilterBy(offers, request);

        // Assert
        result.Should().BeEquivalentTo(offers);
    }

    [Fact]
    public async Task FilterBy_EmptyConfigChildren_ReturnsAllOffers()
    {
        // Arrange
        var offers = CreateOffersList(new[] { "PROMO1", "PROMO2" });
        var request = new PackagesSearchRequest
        {
            Promc = "Collection1"
        };

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(new List<KeyedPromotion>())
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        var result = await _sut.FilterBy(offers, request);

        // Assert
        result.Should().BeEquivalentTo(offers);
    }

    [Fact]
    public async Task FilterBy_NoMatchingPromotionCodes_ReturnsAllOffers()
    {
        // Arrange
        var offers = CreateOffersList(new[] { "PROMO1", "PROMO2" });
        var request = new PackagesSearchRequest
        {
            Promc = "Collection99" // Non-existing collection
        };

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new KeyedPromotion("Collection1", "PROMO11", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1")
                })
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        var result = await _sut.FilterBy(offers, request);

        // Assert
        result.Count.Should().Be(offers.Count);
    }

    [Fact]
    public async Task FilterBy_PromotionCodesIsNullOrEmpty_ReturnsAllOffers()
    {
        // Arrange
        var offers = CreateOffersList(new[] { "PROMO1", "PROMO2" });
        var request = new PackagesSearchRequest
        {
            Promc = "Collection1"
        };

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new KeyedPromotion("Collection1", "", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1")
                })
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        var result = await _sut.FilterBy(offers, request);

        // Assert
        result.Should().BeEquivalentTo(offers);
    }

    [Fact]
    public async Task FilterBy_MatchingPromotionCodes_ReturnsFilteredOffers()
    {
        // Arrange
        var offers = CreateOffersList(new[] { "PROMO1", "PROMO2", "PROMO3" });
        var request = new PackagesSearchRequest
        {
            Promc = "Collection1"
        };

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new KeyedPromotion("Collection1", "PROMO1,PROMO3", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1"),
                    new KeyedPromotion("Collection2", "PROMO2", "0", "Promotion 2", "Tooltip 2", "icon2", "Tracking Promotion 2")
                })
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        var result = await _sut.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(o => o.Accom.First().Prom == "PROMO1");
        result.Should().Contain(o => o.Accom.First().Prom == "PROMO3");
    }

    [Fact]
    public async Task FilterBy_MultiplePromotionCollections_ReturnsFilteredOffers()
    {
        // Arrange
        var offers = CreateOffersList(new[] { "PROMO1", "PROMO2", "PROMO3", "PROMO4" });
        var request = new PackagesSearchRequest
        {
            Promc = "Collection1,Collection2"
        };

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new KeyedPromotion("Collection1", "PROMO1,PROMO3", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1"),
                    new KeyedPromotion("Collection2", "PROMO2", "0", "Promotion 2", "Tooltip 2", "icon2", "Tracking Promotion 2"),
                    new KeyedPromotion("Collection3", "PROMO4", "0", "Promotion 3", "Tooltip 3", "icon3", "Tracking Promotion 3")
                })
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        var result = await _sut.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(3);
        result.Should().Contain(o => o.Accom.First().Prom == "PROMO1");
        result.Should().Contain(o => o.Accom.First().Prom == "PROMO2");
        result.Should().Contain(o => o.Accom.First().Prom == "PROMO3");
    }

    [Fact]
    public async Task FilterBy_CaseInsensitiveMatching_ReturnsFilteredOffers()
    {
        // Arrange
        var offers = CreateOffersList(new[] { "PROMO1", "promo2" });
        var request = new PackagesSearchRequest
        {
            Promc = "collection1"
        };

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new KeyedPromotion("Collection1", "PROMO1,promo2", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1")
                })
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        var result = await _sut.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(o => o.Accom.First().Prom == "PROMO1");
        result.Should().Contain(o => o.Accom.First().Prom == "promo2");
    }

    [Fact]
    public async Task FilterBy_WithPromoCodesWithExtraSpaces_TrimsAndFiltersCorrectly()
    {
        // Arrange
        var offers = CreateOffersList(new[] { "PROMO1", "PROMO2" });
        var request = new PackagesSearchRequest
        {
            Promc = "Collection1"
        };

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new KeyedPromotion("Collection1", " PROMO1 , PROMO2 ", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1")
                })
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        var result = await _sut.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(o => o.Accom.First().Prom == "PROMO1");
        result.Should().Contain(o => o.Accom.First().Prom == "PROMO2");
    }

    [Fact]
    public async Task GetOptions_NullOffers_ThrowsArgumentNullException()
    {
        // Arrange
        PackagesSearchRequest request = new();
        ApplyAllFiltersFunc applyAllFiltersFunc = (offers, req) => Task.FromResult(new List<AvCacheResultOffersOfferExtended>());

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.GetOptions(null, request, applyAllFiltersFunc));
    }

    [Fact]
    public async Task GetOptions_NullRequest_ThrowsArgumentNullException()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>();
        ApplyAllFiltersFunc applyAllFiltersFunc = (offers, req) => Task.FromResult(new List<AvCacheResultOffersOfferExtended>());

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.GetOptions(offers, null, applyAllFiltersFunc));
    }

    [Fact]
    public async Task GetOptions_NullApplyAllFiltersFunc_ThrowsArgumentNullException()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>();
        PackagesSearchRequest request = new();

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.GetOptions(offers, request, null));
    }

    [Fact]
    public async Task GetOptions_EmptyOffers_ReturnsEmptyFilterOptions()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>();
        PackagesSearchRequest request = new();
        ApplyAllFiltersFunc applyAllFiltersFunc = (offers, req) => Task.FromResult(new List<AvCacheResultOffersOfferExtended>());

        // Act
        var result = await _sut.GetOptions(offers, request, applyAllFiltersFunc);

        // Assert
        result.Should().BeEquivalentTo(FilterOptions.Empty);
    }

    [Fact]
    public async Task GetOptions_EmptyConfigChildren_ReturnsEmptyFilterOptions()
    {
        // Arrange
        var offers = CreateOffersList(new[] { "PROMO1", "PROMO2" });
        PackagesSearchRequest request = new();
        ApplyAllFiltersFunc applyAllFiltersFunc = (offers, req) => Task.FromResult(offers);

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(new List<KeyedPromotion>())
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        var result = await _sut.GetOptions(offers, request, applyAllFiltersFunc);

        // Assert
        result.Should().BeEquivalentTo(FilterOptions.Empty);
    }

    [Fact]
    public async Task GetOptions_NoMatchingOffers_ReturnsEmptyFilterOptions()
    {
        // Arrange
        var offers = CreateOffersList(new[] { "PROMO3", "PROMO4" });
        PackagesSearchRequest request = new();
        ApplyAllFiltersFunc applyAllFiltersFunc = (offers, req) => Task.FromResult(offers);

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new KeyedPromotion("Collection1", "PROMO1,PROMO2", "1", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1")
                })
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        var result = await _sut.GetOptions(offers, request, applyAllFiltersFunc);

        // Assert
        result.Should().BeEquivalentTo(FilterOptions.Empty);
    }

    [Fact]
    public async Task GetOptions_ValidConfig_ReturnsFilterOptions()
    {
        // Arrange
        var offers = CreateOffersList(new[] { "PROMO1", "PROMO1", "PROMO2" }); // Two offers with same promo
        PackagesSearchRequest request = new();
        ApplyAllFiltersFunc applyAllFiltersFunc = (offers, req) => Task.FromResult(offers);

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new KeyedPromotion("Collection1", "PROMO1,PROMO2", "1", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1")
                })
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        var result = await _sut.GetOptions(offers, request, applyAllFiltersFunc);

        // Assert
        result.Should().NotBe(FilterOptions.Empty);
        result.Options.Should().HaveCount(1);
        result.Options[0].Code.Should().Be("Collection1");
        result.Options[0].Name.Should().Be("Promotion 1");
        result.Options[0].Count.Should().Be(3); // Sum of all offers with PROMO1 (2) and PROMO2 (1)
        result.Options[0].ShowNewLabel.Should().BeTrue();
        result.Options[0].Icon.Should().Be("icon1");
        result.Options[0].TooltipText.Should().Be("Tooltip 1");
    }

    [Fact]
    public async Task GetOptions_NullIconAndTooltip_ReturnsEmptyStrings()
    {
        // Arrange
        var offers = CreateOffersList(new[] { "PROMO1", "PROMO2" });
        PackagesSearchRequest request = new();
        ApplyAllFiltersFunc applyAllFiltersFunc = (offers, req) => Task.FromResult(offers);

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new KeyedPromotion("Collection1", "PROMO1,PROMO2", "0", "Promotion 1", null, null, "Tracking Promotion 1")
                })
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        var result = await _sut.GetOptions(offers, request, applyAllFiltersFunc);

        // Assert
        result.Options[0].Icon.Should().Be(string.Empty);
        result.Options[0].TooltipText.Should().Be(string.Empty);
    }

    [Fact]
    public async Task GetOptions_ApplyAllFiltersReturnsEmptyList_ReturnsEmptyFilterOptions()
    {
        // Arrange
        var offers = CreateOffersList(new[] { "PROMO1", "PROMO2" });
        PackagesSearchRequest request = new();
        // The filter function returns empty list
        ApplyAllFiltersFunc applyAllFiltersFunc = (offers, req) => Task.FromResult(new List<AvCacheResultOffersOfferExtended>());

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new KeyedPromotion("Collection1", "PROMO1,PROMO2", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1")
                })
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        var result = await _sut.GetOptions(offers, request, applyAllFiltersFunc);

        // Assert
        result.Should().BeEquivalentTo(FilterOptions.Empty);
    }

    [Fact]
    public async Task GetOptions_CaseInsensitivePromotionCodeMatching_CountsCorrectly()
    {
        // Arrange
        var offers = CreateOffersList(new[] { "promo1", "PROMO1", "PrOmO2" });
        PackagesSearchRequest request = new();
        ApplyAllFiltersFunc applyAllFiltersFunc = (offers, req) => Task.FromResult(offers);

        var config = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new KeyedPromotion("Collection1", "PROMO1,PROMO2", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1")
                })
        };

        _promotionCollectionsServiceMock.Setup(x => x.GetPromotionConfiguration()).ReturnsAsync(config);

        // Act
        var result = await _sut.GetOptions(offers, request, applyAllFiltersFunc);

        // Assert
        result.Options[0].Count.Should().Be(3); // All promotions match case-insensitively
    }

    private static List<AvCacheResultOffersOfferExtended> CreateOffersList(string[] promCodes)
    {
        var result = new List<AvCacheResultOffersOfferExtended>();

        foreach (var promCode in promCodes)
        {
            var offer = new AvCacheResultOffersOffer();
            var accom = new AvCacheResultOffersOfferAccomExtended(new AvCacheResultOffersOfferAccom
            {
                Prom = promCode
            });

            var offerExtended = new AvCacheResultOffersOfferExtended(offer, new[] { accom });

            result.Add(offerExtended);
        }

        return result;
    }
}