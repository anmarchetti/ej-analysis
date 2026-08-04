using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Mappers.Search.Filters;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using FluentAssertions;
using Moq;
using Xunit;
using static easyJet.Holidays.External.Atcom.Tests.AtComBuilders;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search.Filters;

public class RecommendedFilterTests
{
    private readonly Mock<IReferenceDataService> _referenceDataServiceMock;
    private readonly RecommendedFilter _sut;
    private ApplyAllFiltersFunc _applyAllFiltersFunc = (List<AvCacheResultOffersOfferExtended> set, Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest request) =>
            Task.FromResult(new List<AvCacheResultOffersOfferExtended>());

    public RecommendedFilterTests()
    {
        _referenceDataServiceMock = new Mock<IReferenceDataService>();

        _sut = new RecommendedFilter(_referenceDataServiceMock.Object);
    }

    [Fact]
    public async Task FilterBy_ReturnsOffersUnchanged()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [])
        };
        var request = new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest();

        // Act
        var result = await _sut.FilterBy(offers, request);

        // Assert
        result.Should().BeSameAs(offers);
    }

    [Fact]
    public async Task GetOptions_NullRequest_ThrowsArgumentNullException()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>();

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(async () => 
            await _sut.GetOptions(offers, null, _applyAllFiltersFunc));
    }

    [Fact]
    public async Task GetOptions_NullApplyAllFiltersFunc_ThrowsArgumentNullException()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>();
        var request = new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest();

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(async () => 
            await _sut.GetOptions(offers, request, null));
    }

    [Fact]
    public async Task GetOptions_NullRecommendedConfig_ReturnsEmptyFilterOptions()
    {
        // Arrange
        _referenceDataServiceMock
            .Setup(x => x.GetFilterPillsConfig())
            .ReturnsAsync((FilterPillsConfig)null);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [])
        };
        var request = new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest();

        // Act
        var result = await _sut.GetOptions(offers, request, _applyAllFiltersFunc);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(AvailableFilters.Recommended.GetEnumMemberValue());
        result.Options.Should().BeEmpty();
    }

    [Fact]
    public async Task GetOptions_NullOptionsCollection_ReturnsEmptyFilterOptions()
    {
        // Arrange
        _referenceDataServiceMock
            .Setup(x => x.GetFilterPillsConfig())
            .ReturnsAsync(new FilterPillsConfig
            {
                RecommendedFilterConfig = new RecommendedFilterConfig
                {
                    MinNumberOfOffers = 5,
                    Options = null
                }
            });

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [])
        };
        var request = new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest();

        // Act
        var result = await _sut.GetOptions(offers, request, _applyAllFiltersFunc);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(AvailableFilters.Recommended.GetEnumMemberValue());
        result.Options.Should().BeEmpty();
    }

    [Fact]
    public async Task GetOptions_EmptyOptionsCollection_ReturnsEmptyFilterOptions()
    {
        // Arrange
        _referenceDataServiceMock
            .Setup(x => x.GetFilterPillsConfig())
            .ReturnsAsync(new FilterPillsConfig
            {
                RecommendedFilterConfig = new RecommendedFilterConfig
                {
                    MinNumberOfOffers = 5,
                    Options = []
                }
            });

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [])
        };
        var request = new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest();

        // Act
        var result = await _sut.GetOptions(offers, request, _applyAllFiltersFunc);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(AvailableFilters.Recommended.GetEnumMemberValue());
        result.Options.Should().BeEmpty();
    }

    [Fact]
    public async Task GetOptions_NullOffers_ReturnsEmptyFilterOptions()
    {
        // Arrange
        _referenceDataServiceMock
            .Setup(x => x.GetFilterPillsConfig())
            .ReturnsAsync(new FilterPillsConfig
            {
                RecommendedFilterConfig = new RecommendedFilterConfig
                {
                    MinNumberOfOffers = 5,
                    Options = new List<FilterPillOption>
                    {
                        new FilterPillOption
                        {
                            FilterCode = AvailableFilters.Board,
                            Code = "AI",
                            Name = "All Inclusive"
                        }
                    }
                }
            });

        var request = new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest();

        // Act
        var result = await _sut.GetOptions(null, request, _applyAllFiltersFunc);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(AvailableFilters.Recommended.GetEnumMemberValue());
        result.Options.Should().BeEmpty();
    }

    [Fact]
    public async Task GetOptions_OffersCountBelowMinimumThreshold_ReturnsEmptyFilterOptions()
    {
        // Arrange
        _referenceDataServiceMock
            .Setup(x => x.GetFilterPillsConfig())
            .ReturnsAsync(new FilterPillsConfig
            {
                RecommendedFilterConfig = new RecommendedFilterConfig
                {
                    MinNumberOfOffers = 10,
                    Options = new List<FilterPillOption>
                    {
                        new FilterPillOption
                        {
                            FilterCode = AvailableFilters.Board,
                            Code = "AI",
                            Name = "All Inclusive"
                        }
                    }
                }
            });

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                []),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                []),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [])
        };
        var request = new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest();

        // Act
        var result = await _sut.GetOptions(offers, request, _applyAllFiltersFunc);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(AvailableFilters.Recommended.GetEnumMemberValue());
        result.Options.Should().BeEmpty();
    }

    [Fact]
    public async Task GetOptions_OffersCountEqualToMinimumThreshold_ReturnsRecommendedOptions()
    {
        // Arrange
        var recommendedOptions = new List<FilterPillOption>
        {
            new FilterPillOption
            {
                FilterCode = AvailableFilters.Board,
                Code = "AI",
                Name = "All Inclusive"
            },
            new FilterPillOption
            {
                FilterCode = AvailableFilters.StarRating,
                Code = "5",
                Name = "5 Star Hotels"
            }
        };

        _referenceDataServiceMock
            .Setup(x => x.GetFilterPillsConfig())
            .ReturnsAsync(new FilterPillsConfig
            {
                RecommendedFilterConfig = new RecommendedFilterConfig
                {
                    MinNumberOfOffers = 3,
                    Options = recommendedOptions
                }
            });

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                []),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                []),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [])
        };
        var request = new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest();

        // Act
        var result = await _sut.GetOptions(offers, request, _applyAllFiltersFunc);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(AvailableFilters.Recommended.GetEnumMemberValue());
        result.Options.Should().HaveCount(2);
        result.Options[0].FilterCode.Should().Be(AvailableFilters.Board);
        result.Options[0].Code.Should().Be("AI");
        result.Options[0].Name.Should().Be("All Inclusive");
        result.Options[1].FilterCode.Should().Be(AvailableFilters.StarRating);
        result.Options[1].Code.Should().Be("5");
        result.Options[1].Name.Should().Be("5 Star Hotels");
    }

    [Fact]
    public async Task GetOptions_OffersCountAboveMinimumThreshold_ReturnsRecommendedOptions()
    {
        // Arrange
        var recommendedOptions = new List<FilterPillOption>
        {
            new FilterPillOption
            {
                FilterCode = AvailableFilters.Board,
                Code = "BB",
                Name = "Bed & Breakfast"
            }
        };

        _referenceDataServiceMock
            .Setup(x => x.GetFilterPillsConfig())
            .ReturnsAsync(new FilterPillsConfig
            {
                RecommendedFilterConfig = new RecommendedFilterConfig
                {
                    MinNumberOfOffers = 2,
                    Options = recommendedOptions
                }
            });

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                []),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                []),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                []),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                []),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [])
        };
        var request = new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest();

        // Act
        var result = await _sut.GetOptions(offers, request, _applyAllFiltersFunc);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(AvailableFilters.Recommended.GetEnumMemberValue());
        result.Options.Should().HaveCount(1);
        result.Options[0].FilterCode.Should().Be(AvailableFilters.Board);
        result.Options[0].Code.Should().Be("BB");
        result.Options[0].Name.Should().Be("Bed & Breakfast");
    }

    [Fact]
    public async Task GetOptions_EmptyOffersList_ReturnsEmptyFilterOptions()
    {
        // Arrange
        _referenceDataServiceMock
            .Setup(x => x.GetFilterPillsConfig())
            .ReturnsAsync(new FilterPillsConfig
            {
                RecommendedFilterConfig = new RecommendedFilterConfig
                {
                    MinNumberOfOffers = 1,
                    Options = new List<FilterPillOption>
                    {
                        new FilterPillOption
                        {
                            FilterCode = AvailableFilters.Board,
                            Code = "AI",
                            Name = "All Inclusive"
                        }
                    }
                }
            });

        var offers = new List<AvCacheResultOffersOfferExtended>();
        var request = new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest();

        // Act
        var result = await _sut.GetOptions(offers, request, _applyAllFiltersFunc);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(AvailableFilters.Recommended.GetEnumMemberValue());
        result.Options.Should().BeEmpty();
    }

    [Fact]
    public async Task GetOptions_MinNumberOfOffersZero_WithOptions_ReturnsRecommendedOptions()
    {
        // Arrange
        var recommendedOptions = new List<FilterPillOption>
        {
            new FilterPillOption
            {
                FilterCode = AvailableFilters.Destination,
                Code = "PMI",
                Name = "Majorca"
            }
        };

        _referenceDataServiceMock
            .Setup(x => x.GetFilterPillsConfig())
            .ReturnsAsync(new FilterPillsConfig
            {
                RecommendedFilterConfig = new RecommendedFilterConfig
                {
                    MinNumberOfOffers = 0,
                    Options = recommendedOptions
                }
            });

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [])
        };
        var request = new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest();

        // Act
        var result = await _sut.GetOptions(offers, request, _applyAllFiltersFunc);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(AvailableFilters.Recommended.GetEnumMemberValue());
        result.Options.Should().HaveCount(1);
        result.Options[0].FilterCode.Should().Be(AvailableFilters.Destination);
        result.Options[0].Code.Should().Be("PMI");
        result.Options[0].Name.Should().Be("Majorca");
    }

    [Fact]
    public async Task GetOptions_MultipleRecommendedOptions_MapsAllProperties()
    {
        // Arrange
        var recommendedOptions = new List<FilterPillOption>
        {
            new FilterPillOption
            {
                FilterCode = AvailableFilters.Board,
                Code = "HB",
                Name = "Half Board"
            },
            new FilterPillOption
            {
                FilterCode = AvailableFilters.StarRating,
                Code = "4",
                Name = "4 Star Hotels"
            },
            new FilterPillOption
            {
                FilterCode = AvailableFilters.Destination,
                Code = "ALC",
                Name = "Alicante"
            }
        };

        _referenceDataServiceMock
            .Setup(x => x.GetFilterPillsConfig())
            .ReturnsAsync(new FilterPillsConfig
            {
                RecommendedFilterConfig = new RecommendedFilterConfig
                {
                    MinNumberOfOffers = 1,
                    Options = recommendedOptions
                }
            });

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [])
        };
        var request = new Holidays.Api.Domain.Data.PackageOffers.PackagesSearchRequest();

        // Act
        var result = await _sut.GetOptions(offers, request, _applyAllFiltersFunc);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(AvailableFilters.Recommended.GetEnumMemberValue());
        result.Options.Should().HaveCount(3);
        
        result.Options[0].FilterCode.Should().Be(AvailableFilters.Board);
        result.Options[0].Code.Should().Be("HB");
        result.Options[0].Name.Should().Be("Half Board");
        
        result.Options[1].FilterCode.Should().Be(AvailableFilters.StarRating);
        result.Options[1].Code.Should().Be("4");
        result.Options[1].Name.Should().Be("4 Star Hotels");
        
        result.Options[2].FilterCode.Should().Be(AvailableFilters.Destination);
        result.Options[2].Code.Should().Be("ALC");
        result.Options[2].Name.Should().Be("Alicante");
    }
}
