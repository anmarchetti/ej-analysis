using easyJet.Holidays.Api.Domain.Data.DynamoDB.Weather;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Search.Filters;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using static easyJet.Holidays.External.Atcom.Tests.AtComBuilders;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search.Filters;

public class WeatherFilterTests
{
    private readonly Mock<ICacheService> _cacheServiceMock;
    private readonly WeatherFilter _filter;
    
    private const string WeatherDataBucketName = "weather-data";

    public WeatherFilterTests()
    {
        Mock<IAWSDbRepository<RegionWeather>> weatherRepositoryMock = new();
        _cacheServiceMock = new Mock<ICacheService>();
        var cacheSettings = Options.Create(new CacheSettings
        {
            Buckets = new Buckets
            {
                WeatherData = WeatherDataBucketName
            }
        });

        _filter = new WeatherFilter(weatherRepositoryMock.Object, _cacheServiceMock.Object, cacheSettings);
    }

    [Fact]
    public async Task FilterBy_WhenNoTemperatureCriteria_ReturnsAllOffers()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", DateTime.Now, 7),
            CreateOffer("PAR", DateTime.Now, 7)
        };

        var request = new PackagesSearchRequest();

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task FilterBy_WhenTemperatureCriteria_ReturnsOnlyMatchingOffers()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            },
            new RegionWeather
            {
                Region = "PAR",
                AverageTemp = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7), // January (10°C)
            CreateOffer("PAR", new DateTime(2024, 3, 1), 7), // March (15°C)
            CreateOffer("LON", new DateTime(2024, 6, 1), 7), // June (35°C)
            CreateOffer("PAR", new DateTime(2024, 6, 1), 7)  // June (30°C)
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            EndDate = "2024-07-01",
            MinTemp = 10,
            MaxTemp = 25,
            Duration = [7]
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(o => o.Accom.First().Cty2 == "LON" && o.Date.Month == 1);
        result.Should().Contain(o => o.Accom.First().Cty2 == "PAR" && o.Date.Month == 3);
    }

    [Fact]
    public async Task FilterBy_WhenNoMatchingRegions_ReturnsEmptyList()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("PAR", DateTime.Now, 7) // Region not in weather data
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            MinTemp = 15,
            MaxTemp = 25,
            Duration = [7]
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task FilterBy_WhenRangeSearch_ReturnsMatchingOffers()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7), // January (10°C)
            CreateOffer("LON", new DateTime(2024, 6, 1), 7)  // June (35°C)
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            EndDate = "2024-06-30",
            MinTemp = 10,
            MaxTemp = 25,
            Duration = [7],
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(1);
        result.Should().Contain(o => o.Accom.First().Cty2 == "LON" && o.Date.Month == 1);
    }

    [Fact]
    public async Task FilterBy_WhenSingleMonth_ReturnsMatchingOffers()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 30, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            },
            new RegionWeather
            {
                Region = "PMI",
                AverageTemp = [30, 35, 40, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7), // January (10°C)
            CreateOffer("PMI", new DateTime(2024, 1, 1), 7),  // January (30°C)
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            MinTemp = 5,
            MaxTemp = 15,
            Duration = [7]
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(1);
        result.Should().Contain(o => o.Accom.First().Cty2 == "LON" && o.Date.Month == 1);
    }
    
    [Fact]
    public async Task FilterBy_WhenFlexibleDays_ReturnsMatchingOffers()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 30, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            },
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7), // January (10°C)
            CreateOffer("LON", new DateTime(2024, 2, 1), 7),  // February (30°C)
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-29",
            MinTemp = 5,
            MaxTemp = 15,
            Duration = [7],
            FlexibleDays = 3
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(1);
        result.Should().Contain(o => o.Accom.First().Cty2 == "LON" && o.Date.Month == 1);
    }

    [Fact]
    public async Task FilterBy_WhenCrossingYearBoundary_ReturnsMatchingOffers()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 12, 1), 7), // December (65°C)
            CreateOffer("LON", new DateTime(2025, 1, 1), 7)   // January (10°C)
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-12-01",
            EndDate = "2025-01-31",
            MinTemp = 5,
            MaxTemp = 15,
            Duration = [7],
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(1);
        result.Should().Contain(o => o.Accom.First().Cty2 == "LON" && o.Date.Month == 1);
    }

    [Fact]
    public async Task FilterBy_WhenOnlyMinTempSpecified_ReturnsMatchingOffers()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7), // January (10°C)
            CreateOffer("LON", new DateTime(2024, 6, 1), 7)  // June (35°C)
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            EndDate = "2024-07-01",
            MinTemp = 20,
            Duration = [7],
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(1);
        result.Should().Contain(o => o.Accom.First().Cty2 == "LON" && o.Date.Month == 6);
    }

    [Fact]
    public async Task FilterBy_WhenOnlyMaxTempSpecified_ReturnsMatchingOffers()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7), // January (10°C)
            CreateOffer("LON", new DateTime(2024, 6, 1), 7)  // June (35°C)
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            EndDate = "2024-07-01",
            MaxTemp = 20,
            Duration = [7],
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(1);
        result.Should().Contain(o => o.Accom.First().Cty2 == "LON" && o.Date.Month == 1);
    }

    [Fact]
    public async Task GetOptions_WhenNoOffers_ReturnsEmptyOptions()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>();
        var request = new PackagesSearchRequest();

        // Act
        var result = await _filter.GetOptions(offers, request, (o, r) => Task.FromResult(o));

        // Assert
        result.Should().BeEquivalentTo(FilterOptions.Empty);
    }

    [Fact]
    public async Task GetOptions_WhenNoWeatherData_ReturnsEmptyOptions()
    {
        // Arrange
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", DateTime.Now, 7)
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(new List<RegionWeather>());

        var request = new PackagesSearchRequest();

        // Act
        var result = await _filter.GetOptions(offers, request, (o, r) => Task.FromResult(o));

        // Assert
        result.Should().BeEquivalentTo(FilterOptions.Empty);
    }

    [Fact]
    public async Task GetOptions_WhenValidData_ReturnsCorrectOptions()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7)
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            EndDate = "2024-01-31",
            Duration = [7],
        };

        // Act
        var result = await _filter.GetOptions(offers, request, (o, r) => Task.FromResult(o));

        // Assert
        result.Options.Should().HaveCount(1);
        result.Options[0].MinTemp.Should().Be(10);
        result.Options[0].MaxTemp.Should().Be(15);
    }
    
    [Fact]
    public async Task GetOptions_WhenNoDuration_ReturnsNoOptions()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7)
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            EndDate = "2024-01-31",
        };

        // Act
        var result = await _filter.GetOptions(offers, request, (o, r) => Task.FromResult(o));

        // Assert
        result.Options.Should().HaveCount(0);
    }

    [Fact]
    public async Task FilterBy_WhenMultipleYearBoundaryCrossing_ReturnsMatchingOffers()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 12, 1), 7),  // December 2024
            CreateOffer("LON", new DateTime(2025, 6, 1), 7),   // June 2025
            CreateOffer("LON", new DateTime(2026, 1, 1), 7)    // January 2026
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-12-01",
            EndDate = "2026-01-31",
            MinTemp = 5,
            MaxTemp = 15,
            Duration = [7],
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(1);
        result.Should().Contain(o => o.Accom.First().Cty2 == "LON" && o.Date.Year == 2026);
    }

    [Fact]
    public async Task FilterBy_WhenDateTimeMinValue_ReturnsOffer()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offer = new AvCacheResultOffersOffer { Date = DateTime.MinValue, Stay = 7 };
        var accom = new AvCacheResultOffersOfferAccom { Cty2 = "LON" };
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            new(offer, new[] { new AvCacheResultOffersOfferAccomExtended(accom) })
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            EndDate = "2024-01-31",
            MinTemp = 5,
            MaxTemp = 15,
            Duration = [7],
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(1);
    }

    [Fact]
    public async Task FilterBy_WhenNoAccommodations_ReturnsEmptyList()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offer = new AvCacheResultOffersOffer { Date = new DateTime(2024, 1, 1), Stay = 7 };
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            new(offer, Array.Empty<AvCacheResultOffersOfferAccomExtended>())
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            MinTemp = 5,
            MaxTemp = 15,
            Duration = [7],
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetOptions_WhenSingleTemperature_ReturnsEmptyOptions()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7)
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            Duration = [7],
        };

        // Act
        var result = await _filter.GetOptions(offers, request, (o, r) => Task.FromResult(o));

        // Assert
        result.Should().BeEquivalentTo(FilterOptions.Empty);
    }

    [Fact]
    public async Task GetOptions_WhenNoStartDate_ReturnsEmptyOptions()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7)
        };

        var request = new PackagesSearchRequest
        {
            Duration = [7],
        };

        // Act
        var result = await _filter.GetOptions(offers, request, (o, r) => Task.FromResult(o));

        // Assert
        result.Should().BeEquivalentTo(FilterOptions.Empty);
    }
    
    [Fact]
    public async Task GetOptions_WhenNoEndDateAndSingleRegion_ReturnsEmptyOptions()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };
    
        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);
    
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7)
        };
    
        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            EndDate = null, // No end date specified
            Duration = [7],
        };
    
        // Act
        var result = await _filter.GetOptions(offers, request, (o, r) => Task.FromResult(o));
    
        // Assert
        result.Should().BeEquivalentTo(FilterOptions.Empty);
    }
    
    [Fact]
    public async Task GetOptions_WhenEmptyEndDateAndSingleRegion_ReturnsEmptyOptions()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };
    
        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);
    
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7)
        };
    
        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            EndDate = "", // Empty end date
            Duration = [7],
        };
    
        // Act
        var result = await _filter.GetOptions(offers, request, (o, r) => Task.FromResult(o));
    
        // Assert
        result.Should().BeEquivalentTo(FilterOptions.Empty);
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData(null, 20)]
    [InlineData(10, null)]
    public async Task FilterBy_WhenNullTemperatures_ReturnsAllOffers(int? minTemp, int? maxTemp)
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7)
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            MinTemp = minTemp,
            MaxTemp = maxTemp,
            Duration = [7],
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().BeEquivalentTo(offers);
    }

    [Fact]
    public async Task FilterBy_WhenStartDateIsEmpty_ReturnsAllOffers()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7)
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "",  // Empty start date
            MinTemp = 5,
            MaxTemp = 15,
            Duration = [7],
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().BeEquivalentTo(offers);
    }

    [Fact]
    public async Task FilterBy_WhenStartDateIsNull_ReturnsAllOffers()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7)
        };

        var request = new PackagesSearchRequest
        {
            StartDate = null,  // Null start date
            MinTemp = 5,
            MaxTemp = 15,
            Duration = [7],
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().BeEquivalentTo(offers);
    }
    
    [Fact]
    public async Task GetOptions_WhenEndDateHasWhitespace_ConsideredAsEmpty()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };
    
        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);
    
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7)
        };
    
        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            EndDate = "   ",  // Whitespace end date
            Duration = [7],
        };
    
        // Act
        var result = await _filter.GetOptions(offers, request, (o, r) => Task.FromResult(o));
    
        // Assert
        result.Should().BeEquivalentTo(FilterOptions.Empty);
    }

    [Fact]
    public async Task GetOptions_WhenStartDateIsEmpty_ReturnsEmptyOptions()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7)
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "",  // Empty start date
            Duration = [7],
        };

        // Act
        var result = await _filter.GetOptions(offers, request, (o, r) => Task.FromResult(o));

        // Assert
        result.Should().BeEquivalentTo(FilterOptions.Empty);
    }
    
    [Fact]
    public async Task GetOptions_WhenNoEndDateButMultipleRegions_ReturnsFilterOptions()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            },
            new RegionWeather
            {
                Region = "PAR",
                AverageTemp = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]
            }
        };
    
        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);
    
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7),
            CreateOffer("PAR", new DateTime(2024, 1, 1), 7)
        };
    
        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            EndDate = null, // No end date specified
            Duration = [7],
        };
    
        // Act
        var result = await _filter.GetOptions(offers, request, (o, r) => Task.FromResult(o));
    
        // Assert
        result.Options.Should().NotBeEmpty();
    }
    
    [Fact]
    public async Task GetOptions_WhenEndDateProvidedWithSingleRegion_ReturnsFilterOptions()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };
    
        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);
    
        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7)
        };
    
        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            EndDate = "2024-02-01", // End date provided
            Duration = [7],
        };
    
        // Act
        var result = await _filter.GetOptions(offers, request, (o, r) => Task.FromResult(o));
    
        // Assert
        result.Options.Should().NotBeEmpty();
    }

    [Fact]
    public async Task FilterBy_WhenOnlyMinTempProvided_FiltersCorrectly()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "HOT",
                AverageTemp = [25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25]
            },
            new RegionWeather
            {
                Region = "COLD",
                AverageTemp = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("HOT", new DateTime(2024, 1, 1), 7),
            CreateOffer("COLD", new DateTime(2024, 1, 1), 7)
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            MinTemp = 20,  // Only MinTemp provided
            Duration = [7],
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(1);
        result.Should().Contain(o => o.Accom.First().Cty2 == "HOT");
    }

    [Fact]
    public async Task FilterBy_WhenOnlyMaxTempProvided_FiltersCorrectly()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "HOT",
                AverageTemp = [25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25]
            },
            new RegionWeather
            {
                Region = "COLD",
                AverageTemp = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("HOT", new DateTime(2024, 1, 1), 7),
            CreateOffer("COLD", new DateTime(2024, 1, 1), 7)
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            MaxTemp = 15,  // Only MaxTemp provided
            Duration = [7],
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(1);
        result.Should().Contain(o => o.Accom.First().Cty2 == "COLD");
    }

    [Fact]
    public async Task FilterBy_WhenNoTemperatureRange_ReturnsAllOffers()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7)
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            Duration = [7],
            // Neither MinTemp nor MaxTemp provided
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().BeEquivalentTo(offers);
    }

    [Theory]
    [InlineData(15, 20, "LON")] // Temperature within range
    [InlineData(30, 35, null)]     // Temperature outside range
    [InlineData(5, 10, null)]      // Temperature below range
    [InlineData(15, null, "LON")] // Temperature within range
    [InlineData(null, 20, "LON")] // Temperature within range
    public async Task FilterBy_WithDifferentTemperatureRangesNormalSearch_FiltersCorrectly(int? minTemp, int? maxTemp, string expectedRegion)
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7)
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            MinTemp = minTemp,
            MaxTemp = maxTemp,
            Duration = [7],
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        if (expectedRegion == null)
        {
            result.Should().BeEmpty();
        }
        else
        {
            result.Should().HaveCount(1);
            result.Should().Contain(o => o.Accom.First().Cty2 == expectedRegion);
        }
    }
    
    [Theory]
    [InlineData(15, 20, "LON")] // Temperature within range
    [InlineData(30, 35, null)]     // Temperature outside range
    [InlineData(5, 10, null)]      // Temperature below range
    [InlineData(15, null, "LON")] // Temperature within range
    [InlineData(null, 20, "LON")] // Temperature within range
    public async Task FilterBy_WithDifferentTemperatureRangesPromoPageSearch_FiltersCorrectly(int? minTemp, int? maxTemp, string expectedRegion)
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18]
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 1, 1), 7),
            CreateOffer("LON", new DateTime(2024, 2, 28), 7),
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-01-01",
            EndDate = "2024-03-31",
            MinTemp = minTemp,
            MaxTemp = maxTemp,
            Duration = [7],
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        if (expectedRegion == null)
        {
            result.Should().BeEmpty();
        }
        else
        {
            result.Should().HaveCount(2);
            result.Should().Contain(o => o.Accom.First().Cty2 == expectedRegion);
        }
    }

    private static AvCacheResultOffersOfferExtended CreateOffer(string region, DateTime date, int stay)
    {
        var accom = new AvCacheResultOffersOfferAccom
        {
            Cty2 = region
        };

        var offer = new AvCacheResultOffersOffer
        {
            Date = date,
            Stay = (byte)stay
        };

        return new AvCacheResultOffersOfferExtended(offer, new[] { new AvCacheResultOffersOfferAccomExtended(accom) });
    }

    [Fact]
    public async Task FilterBy_WhenSameYearDecemberToJanuary_FiltersCorrectly()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 5] // December is 5°C
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 12, 1), 31), // December to January same year
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-12-01",
            EndDate = "2024-01-31",  // Same year but January after December
            MinTemp = 0,
            MaxTemp = 10,
            Duration = [31],
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(1);
    }

    [Fact]
    public async Task FilterBy_WhenSimpleYearBoundaryCrossing_FiltersCorrectly()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [5, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 10] // January 5°C, December 10°C
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 12, 15), 31), // Crosses from 2024 to 2025
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-12-15",
            EndDate = "2025-01-15",
            MinTemp = 0,
            MaxTemp = 15,
            Duration = [31],
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(1);
    }

    [Fact]
    public async Task FilterBy_WhenMultipleYearBoundaryCrossing_FiltersCorrectly()
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] // Temperatures for all months
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", new DateTime(2024, 12, 1), 400), // Spans multiple years
        };

        var request = new PackagesSearchRequest
        {
            StartDate = "2024-12-01",
            EndDate = "2026-01-15", // Crosses multiple years
            MinTemp = 5,
            MaxTemp = 16,
            Duration = [400],
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(1);
    }

    [Theory]
    [InlineData("2024-01-01", "2024-12-31")] // Full year
    [InlineData("2024-12-01", "2024-01-31")] // December to January same year
    [InlineData("2024-12-15", "2025-01-15")] // Simple year boundary
    [InlineData("2024-12-01", "2026-01-15")] // Multiple year crossing
    public async Task FilterBy_WithVariousDateRanges_HandlesMonthsCorrectly(string startDate, string endDate)
    {
        // Arrange
        var weatherData = new List<RegionWeather>
        {
            new RegionWeather
            {
                Region = "LON",
                AverageTemp = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10] // Same temperature all year
            }
        };

        _cacheServiceMock.Setup(x => x.GetOrAddAsync(
                WeatherDataBucketName,
                new List<string> { WeatherDataBucketName },
                It.IsAny<Func<Task<IEnumerable<RegionWeather>>>>(),
                It.IsAny<bool>()))
            .ReturnsAsync(weatherData);

        var offers = new List<AvCacheResultOffersOfferExtended>
        {
            CreateOffer("LON", DateTime.Parse(startDate), 31)
        };

        var request = new PackagesSearchRequest
        {
            StartDate = startDate,
            EndDate = endDate,
            MinTemp = 5,
            MaxTemp = 15,
            Duration = [31],
        };

        // Act
        var result = await _filter.FilterBy(offers, request);

        // Assert
        result.Should().HaveCount(1);
    }
}

