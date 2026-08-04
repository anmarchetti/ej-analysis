using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search;

public class SearchAvailablePackagesFilterAndMapperTransferDurationTests
{
    [Fact]
    public void GetSmallestTransferDuration_WithNullTransfers_ReturnsNull()
    {
        // Arrange
        var transferDurations = new Dictionary<string, int> { { "ABC", 30 } };

        // Act
        var result = SearchAvailablePackagesFilterAndMapper.GetSmallestTransferDuration(null, transferDurations);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void GetSmallestTransferDuration_WithEmptyTransfers_ReturnsNull()
    {
        // Arrange
        var transfers = Array.Empty<AvCacheResultOffersOfferTransfersTransfer>();
        var transferDurations = new Dictionary<string, int> { { "ABC", 30 } };

        // Act
        var result = SearchAvailablePackagesFilterAndMapper.GetSmallestTransferDuration(transfers, transferDurations);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void GetSmallestTransferDuration_WithNullDurations_ReturnsNull()
    {
        // Arrange
        var transfers = new[] { new AvCacheResultOffersOfferTransfersTransfer { CrtCd = "ABC" } };

        // Act
        var result = SearchAvailablePackagesFilterAndMapper.GetSmallestTransferDuration(transfers, null);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void GetSmallestTransferDuration_UsesCrtCdAndFindsSmallest()
    {
        // Arrange
        var transfers = new[]
        {
            new AvCacheResultOffersOfferTransfersTransfer { CrtCd = "ABC" },
            new AvCacheResultOffersOfferTransfersTransfer { CrtCd = "DEF" }
        };
        var transferDurations = new Dictionary<string, int>
        {
            { "ABC", 45 },
            { "DEF", 30 }
        };

        // Act
        var result = SearchAvailablePackagesFilterAndMapper.GetSmallestTransferDuration(transfers, transferDurations);

        // Assert
        result.Should().Be(30);
    }

    [Fact]
    public void GetSmallestTransferDuration_IncludesZeroDurations()
    {
        // Arrange
        var transfers = new[]
        {
            new AvCacheResultOffersOfferTransfersTransfer { CrtCd = "ABC" },
            new AvCacheResultOffersOfferTransfersTransfer { CrtCd = "DEF" }
        };
        var transferDurations = new Dictionary<string, int>
        {
            { "ABC", 0 },
            { "DEF", 25 }
        };

        // Act
        var result = SearchAvailablePackagesFilterAndMapper.GetSmallestTransferDuration(transfers, transferDurations);

        // Assert
        result.Should().Be(0);
    }

    [Fact]
    public void GetSmallestTransferDuration_WhenCodeNotInDictionary_SkipsIt()
    {
        // Arrange
        var transfers = new[]
        {
            new AvCacheResultOffersOfferTransfersTransfer { CrtCd = "UNKNOWN" },
            new AvCacheResultOffersOfferTransfersTransfer { CrtCd = "ABC" }
        };
        var transferDurations = new Dictionary<string, int> { { "ABC", 20 } };

        // Act
        var result = SearchAvailablePackagesFilterAndMapper.GetSmallestTransferDuration(transfers, transferDurations);

        // Assert
        result.Should().Be(20);
    }

    [Fact]
    public void GetSmallestTransferDuration_WithMissingCrtCd_ReturnsNull()
    {
        // Arrange
        var transfers = new[] { new AvCacheResultOffersOfferTransfersTransfer { CrtCd = null } };
        var transferDurations = new Dictionary<string, int> { { "ABC", 15 } };

        // Act
        var result = SearchAvailablePackagesFilterAndMapper.GetSmallestTransferDuration(transfers, transferDurations);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void GetSmallestTransferDuration_WhenAllDurationsZero_ReturnsZero()
    {
        // Arrange
        var transfers = new[] { new AvCacheResultOffersOfferTransfersTransfer { CrtCd = "ABC" } };
        var transferDurations = new Dictionary<string, int> { { "ABC", 0 } };

        // Act
        var result = SearchAvailablePackagesFilterAndMapper.GetSmallestTransferDuration(transfers, transferDurations);

        // Assert
        result.Should().Be(0);
    }

    [Fact]
    public async Task TransformOriginalOffers_WhenIgnoreFilterOptionsIsFalse_CallsGetAllTransferDurations()
    {
        // Arrange
        var fixture = MapperTestsHelper.PrepareMapperFixture();
        var transferDurations = new Dictionary<string, int> { { "ABC", 30 }, { "DEF", 45 } };
        
        var refDataMock = fixture.Freeze<Mock<IReferenceDataService>>();
        refDataMock.Setup(x => x.GetAllTransferDurations())
            .ReturnsAsync(transferDurations)
            .Verifiable();

        var mapper = fixture.Create<SearchAvailablePackagesFilterAndMapper>();
        var offers = new List<AvCacheResultOffersOffer>();
        var request = new PackagesSearchRequest();

        // Act
        await mapper.TransformOriginalOffers(offers, request, ignoreFilters: false, ignoreFilterOptions: false);

        // Assert
        refDataMock.Verify(x => x.GetAllTransferDurations(), Times.Once);
    }

    [Fact]
    public async Task TransformOriginalOffers_WhenIgnoreFilterOptionsIsTrue_DoesNotCallGetAllTransferDurations()
    {
        // Arrange
        var fixture = MapperTestsHelper.PrepareMapperFixture();
        
        var refDataMock = fixture.Freeze<Mock<IReferenceDataService>>();

        var mapper = fixture.Create<SearchAvailablePackagesFilterAndMapper>();
        var offers = new List<AvCacheResultOffersOffer>();
        var request = new PackagesSearchRequest();

        // Act
        await mapper.TransformOriginalOffers(offers, request, ignoreFilters: false, ignoreFilterOptions: true);

        // Assert
        refDataMock.Verify(x => x.GetAllTransferDurations(), Times.Never);
    }

    [Fact]
    public async Task TransformOriginalOffers_WhenIgnoreFilterOptionsIsFalse_PassesTransferDurationsToExtendWithFiltersData()
    {
        // Arrange
        var fixture = MapperTestsHelper.PrepareMapperFixture();
        var expectedTransferDurations = new Dictionary<string, int> 
        { 
            { "ABC", 30 }, 
            { "DEF", 45 }, 
            { "GHI", 60 } 
        };
        
        var refDataMock = fixture.Freeze<Mock<IReferenceDataService>>();
        refDataMock.Setup(x => x.GetAllTransferDurations())
            .ReturnsAsync(expectedTransferDurations);

        var mapper = fixture.Create<SearchAvailablePackagesFilterAndMapper>();
        var offers = new List<AvCacheResultOffersOffer>();
        var request = new PackagesSearchRequest();

        // Act
        var result = await mapper.TransformOriginalOffers(offers, request, ignoreFilters: false, ignoreFilterOptions: false);

        // Assert
        refDataMock.Verify(x => x.GetAllTransferDurations(), Times.Once);
        result.Should().NotBeNull();
    }
}