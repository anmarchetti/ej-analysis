using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Services.DiscountedOffer;
using easyJet.Holidays.External.AWS.Services.DiscountedOffers;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.HbgHotelDiscountsService;

public class HbgHotelDiscountsRepositoryTests
{
    private static HbgHotelDiscountsRepository BuildSut(Mock<IDynamoDBContext> dynamoMock, Mock<ICacheService> cacheMock, AwsSettings awsSettings = null, CacheSettings cacheSettings = null)
    {
        awsSettings ??= new AwsSettings
        {
            Storage = new AwsSettingsStorage
            {
                Tables = new AwsSettingsStorageTables
                {
                    OfferDiscount = "OfferDiscountTable"
                }
            }
        };
        cacheSettings ??= new CacheSettings
        {
            Buckets = new Buckets
            {
                OfferDiscount = "OfferDiscountBucket"
            }
        };

        var sut = new HbgHotelDiscountsRepository(
        dynamoMock.Object,
        Mock.Of<ILogger<HbgHotelDiscountsRepository>>(),
        Options.Create(awsSettings),
        cacheMock.Object,
        Options.Create(cacheSettings));
        return sut;
    }

    /// <summary>
    /// Helper test async search allowing us to control paging.
    /// </summary>
    private class TestAsyncSearch<T> : AsyncSearch<T>
    {
        private readonly Queue<List<T>> _pages;
        public override bool IsDone => _pages.Count == 0;
        public TestAsyncSearch(IEnumerable<List<T>> pages)
        {
            _pages = new Queue<List<T>>(pages);
        }
        public override Task<List<T>> GetNextSetAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult(_pages.Dequeue());
        }
    }

    [Fact]
    public async Task GetAll_ReturnsItems_FromSinglePage()
    {
        // Arrange
        var pageItems = new List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>
        {
            new Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount
            {
                AccommodationCode = "A1",
                Discounts = new List<Api.Domain.Data.DynamoDB.DiscountedOffer.Discount>
                {
                    new Api.Domain.Data.DynamoDB.DiscountedOffer.Discount
                    {
                        DiscountPercentage = 10,
                        TravelWindowFrom = "2024-01-01",
                        TravelWindowTo = "2024-01-02",
                        GiataCode = 0,
                        AccommodationName = string.Empty
                    }
                }
            },
            new Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount
            {
                AccommodationCode = "A2",
                Discounts = new List<Api.Domain.Data.DynamoDB.DiscountedOffer.Discount>
                {
                    new Api.Domain.Data.DynamoDB.DiscountedOffer.Discount
                    {
                        DiscountPercentage = 15,
                        TravelWindowFrom = "2024-01-03",
                        TravelWindowTo = "2024-01-04",
                        GiataCode = 0,
                        AccommodationName = string.Empty
                    }
                }
            }
        };
        var asyncSearch = new TestAsyncSearch<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>(new List<List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>> { pageItems });

        var dynamo = new Mock<IDynamoDBContext>();
        dynamo
        .Setup(d => d.FromScanAsync<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>(It.IsAny<ScanOperationConfig>(), It.IsAny<FromScanConfig>()))
        .Returns(asyncSearch);

        var cache = new Mock<ICacheService>();
        cache.Setup(c => c.GetOrAddAsync(
        It.IsAny<string>(),
        It.IsAny<ICollection<string>>(),
        It.IsAny<Func<Task<List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>>>>(),
        It.IsAny<bool>()))
        .Returns<string, ICollection<string>, Func<Task<List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>>>, bool>(async (b, k, f, fu) => await f());

        var sut = BuildSut(dynamo, cache);

        // Act
        var result = await sut.GetAll();

        // Assert
        result.Should().HaveCount(2);
        result.Select(x => x.AccommodationCode).Should().BeEquivalentTo(new[] { "A1", "A2" });
    }

    [Fact]
    public async Task GetAll_ReturnsItems_FromMultiplePages()
    {
        // Arrange
        var page1 = new List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>
        {
            new Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount
            {
                AccommodationCode = "A1",
                Discounts = new List<Api.Domain.Data.DynamoDB.DiscountedOffer.Discount>
                {
                    new Api.Domain.Data.DynamoDB.DiscountedOffer.Discount
                    {
                        DiscountPercentage = 5,
                        TravelWindowFrom = "2024-01-01",
                        TravelWindowTo = "2024-01-02",
                        GiataCode = 0,
                        AccommodationName = string.Empty
                    }
                }
            }
        };
        var page2 = new List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>
        {
            new Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount
            {
                AccommodationCode = "A2",
                Discounts = new List<Api.Domain.Data.DynamoDB.DiscountedOffer.Discount>
                {
                    new Api.Domain.Data.DynamoDB.DiscountedOffer.Discount
                    {
                        DiscountPercentage = 7,
                        TravelWindowFrom = "2024-01-03",
                        TravelWindowTo = "2024-01-04",
                        GiataCode = 0,
                        AccommodationName = string.Empty
                    }
                }
            }
        };
        var page3 = new List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>
        {
            new Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount
            {
                AccommodationCode = "A3",
                Discounts = new List<Api.Domain.Data.DynamoDB.DiscountedOffer.Discount>
                {
                    new Api.Domain.Data.DynamoDB.DiscountedOffer.Discount
                    {
                        DiscountPercentage = 9,
                        TravelWindowFrom = "2024-01-05",
                        TravelWindowTo = "2024-01-06",
                        GiataCode = 0,
                        AccommodationName = string.Empty
                    }
                }
            }
        };
        var asyncSearch = new TestAsyncSearch<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>(new List<List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>> { page1, page2, page3 });

        var dynamo = new Mock<IDynamoDBContext>();
        dynamo
        .Setup(d => d.FromScanAsync<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>(It.IsAny<ScanOperationConfig>(), It.IsAny<FromScanConfig>()))
        .Returns(asyncSearch);

        var cache = new Mock<ICacheService>();
        cache
        .Setup(c => c.GetOrAddAsync(
        It.IsAny<string>(),
        It.IsAny<ICollection<string>>(),
        It.IsAny<Func<Task<List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>>>>(),
        It.IsAny<bool>()))
        .Returns<string, ICollection<string>, Func<Task<List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>>>, bool>(async (b, k, f, fu) => await f());

        var sut = BuildSut(dynamo, cache);

        // Act
        var result = await sut.GetAll();

        // Assert
        result.Should().HaveCount(3);
        result.Select(r => r.AccommodationCode).Should().BeEquivalentTo(new[] { "A1", "A2", "A3" });
    }

    [Fact]
    public async Task GetAll_OnException_ReturnsSingleEmptyItem()
    {
        // Arrange
        var dynamo = new Mock<IDynamoDBContext>();
        dynamo
        .Setup(d => d.FromScanAsync<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>(It.IsAny<ScanOperationConfig>(), It.IsAny<FromScanConfig>()))
        .Throws(new Exception("boom"));

        var cache = new Mock<ICacheService>();
        cache
        .Setup(c => c.GetOrAddAsync(
        It.IsAny<string>(),
        It.IsAny<ICollection<string>>(),
        It.IsAny<Func<Task<List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>>>>(),
        It.IsAny<bool>()))
        .Returns<string, ICollection<string>, Func<Task<List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>>>, bool>(async (b, k, f, fu) => await f());

        var sut = BuildSut(dynamo, cache);

        // Act
        var result = await sut.GetAll();

        // Assert
        result.Should().HaveCount(1); // returned fallback item
        result.First().AccommodationCode.Should().BeEmpty();
    }

    [Fact]
    public void Constructor_NullAwsSettings_Throws()
    {
        var dynamo = new Mock<IDynamoDBContext>();
        var cache = new Mock<ICacheService>();
        var cacheSettings = Options.Create(new CacheSettings { Buckets = new Buckets { OfferDiscount = "OfferDiscountBucket" } });

        var act = () => new HbgHotelDiscountsRepository(
        dynamo.Object,
        Mock.Of<ILogger<HbgHotelDiscountsRepository>>(),
        null!,
        cache.Object,
        cacheSettings);

        act.Should().Throw<ArgumentNullException>();
    }
}