internal class FilterTestData : TheoryData<IList<AvCacheResultOffersOfferExtended>, PackagesSearchRequest, List<AvCacheResultOffersOfferExtended>, string>
{
    private const string Path = @"./Mappers/Search/Filters/weatherData.json";
    public FilterTestData()
    {
        Add(new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ISSI").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "GRRH").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "EGSS").Build()[0])]),
        },
        new() { StartDate = "2025-12-01", EndDate = "2026-01-25", MinTemp = 0, MaxTemp = 5, Duration = [3] },
        new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ISSI").Build()[0])]),
        },
        Path);
        
        Add(new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ISSI").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "GRRH").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "EGSS").Build()[0])]),
        },
        new() { StartDate = "2025-06-01", EndDate = "2025-09-25", Duration = [3], MinTemp = 15},
        new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "EGSS").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "GRRH").Build()[0])]),
        },
        Path);
        
        Add(new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ISSI").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "GRRH").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "EGSS").Build()[0])]),
        },
        new() { StartDate = "2025-06-01", EndDate = "2025-09-25", Duration = [3], MaxTemp = 30 },
        new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ISSI").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "GRRH").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])]),
        },
        Path);
        
        Add(new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ISSI").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "GRRH").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "EGSS").Build()[0])]),
        },
        new() { StartDate = "2025-11-01", MinTemp = 25, MaxTemp = 33, Duration = [14] },
        new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "EGSS").Build()[0])]),
        },
        Path);
        
        Add(new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ISSI").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "GRRH").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "EGSS").Build()[0])]),
        },
        new() { StartDate = "2025-11-01", MaxTemp = 10, Duration = [4] },
        new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ISSI").Build()[0])]),
        },
        Path);
        
        Add(new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ISSI").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "GRRH").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "EGSS").Build()[0])]),
        },
        new() { StartDate = "2025-11-01", MinTemp = -2, Duration = [15] },
        new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ISSI").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "GRRH").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "EGSS").Build()[0])]),
        },
        Path);

        //start of month, with min and max temp
        Add(new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ISSI").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "GRRH").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "EGSS").Build()[0])]),
        },
        new() { StartDate = "2025-01-01", Duration = [1], MinTemp = 5, MaxTemp = 15 },
        new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "GRRH").Build()[0])]),
        },
        Path);

        //start of month, no temp
        Add(new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "EGSS").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])])
        },
        new() { StartDate = "2025-01-01", Duration = [1] },
        new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "EGSS").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])])
        },
        Path);

        Add(new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "EGSS").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])])
        },
        new() { StartDate = "2025-01-01", Duration = [65], MaxTemp = 16.6M },
        new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])]),
        },
        Path);

        //three month, min and max temp
        Add(new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ISSI").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "GRRH").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "EGSS").Build()[0])]),
        },
        new() { StartDate = "2025-01-01", Duration = [65], MinTemp = 15M, MaxTemp = 22M },
        new List<AvCacheResultOffersOfferExtended>{
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "EGSS").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "GRRH").Build()[0])]),
        },
        Path);

        Add(new List<AvCacheResultOffersOfferExtended>
            {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "EGSS").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])]),
           },
            new() { StartDate = "2025-01-25", Duration = [10], MaxTemp = 20, MinTemp = 10 },
            new List<AvCacheResultOffersOfferExtended>
            {
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])]),
            },
            Path);

        // Equal min and max temperature
        Add(new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ISSI").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "GRRH").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "EGSS").Build()[0])]),
        },
        new() { StartDate = "2025-01-01", Duration = [1], MinTemp = 15, MaxTemp = 15 },
        new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])]),
        },
        Path);

        // Min temperature higher than max temperature
        Add(new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
        },
        new() { StartDate = "2025-01-01", Duration = [1], MinTemp = 20, MaxTemp = 10 },
        new List<AvCacheResultOffersOfferExtended>(),
        Path);

        // Negative temperatures
        Add(new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])]),
        },
        new() { StartDate = "2025-01-01", Duration = [1], MinTemp = -5, MaxTemp = 0 },
        new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
        },
        Path);

        // Single day duration
        Add(new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
        },
        new() { StartDate = "2025-01-01", Duration = [1], MinTemp = 0, MaxTemp = 10 },
        new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0])]),
        },
        Path);

        // Multiple accommodations in different regions
        Add(new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [
                    new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0]),
                    new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])
                ]),
        },
        new() { StartDate = "2025-01-01", Duration = [1], MinTemp = 0, MaxTemp = 10 },
        new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [
                    new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "DEMU").Build()[0]),
                    new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "ESCC").Build()[0])
                ]),
        },
        Path);

        // No matching regions
        Add(new List<AvCacheResultOffersOfferExtended>
        {
            new AvCacheResultOffersOfferExtendedBuilder().Build(
                new AvCacheResultOffersOfferResponseBuilder().Build(),
                [new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder().WithAccommadation(cty2: "NONEXISTENT").Build()[0])]),
        },
        new() { StartDate = "2025-01-01", Duration = [1], MinTemp = 0, MaxTemp = 10 },
        new List<AvCacheResultOffersOfferExtended>(),
        Path);
    }
}

