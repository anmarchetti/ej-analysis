using easyJet.Holidays.Api.Domain.Data.DynamoDB.Poi;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Services.Poi;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using System.Globalization;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Poi
{
    public class PoiServiceTests
    {
        private static PoiService CreateSut(
            IEnumerable<PointOfInterest> repositoryItems,
            out Mock<ICacheService> cacheMock,
            out Mock<IAWSDbRepository<PointOfInterest>> repoMock,
            out Mock<ILanguageService> languageMock,
            out Mock<IReferenceDataService> referenceDataMock,
            Dictionary<string, Airport> airports = null,
            string currentLanguage = "en")
        {
            repoMock = new Mock<IAWSDbRepository<PointOfInterest>>();
            cacheMock = new Mock<ICacheService>();
            languageMock = new Mock<ILanguageService>();
            referenceDataMock = new Mock<IReferenceDataService>();

            languageMock.Setup(l => l.GetCurrentLanguage()).Returns(currentLanguage);
            languageMock.Setup(l => l.GetDefaultLanguage()).Returns("en");

            repoMock.Setup(r => r.GetAsync(It.IsAny<object>()))
                .ReturnsAsync(repositoryItems);

            var cacheStore = new Dictionary<string, IEnumerable<PointOfInterest>>();
            cacheMock.Setup(c => c.GetOrAddAsync(
                    It.IsAny<string>(),
                    It.IsAny<ICollection<string>>(),
                    It.IsAny<Func<Task<IEnumerable<PointOfInterest>>>>(),
                    It.IsAny<bool>()))
                .Returns(async (string bucket, ICollection<string> keys, Func<Task<IEnumerable<PointOfInterest>>> factory, bool _) =>
                {
                    var key = string.Join('|', keys);
                    if (!cacheStore.TryGetValue(key, out var val))
                    {
                        val = await factory();
                        cacheStore[key] = val;
                    }
                    return val;
                });

            airports ??= new Dictionary<string, Airport>();
            referenceDataMock.Setup(r => r.GetAirports()).ReturnsAsync(airports);

            var settings = Options.Create(new CacheSettings
            {
                Buckets = new Buckets { PointsOfInterest = "PoiBucket" }
            });

            return new PoiService(repoMock.Object, cacheMock.Object, settings, languageMock.Object, referenceDataMock.Object);
        }

        private static PointOfInterest Poi(string category, string name, double lat = 10, double lon = 20, int visits = 0, bool adultsOnly = false, bool includePosition = true, string primaryCategoryId = "other", string altLanguage = null, string altName = null, bool hidden = false)
        {
            // PoiService expects Position[0] = longitude, Position[1] = latitude when computing distance.
            var title = new Dictionary<string, string> { { "en", name } };
            if (!string.IsNullOrWhiteSpace(altLanguage) && !string.IsNullOrWhiteSpace(altName))
            {
                title[altLanguage] = altName;
            }
            return new PointOfInterest
            {
                ResortCode = "RES1",
                PlaceId = Guid.NewGuid().ToString(),
                Category = category,
                Title = title,
                Position = includePosition ? new List<double> { lon, lat } : new List<double> { lon },
                NumberOfVisits = visits,
                AdultsOnly = adultsOnly,
                PrimaryCategory = new Category { Id = primaryCategoryId },
                Hidden = hidden
            };
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public async Task GetPoiAsync_NoKeys_ReturnsEmpty(string keys)
        {
            // Arrange
            var items = new[] { Poi("Food", "Burger Place") };
            var sut = CreateSut(items, out var cacheMock, out _, out _, out _, null);

            // Act
            var result = await sut.GetPoiAsync("RES1", keys, null, null, null, null);

            // Assert
            result.Should().BeEmpty();
            cacheMock.Verify(c => c.GetOrAddAsync<IEnumerable<PointOfInterest>>(
                It.Is<string>(b => b == "PoiBucket"),
                It.Is<ICollection<string>>(k => k.Contains("PointsOfInterest-RES1")),
                It.IsAny<Func<Task<IEnumerable<PointOfInterest>>>>(),
                It.IsAny<bool>()), Times.Once);
        }

        [Fact]
        public async Task GetPoiAsync_GroupsItemsByCategory_IgnoresCase()
        {
            // Arrange
            var items = new []
            {
                Poi("Food", "Burger Place", visits: 5, adultsOnly: true),
                Poi("Food", "Pizza Corner", visits: 10, adultsOnly: false),
                Poi("Museum", "History Museum", visits: 2)
            };
            var sut = CreateSut(items, out _, out _, out _, out _, null);

            // Act (use lower-case to validate case-insensitive matching) - provide coordinates so distance filter allows items
            var result = (await sut.GetPoiAsync("RES1", "food,museum", 10, 20, null, null)).ToList();

            // Assert
            result.Should().HaveCount(2);
            var categories = result.Select(r => r.Category.ToUpperInvariant()).ToList();
            categories.Should().HaveCount(2);
            categories.Should().Contain("FOOD").And.Contain("MUSEUM");
            result.SelectMany(r => r.Items).Should().NotBeEmpty();
        }

        [Fact]
        public async Task GetPoiAsync_WithCoordinates_ComputesDistance()
        {
            // Arrange - distance expected ~0 when lat/lon match
            var items = new[] { Poi("Food", "Cafe", lat: 50.0, lon: 1.0) };
            var sut = CreateSut(items, out _, out _, out _, out _, null);

            // Act
            var result = (await sut.GetPoiAsync("RES1", "Food", 50.0, 1.0, null, null)).Single();
            var item = result.Items.Single();

            // Assert
            item.Distance.Should().NotBeNullOrEmpty();
            double.Parse(item.Distance, CultureInfo.InvariantCulture).Should().BeApproximately(0d, 0.1);
        }

        [Fact]
        public async Task GetPoiAsync_NoCoordinates_ReturnsEmptyCategoryItems()
        {
            // Arrange - without coordinates service now filters out items (distance null)
            var items = new[] { Poi("Food", "Cafe") };
            var sut = CreateSut(items, out _, out _, out _, out _, null);

            // Act
            var result = (await sut.GetPoiAsync("RES1", "Food", null, null, null, null));

            // Assert
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetPoiAsync_InvalidPositionList_ReturnsEmptyCategoryItems()
        {
            // Arrange - position list contains only one coordinate, GetDistance returns null causing exclusion
            var items = new[] { Poi("Food", "Cafe", includePosition: false) };
            var sut = CreateSut(items, out _, out _, out _, out _, null);

            // Act
            var result = (await sut.GetPoiAsync("RES1", "Food", 10, 20, null, null));

            // Assert
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetPoiAsync_NullIsland_ReturnsEmptyCategoryItems()
        {
            // Arrange - null island coordinates excluded
            var items = new[] { Poi("Food", "Origin", lat: 0.0, lon: 0.0) };
            var sut = CreateSut(items, out _, out _, out _, out _, null);

            // Act
            var result = (await sut.GetPoiAsync("RES1", "Food", 10, 20, null, null));

            // Assert
            result.Should().BeEmpty();;
        }

        [Fact]
        public async Task GetPoiAsync_NearbyCategory_NonBeachTheme_TransportFirst_ThenOthersByPopularity()
        {
            // Arrange - coordinates (lat=2, lon=1) near subset of POIs
            var items = new []
            {
                Poi("nearby", "Museum", visits: 1, primaryCategoryId: "museum", lat: 2.01, lon: 1.01),
                Poi("nearby", "Bus Close", visits: 50, primaryCategoryId: "bus_stop", lat: 2.0003, lon: 1.0003), // within 1km
                Poi("nearby", "Train Far", visits: 40, primaryCategoryId: "train_station", lat: 10, lon: 10), // far away
                Poi("nearby", "Cafe Popular", visits: 15, primaryCategoryId: "food", lat: 2.008, lon: 1.008), // within 3km
                Poi("nearby", "Cafe Less", visits: 5, primaryCategoryId: "food", lat: 2.009, lon: 1.009), // within 3km
                Poi("Other", "Poi2", visits: 1, lat: 2.005, lon: 1.005)
            };
            var sut = CreateSut(items, out _, out _, out _, out _, null);

            // Act
            var result = (await sut.GetPoiAsync("RES1", "nearby,other", 2, 1, null, "X")).First();
            var ordered = result.Items.Select(i => i.Name).ToList();

            // Assert
            // First should be the single closest transport within 1km
            ordered.First().Should().Be("Bus Close");
            // Remaining should be non-transport ordered by NumberOfVisits descending (popularity)
            ordered.Should().ContainInOrder("Cafe Popular", "Cafe Less");
        }

        [Fact]
        public async Task GetPoiAsync_NearbyCategory_BeachTheme_TransportFirst_ThenBeach_WhenNearby()
        {
            // Arrange - with coordinates provided, transport is added first, then nearest beach within 5km, then others by popularity
            var items = new[]
            {
                Poi("nearby", "Beach", visits: 5, primaryCategoryId: "beach", lat: 2.001, lon: 1.001),
                Poi("nearby", "Bus", visits: 4, primaryCategoryId: "bus_stop", lat: 2.0005, lon: 1.0005),
                Poi("nearby", "Other", visits: 10, primaryCategoryId: "other", lat: 2.005, lon: 1.005),
                Poi("Other", "Poi2", visits: 1, lat: 2.005, lon: 1.005)
            };
            var sut = CreateSut(items, out _, out _, out _, out _, null);

            // Act
            var result = (await sut.GetPoiAsync("RES1", "nearby,other", 2, 1, null, "B")).First();
            var ordered = result.Items.Select(i => i.Name).ToList();
            
            // Assert
            // Transport first, then beach, then other by popularity
            ordered.Should().ContainInOrder("Bus", "Beach", "Other");
        }

        [Fact]
        public async Task GetPoiAsync_AirportInsertedAtBeginning()
        {
            // Arrange - ensure airport is inserted at beginning if nearby
            var items = new[]
            {
                Poi("nearby", "Poi1", visits: 1, lat: 2.005, lon: 1.005),
                Poi("other", "Poi2", visits: 1, lat: 2.005, lon: 1.005)
            };
            var airports = new Dictionary<string, Airport>
            {
                { "LTN", new Airport { Code = "LTN", Latitude = 51.0, Longitude = -0.3 } }
            };            
            var sut = CreateSut(items, out _, out _, out _, out _, airports);

            // Act
            var result = (await sut.GetPoiAsync("RES1", "nearby,other", 2, 1, "LTN", null)).First();

            // Assert
            result.Items.First().CategoryName.Should().Be("Airport");
        }

        [Fact]
        public async Task GetPoiAsync_NoAirportInsertion_WhenNotFound()
        {
            // Arrange - ensure no insertion if airport code not found
            var items = new[]
            {
                Poi("nearby", "Poi1", visits: 1, lat: 2.005, lon: 1.005),
                Poi("Other", "Poi2", visits: 1, lat: 2.005, lon: 1.005)
            };
            var sut = CreateSut(items, out _, out _, out _, out _, null);

            // Act
            var result = (await sut.GetPoiAsync("RES1", "nearby,other", 2, 1, "XXX", null)).First();
            var ordered = result.Items.Select(i => i.Name).ToList();

            // Assert
            // POIs should be ordered by visits ascending, no airport added
            ordered.Should().ContainSingle(e => e == "Poi1");
        }

        [Fact]
        public async Task GetPoiAsync_FiltersOutHiddenPois()
        {
            // Arrange - one hidden, one visible
            var items = new[]
            {
                Poi("Food", "Visible", visits: 1, hidden: false),
                Poi("Food", "Hidden", visits: 2, hidden: true)
            };
            var sut = CreateSut(items, out _, out _, out _, out _, null);

            // Act (coordinates provided to include visible item)
            var result = (await sut.GetPoiAsync("RES1", "Food", 10, 20, null, null)).Single();

            // Assert
            result.Items.Select(i => i.Name).Should().ContainSingle("Visible");
        }

        [Fact]
        public async Task GetPoiAsync_AdultsOnlyFlag_Preserved()
        {
            // Arrange - adults-only flag should be preserved in the result
            var items = new[] { Poi("Food", "Adults", visits: 1, adultsOnly: true) };
            var sut = CreateSut(items, out _, out _, out _, out _, null);

            // Act
            var result = (await sut.GetPoiAsync("RES1", "Food", 10, 20, null, null)).Single();
            result.Items.Single().AdultsOnly.Should().BeTrue();
        }

        [Fact]
        public async Task GetPoiAsync_UsesCurrentLanguage_WhenAvailable()
        {
            // Arrange - Add FR titles and set current language to fr
            var items = new[] { Poi("Food", "English Name", visits: 1, altLanguage: "fr", altName: "Francais") };
            var sut = CreateSut(items, out _, out _, out var languageMock, out _, null, currentLanguage: "fr");

            // Act
            var result = (await sut.GetPoiAsync("RES1", "Food", 10, 20, null, null)).Single();
            var item = result.Items.Single();

            // Assert
            item.Name.Should().Be("Francais");
            languageMock.Verify(l => l.GetCurrentLanguage(), Times.AtLeastOnce);
        }

        [Fact]
        public async Task GetPoiAsync_FallsBackToEnglish_WhenLanguageMissing()
        {
            // Arrange - No ES title present even though current language is es
            var items = new[] { Poi("Food", "English Name", visits: 1, altLanguage: "fr", altName: "Francais") };
            var sut = CreateSut(items, out _, out _, out var languageMock, out _, null, currentLanguage: "es");

            // Act
            var result = (await sut.GetPoiAsync("RES1", "Food", 10, 20, null, null)).Single();
            var item = result.Items.Single();

            // Assert - should fall back to English
            item.Name.Should().Be("English Name");
            languageMock.Verify(l => l.GetCurrentLanguage(), Times.AtLeastOnce);
        }

        [Fact]
        public async Task GetPoiAsync_CacheEnsuresSingleRepositoryCall()
        {
            // Arrange - ensure repository called only once despite multiple requests
            var items = new[] { Poi("Food", "One", visits: 1) };
            var sut = CreateSut(items, out var cacheMock, out var repoMock, out _, out _, null);

            // Act
            var first = await sut.GetPoiAsync("RES1", "Food", 10, 20, null, null);
            var second = await sut.GetPoiAsync("RES1", "Food", 10, 20, null, null);

            // Assert
            first.Should().NotBeEmpty();
            second.Should().NotBeEmpty();
            repoMock.Verify(r => r.GetAsync(It.IsAny<object>()), Times.Once); // first call loads from repository via cache factory
            cacheMock.Verify(c => c.GetOrAddAsync<IEnumerable<PointOfInterest>>(It.IsAny<string>(), It.IsAny<ICollection<string>>(), It.IsAny<Func<Task<IEnumerable<PointOfInterest>>>>(), It.IsAny<bool>()), Times.Exactly(2));
        }

        [Fact]
        public async Task GetPoiAsync_ReturnsEmpty_WhenNoPois()
        {
            // Arrange - No items, but airport
            PointOfInterest[] items = [];
            var airports = new Dictionary<string, Airport>
            {
                { "LTN", new Airport { Code = "LTN", Latitude = 51.0, Longitude = -0.3 } }
            };            
            var sut = CreateSut(items, out _, out _, out _, out _, airports);

            // Act
            var result = await sut.GetPoiAsync("RES1", "Food", null, null, null, null);

            // Assert
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetPoiAsync_ReturnsResults_WhenMoreThanOneTotalItem()
        {
            // Arrange - total items > 1 should return the categories and items
            var items = new[]
            {
                Poi("Food", "One", visits: 10),
                Poi("Food", "Two", visits: 5)
            };
            var sut = CreateSut(items, out _, out _, out _, out _, null);

            // Act
            var result = (await sut.GetPoiAsync("RES1", "Food", 10, 20, null, null)).ToList();

            // Assert
            result.Should().HaveCount(1);
            result.Single().Items.Should().HaveCount(2);
            var names = result.Single().Items.Select(i => i.Name);
            names.Should().Contain("One");
            names.Should().Contain("Two");
        }
        
        [Fact]
        public async Task ReturnsEmptyList_WhenAllCategoriesAreNearby()
        {
            // Arrange
            var items = new[]
            {
                Poi("Nearby", "One", visits: 10),
            };
            var sut = CreateSut(items, out _, out _, out _, out _, null);
        
            // Act
            var result = (await sut.GetPoiAsync("RES1", "Nearby", 10, 20, null, null)).ToList();
        
            // Assert
            Assert.Empty(result);
        }
    }
}
