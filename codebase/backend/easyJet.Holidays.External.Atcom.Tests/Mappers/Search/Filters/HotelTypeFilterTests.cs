#nullable enable

using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Mappers.Search.Filters;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search.Filters;

public class HotelTypeFilterTests
{
    private readonly HotelTypeFilter _sut;
    private readonly Mock<IReferenceDataService> _referenceDataService;

    public HotelTypeFilterTests()
    {
        _referenceDataService = new Mock<IReferenceDataService>();
        _sut = new HotelTypeFilter(_referenceDataService.Object);
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
    public async Task Count_WhenOffersIsEmpty_CountShouldBeZeroForAllOptions()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>();
        var filterOptions = new FilterOptions
        {
            Options = new List<FilterOption>
            {
                new FilterOption { Code = "adults" },
                new FilterOption { Code = "luxury" }
            }
        };
        var request = new PackagesSearchRequest();

        // Act
        await _sut.Count(offers, filterOptions, request);

        // Assert
        filterOptions.Options.Should().AllSatisfy(option => option.Count.Should().Be(0));
    }

    [Fact]
    public async Task Count_WhenOffersIsNull_ThrowsArgumentNullException()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>();
        var request = new PackagesSearchRequest();
        var filterOptions = new FilterOptions
        {
            Options = new List<FilterOption>
            {
                new FilterOption { Code = "adults" },
                new FilterOption { Code = "luxury" }
            }
        };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.Count(null, filterOptions, request));
    }

    [Fact]
    public async Task Count_WhenFilterOptionsHasEmptyOptions_DoesNotThrow()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended> { CreateOffer(new[] { "adults", "luxury" }) };
        var filterOptions = new FilterOptions
        {
            Options = new List<FilterOption>()
        };
        var request = new PackagesSearchRequest();

        // Act
        Func<Task> act = async () => await _sut.Count(offers, filterOptions, request);

        // Assert
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task Count_WhenOffersFacilityMatrixIsNull_ShouldHandleGracefully()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended> { CreateOffer(null) };
        var filterOptions = new FilterOptions
        {
            Options = new List<FilterOption>
            {
                new FilterOption { Code = "adults" },
                new FilterOption { Code = "luxury" }
            }
        };
        var request = new PackagesSearchRequest();

        // Act
        await _sut.Count(offers, filterOptions, request);

        // Assert
        filterOptions.Options.Should().AllSatisfy(option => option.Count.Should().Be(0));
    }

    [Fact]
    public async Task Count_WithMatchingOffers_SetsCorrectCounts()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended> 
        { 
            CreateOffer(new[] { "adults", "luxury" }), 
            CreateOffer(new[] { "adults" }),
            CreateOffer(new[] { "luxury" }),
            CreateOffer(new[] { "family" }),
            CreateOffer(new[] { "adults" })
        };
        var filterOptions = new FilterOptions
        {
            Options = new List<FilterOption>
            {
                new FilterOption { Code = "adults" },
                new FilterOption { Code = "luxury" },
                new FilterOption { Code = "family" },
                new FilterOption { Code = "ski" }
            }
        };
        var request = new PackagesSearchRequest();

        // Act
        await _sut.Count(offers, filterOptions, request);

        // Assert
        filterOptions.Options.First(o => o.Code == "adults").Count.Should().Be(3);
        filterOptions.Options.First(o => o.Code == "luxury").Count.Should().Be(2);
        filterOptions.Options.First(o => o.Code == "family").Count.Should().Be(1);
        filterOptions.Options.First(o => o.Code == "ski").Count.Should().Be(0);
    }

    [Fact]
    public async Task Count_WithMixedFacilityMatrixNullAndEmpty_SetsCorrectCounts()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended> 
        { 
            CreateOffer(new[] { "adults" }), 
            CreateOffer(null),
            CreateOffer(Array.Empty<string>()),
            CreateOffer(new[] { "adults" })
        };
        var filterOptions = new FilterOptions
        {
            Options = new List<FilterOption>
            {
                new FilterOption { Code = "adults" }
            }
        };
        var request = new PackagesSearchRequest();

        // Act
        await _sut.Count(offers, filterOptions, request);

        // Assert
        filterOptions.Options.First(o => o.Code == "adults").Count.Should().Be(2);
    }

    #endregion

    [Theory]
    [MemberData(nameof(FilterByData))]
    public async Task FilterBy(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request,
        List<AvCacheResultOffersOfferExtended> expectedReults, string reason)
    {
        // Act
        var res = await _sut.FilterBy(offers, request);

        // Assert
        res.Should().BeEquivalentTo(expectedReults, reason);
    }

    public static IEnumerable<object[]> FilterByData()
    {
        yield return new object[]
        {
            new List<AvCacheResultOffersOfferExtended>
            {
                CreateOffer(new[] { "adults", "luxury" }), CreateOffer(new[] { "adults" }),
                CreateOffer(new[] { "luxury" }), CreateOffer(Array.Empty<string>())
            },
            new PackagesSearchRequest { HotelTypes = ""},
            new List<AvCacheResultOffersOfferExtended>
            {
                CreateOffer(new[] { "adults", "luxury" }), CreateOffer(new[] { "adults" }),
                CreateOffer(new[] { "luxury" }), CreateOffer(Array.Empty<string>())
            },
            "Empty filter doesn't affect results"
        };

        yield return new object[]
        {
            new List<AvCacheResultOffersOfferExtended>
            {
                CreateOffer(new[] { "adults", "luxury" }), CreateOffer(new []{"adults" }),
                CreateOffer(new[] {"luxury" }), CreateOffer(Array.Empty<string>()), CreateOffer(null)
            },
            new PackagesSearchRequest { HotelTypes = "adults"},
            new List<AvCacheResultOffersOfferExtended>
            {
                CreateOffer(new []{"adults", "luxury" }), CreateOffer(new []{"adults" })
            },
            "Single hotel type filter applied"
        };

        yield return new object[]
        {
            new List<AvCacheResultOffersOfferExtended>
            {
                CreateOffer(new[] {"adults", "luxury" }), CreateOffer(new[] {"adults" }),
                CreateOffer(new[] {"luxury" }), CreateOffer(new[] {"ski"}), CreateOffer(Array.Empty<string>())
            },
            new PackagesSearchRequest { HotelTypes = "adults,luxury"},
            new List<AvCacheResultOffersOfferExtended>
            {
                CreateOffer(new[] { "adults", "luxury" }), CreateOffer(new[] { "adults" }), CreateOffer(new[] { "luxury" })
            },
            "Multiple filters applied with OR condition"
        };

        yield return new object[]
        {
            new List<AvCacheResultOffersOfferExtended>
            {
                CreateOffer(new[] {"adults", "luxury" }), CreateOffer(new[] {"adults" }),
                CreateOffer(new[] {"luxury" }), CreateOffer(Array.Empty<string>())
            },
            new PackagesSearchRequest { HotelTypes = "family"},
            new List<AvCacheResultOffersOfferExtended> { },
            "Empty collection when no offers match filter"
        };
    }

    [Theory]
    [MemberData(nameof(GetOptionsData))]
    public async Task GetOptions(List<AvCacheResultOffersOfferExtended> offers, FilterOptions expectedReults, string reason)
    {
        // Arrange
        ApplyAllFiltersFunc applyAllOtherFilters = (List<AvCacheResultOffersOfferExtended> set, PackagesSearchRequest request) => { return Task.FromResult(set); };
        var mockData = CreateHotelTypeFilterConfigurations();
        _referenceDataService.Setup(x => x.GetFacilityMatrixConfiguration()).ReturnsAsync(mockData);

        // Act
        var res = await _sut.GetOptions(offers, null, applyAllOtherFilters);

        // Assert
        res.Should().BeEquivalentTo(expectedReults, reason);
    }

    public static IEnumerable<object[]> GetOptionsData()
    {
        yield return new object[]
        {
            new List<AvCacheResultOffersOfferExtended> { CreateOffer(new[] { "adults", "luxury", "family" }), CreateOffer(new[] { "adults" }),
                CreateOffer(new[] { "luxury" }), CreateOffer(Array.Empty<string>()) },
            new FilterOptions
            {
                Options = new List<FilterOption>
                {
                    new FilterOption
                    {
                        Code = "adults",
                        Name = "Adults",
                        TrackingId = "tid-adults",
                        Icon = "ic-adults",
                        TooltipText = "tip-adults",
                        IsExclusive = true,
                    },
                    new FilterOption
                    {
                        Code = "luxury",
                        Name = "Luxury",
                        TrackingId = "tid-luxury",
                        Icon = "ic-luxury",
                        TooltipText = "tip-luxury",
                    },
                    new FilterOption
                    {
                        Code = "family",
                        Name = "Family",
                        TrackingId = "tid-family",
                        Icon = "ic-family",
                        TooltipText = "tip-family",
                    },
                }
            },
            "Filters counted correctly"
        };

        yield return new object[]
        {
            new List<AvCacheResultOffersOfferExtended> { },
            FilterOptions.Empty,
            "Empty collection when no offers"
        };

        yield return new object[]
        {
            new List<AvCacheResultOffersOfferExtended> { CreateOffer(new[] { "luxury" }), CreateOffer(Array.Empty<string>()), CreateOffer(null) },
            new FilterOptions
            {
                Options = new List<FilterOption>()
                {
                    new FilterOption
                    {
                        Code = "luxury",
                        Name = "Luxury",
                        TrackingId = "tid-luxury",
                        Icon = "ic-luxury",
                        TooltipText = "tip-luxury",
                    },
                }
            },
            "Filters counted correctly when facility matrix null or empty"
        };
    }

    private static List<HotelTypeFilterConfiguration> CreateHotelTypeFilterConfigurations()
    {
        var hotelTypesCodes = new[] { "adults", "luxury", "family" };
        var configurations = new List<HotelTypeFilterConfiguration>();
        foreach (var code in hotelTypesCodes)
        {
            var conf = new HotelTypeFilterConfiguration()
            {
                Code = code,
                Name = char.ToUpperInvariant(code[0]) + code[1..],
                TrackingId = $"tid-{code}",
                Icon = $"ic-{code}",
                TooltipText = $"tip-{code}",
                IsExclusive = code == "adults",
            };
            configurations.Add(conf);
        }

        return configurations;
    }

    private static AvCacheResultOffersOfferExtended CreateOffer(string[]? hotelTypeCodes)
    {
        var accom = new AvCacheResultOffersOfferAccomExtended(new Models.Internal.Search.AvCacheResultOffersOfferAccom())
        {
            FacilityMatrix = hotelTypeCodes?.Select(x => new HotelType { Code = x }).ToArray(),
        };

        return new AvCacheResultOffersOfferExtended(new Models.Internal.Search.AvCacheResultOffersOffer(), new AvCacheResultOffersOfferAccomExtended[] { accom });
    }
}