internal class GetOptionsTestData : TheoryData<IList<AvCacheResultOffersOfferExtended>, PackagesSearchRequest,
    FilterOptions, string>
{
    private const string Path = @"./Mappers/Search/Filters/weatherData.json";

    public GetOptionsTestData()
    {
        Add(new List<AvCacheResultOffersOfferExtended>
            {
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [
                        new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder()
                            .WithAccommadation(cty2: "DEMU").Build()[0])
                    ]),
            },
            new() {StartDate = "2025-06-01", EndDate = "2025-07-31", Duration = [3]},
            new FilterOptions {Options = new()},
            Path);

        //promo page search request
        Add(new List<AvCacheResultOffersOfferExtended>
            {
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [
                        new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder()
                            .WithAccommadation(cty2: "DEMU").Build()[0])
                    ]),
            },
            new() {StartDate = "2025-06-01", EndDate = "2025-07-31", Duration = [3]},
            new FilterOptions {Options = new() {new() {MinTemp = 22, MaxTemp = 24}}},
            Path);

        //no results
        Add(new List<AvCacheResultOffersOfferExtended>(),
            new() {StartDate = "2025-01-01", Duration = [3]},
            new FilterOptions {Options = new()},
            Path);

        //start of month
        Add(new List<AvCacheResultOffersOfferExtended>
            {
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [
                        new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder()
                            .WithAccommadation(cty2: "DEMU").Build()[0])
                    ]),
            },
            new() {StartDate = "2025-01-01", Duration = [3]},
            new FilterOptions {Options = new() {new() {MinTemp = 3, MaxTemp = 3}}},
            Path);

        //over two months
        Add(new List<AvCacheResultOffersOfferExtended>
            {
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [
                        new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder()
                            .WithAccommadation(cty2: "ESCC").Build()[0])
                    ]),
            },
            new() {StartDate = "2025-01-25", Duration = [15]},
            new FilterOptions {Options = new() {new() {MinTemp = 16, MaxTemp = 17}}},
            Path);

        //middle of month
        Add(new List<AvCacheResultOffersOfferExtended>
            {
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [
                        new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder()
                            .WithAccommadation(cty2: "DEMU").Build()[0])
                    ]),
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [
                        new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder()
                            .WithAccommadation(cty2: "EGSS").Build()[0])
                    ]),
            },
            new() {StartDate = "2025-03-15", Duration = [10]},
            new FilterOptions {Options = new() {new() {MinTemp = 10, MaxTemp = 25}}},
            Path);

        //whole month
        Add(new List<AvCacheResultOffersOfferExtended>
            {
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [
                        new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder()
                            .WithAccommadation(cty2: "DEMU").Build()[0])
                    ]),
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [
                        new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder()
                            .WithAccommadation(cty2: "EGSS").Build()[0])
                    ]),
            },
            new() {StartDate = "2025-11-01", Duration = [29]},
            new FilterOptions {Options = new() {new() {MinTemp = 9, MaxTemp = 27}}},
            Path);

        //end of year into new year
        Add(new List<AvCacheResultOffersOfferExtended>
            {
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [
                        new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder()
                            .WithAccommadation(cty2: "DEMU").Build()[0])
                    ]),
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [
                        new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder()
                            .WithAccommadation(cty2: "EGSS").Build()[0])
                    ]),
            },
            new() {StartDate = "2025-12-01", Duration = [33]},
            new FilterOptions {Options = new() {new() {MinTemp = 3, MaxTemp = 23}}},
            Path);

        //end of year into third month of new year
        Add(new List<AvCacheResultOffersOfferExtended>
            {
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [
                        new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder()
                            .WithAccommadation(cty2: "DEMU").Build()[0])
                    ]),
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [
                        new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder()
                            .WithAccommadation(cty2: "EGSS").Build()[0])
                    ]),
            },
            new() {StartDate = "2025-12-01", Duration = [93]},
            new FilterOptions {Options = new() {new() {MinTemp = 3, MaxTemp = 25}}},
            Path);


        //many months
        Add(new List<AvCacheResultOffersOfferExtended>
            {
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [
                        new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder()
                            .WithAccommadation(cty2: "DEMU").Build()[0])
                    ]),
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [
                        new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder()
                            .WithAccommadation(cty2: "EGSS").Build()[0])
                    ]),
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [
                        new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder()
                            .WithAccommadation(cty2: "ESCC").Build()[0])
                    ]),
            },
            new() {StartDate = "2025-07-01", Duration = [93]},
            new FilterOptions {Options = new() {new() {MinTemp = 14, MaxTemp = 37}}},
            Path);

        // Empty weather data
        Add(new List<AvCacheResultOffersOfferExtended>
            {
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [
                        new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder()
                            .WithAccommadation(cty2: "DEMU").Build()[0])
                    ]),
            },
            new() {StartDate = "2025-01-01", Duration = [1]},
            new FilterOptions {Options = new()},
            Path);

        // Single day duration
        Add(new List<AvCacheResultOffersOfferExtended>
            {
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [
                        new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder()
                            .WithAccommadation(cty2: "DEMU").Build()[0])
                    ]),
            },
            new() {StartDate = "2025-01-01", Duration = [1]},
            new FilterOptions {Options = new() {new() {MinTemp = 3, MaxTemp = 3}}},
            Path);

        // Exact one month duration
        Add(new List<AvCacheResultOffersOfferExtended>
            {
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [
                        new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder()
                            .WithAccommadation(cty2: "DEMU").Build()[0])
                    ]),
            },
            new() {StartDate = "2025-01-01", Duration = [31]},
            new FilterOptions {Options = new() {new() {MinTemp = 3, MaxTemp = 3}}},
            Path);

        // Exact one year duration
        Add(new List<AvCacheResultOffersOfferExtended>
            {
                new AvCacheResultOffersOfferExtendedBuilder().Build(
                    new AvCacheResultOffersOfferResponseBuilder().Build(),
                    [
                        new AvCacheResultOffersOfferAccomExtendedBuilder().Build(new AtcomAccommadationResponseBuilder()
                            .WithAccommadation(cty2: "DEMU").Build()[0])
                    ]),
            },
            new() {StartDate = "2025-01-01", Duration = [365]},
            new FilterOptions {Options = new() {new() {MinTemp = 3, MaxTemp = 25}}},
            Path);
    }
}