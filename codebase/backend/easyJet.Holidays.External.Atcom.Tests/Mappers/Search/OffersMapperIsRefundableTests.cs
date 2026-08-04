using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search;

/// <summary>
/// Tests for IsRefundable flag mapping in OffersMapper
/// </summary>
public class OffersMapperIsRefundableTests
{
    private readonly IFixture _fixture;
    private readonly Mock<IReferenceDataService> _referenceDataServiceMock;
    private readonly Mock<IHotelThemeService> _hotelThemeServiceMock;
    private readonly IOptions<AtcomSettings> _atcomSettings;
    private readonly OffersMapper _offersMapper;

    public OffersMapperIsRefundableTests()
    {
        _fixture = FixtureUtils.AutoMoqFixture();
        _referenceDataServiceMock = new Mock<IReferenceDataService>();
        _hotelThemeServiceMock = new Mock<IHotelThemeService>();

        _atcomSettings = Options.Create(new AtcomSettings
        {
            Transfers = new TransfersSettings
            {
                Types = new TransferTypesSettings
                {
                    SyntheticNoTransfer = "DEFAULT"
                }
            }
        });

        _offersMapper = new OffersMapper(
            _referenceDataServiceMock.Object,
            _hotelThemeServiceMock.Object,
            _atcomSettings,
            new PricesService(Options.Create(new ApiSettings())));
    }

    [Fact]
    public async Task ConvertOffers_UnitWithNRefSpecifiedAndNRefEqualsN_MapsIsRefundableAsTrue()
    {
        // Arrange
        var offer = CreateOfferWithUnit(nRefSpecified: true, nRef: YesNo.N);
        var marketSettings = new MarketSettings { Currency = new Currency { Code = "GBP" } };

        // Act
        var result = await _offersMapper.ConvertOffers(new[] { offer }, new string[] { }, marketSettings);

        // Assert
        result.Should().HaveCount(1);
        var mappedUnit = result.First().Accom.Unit.First();
        mappedUnit.IsRefundable.Should().BeTrue();
    }

    [Fact]
    public async Task ConvertOffers_UnitWithNRefSpecifiedAndNRefEqualsY_MapsIsRefundableAsFalse()
    {
        // Arrange
        var offer = CreateOfferWithUnit(nRefSpecified: true, nRef: YesNo.Y);
        var marketSettings = new MarketSettings { Currency = new Currency { Code = "GBP" } };

        // Act
        var result = await _offersMapper.ConvertOffers(new[] { offer }, new string[] { }, marketSettings);

        // Assert
        result.Should().HaveCount(1);
        var mappedUnit = result.First().Accom.Unit.First();
        mappedUnit.IsRefundable.Should().BeFalse();
    }

    [Fact]
    public async Task ConvertOffers_UnitWithNRefNotSpecified_MapsIsRefundableAsNull()
    {
        // Arrange
        var offer = CreateOfferWithUnit(nRefSpecified: false, nRef: YesNo.Y);
        var marketSettings = new MarketSettings { Currency = new Currency { Code = "GBP" } };

        // Act
        var result = await _offersMapper.ConvertOffers(new[] { offer }, new string[] { }, marketSettings);

        // Assert
        result.Should().HaveCount(1);
        var mappedUnit = result.First().Accom.Unit.First();
        mappedUnit.IsRefundable.Should().BeNull();
    }

    [Fact]
    public async Task ConvertOffers_MultipleUnitsWithDifferentRefundability_MapsCorrectly()
    {
        // Arrange
        var units = new[]
        {
            new AvCacheResultOffersOfferAccomUnit
            {
                Code = "DBL1",
                Name = "Double Room 1",
                Price = 100m,
                NRefSpecified = true,
                NRef = YesNo.N,
                AtcomId = "room1"
            },
            new AvCacheResultOffersOfferAccomUnit
            {
                Code = "DBL2",
                Name = "Double Room 2",
                Price = 120m,
                NRefSpecified = true,
                NRef = YesNo.Y,
                AtcomId = "room2"
            },
            new AvCacheResultOffersOfferAccomUnit
            {
                Code = "DBL3",
                Name = "Double Room 3",
                Price = 110m,
                NRefSpecified = false,
                AtcomId = "room3"
            }
        };

        var offer = new AvCacheResultOffersOffer
        {
            Price = 300m,
            Accom = new[]
            {
                new AvCacheResultOffersOfferAccom
                {
                    Code = "HT001",
                    Id = "HT001",
                    AtcomId = "atcom_ht001",
                    Unit = units
                }
            }
        };

        var marketSettings = new MarketSettings { Currency = new Currency { Code = "GBP" } };

        // Act
        var result = await _offersMapper.ConvertOffers(new[] { offer }, new string[] { }, marketSettings);

        // Assert
        result.Should().HaveCount(1);
        var mappedUnits = result.First().Accom.Unit;
        mappedUnits.Should().HaveCount(3);

        mappedUnits[0].IsRefundable.Should().BeTrue();
        mappedUnits[1].IsRefundable.Should().BeFalse();
        mappedUnits[2].IsRefundable.Should().BeNull();
    }

    [Fact]
    public async Task ConvertOffers_UnitWithoutNRefAttribute_IsRefundableIsNull()
    {
        // Arrange
        var offer = new AvCacheResultOffersOffer
        {
            Price = 500m,
            Accom = new[]
            {
                new AvCacheResultOffersOfferAccom
                {
                    Code = "HT002",
                    Id = "HT002",
                    AtcomId = "atcom_ht002",
                    Unit = new[]
                    {
                        new AvCacheResultOffersOfferAccomUnit
                        {
                            Code = "SGL",
                            Name = "Single Room",
                            Price = 500m,
                            NRefSpecified = false,
                            AtcomId = "room_single"
                        }
                    }
                }
            }
        };

        var marketSettings = new MarketSettings { Currency = new Currency { Code = "GBP" } };

        // Act
        var result = await _offersMapper.ConvertOffers(new[] { offer }, new string[] { }, marketSettings);

        // Assert
        result.Should().HaveCount(1);
        var mappedUnit = result.First().Accom.Unit.First();
        mappedUnit.IsRefundable.Should().BeNull();
    }

    private AvCacheResultOffersOffer CreateOfferWithUnit(bool nRefSpecified, YesNo nRef)
    {
        return new AvCacheResultOffersOffer
        {
            Price = 500m,
            Accom = new[]
            {
                new AvCacheResultOffersOfferAccom
                {
                    Code = "HT001",
                    Id = "HT001",
                    AtcomId = "atcom_ht001",
                    Unit = new[]
                    {
                        new AvCacheResultOffersOfferAccomUnit
                        {
                            Code = "DBL",
                            Name = "Double Room",
                            Price = 500m,
                            NRefSpecified = nRefSpecified,
                            NRef = nRef,
                            AtcomId = "room1"
                        }
                    }
                }
            }
        };
    }
}
