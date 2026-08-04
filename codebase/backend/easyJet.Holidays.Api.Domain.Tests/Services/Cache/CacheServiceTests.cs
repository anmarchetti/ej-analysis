using AutoFixture;
using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Serialization;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using System.Globalization;
using System.Text;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Cache
{
    public class CacheServiceTests
    {
        private IFixture _fixture;
        private Mock<IDistributedCache> _cacheMock;
        private Mock<ILogger<BaseCacheService>> _loggerMock = new();
        private const string testBucket = "testBucket";
        private const string testBucket2 = "testBucket2";

        public CacheServiceTests()
        {
            // Arrange
            _fixture = FixtureUtils.AutoMoqFixture();
            _fixture.Register(() => Options.Create(new CacheSettings
            {
                ExpirationSeconds = new Dictionary<string, int>() {
                    { "Bucketname", 600 },
                    { "BucketnameTwo", 600 },
                }
            }));


            _fixture.Register<ISerializationService>(() => new JsonSerializationService());

            _cacheMock = _fixture.Freeze<Mock<IDistributedCache>>();
        }

        [Fact]
        public void GetCacheKey_Data_BuildKeyString()
        {
            // Arrange
            var sut = _fixture.Freeze<CacheService>();

            // Act
            var actual = sut.GetCacheKey("bucket", new[] { "first", null, "second" });

            // Assert
            actual.Should().Be("_bucket_first_second");
        }

        [Fact]
        public void GetCacheKey_NullKeys_ThrowException()
        {
            // Arrange
            var sut = _fixture.Freeze<CacheService>();

            // Act
            Action act = () => sut.GetCacheKey("bucket", null);

            // Assert
            act.Should().Throw<ArgumentNullException>();
        }

        [Theory]
        [InlineAutoData("Null bucket", null)]
        [InlineAutoData("Empty bucket", "")]
        [InlineAutoData("Space bucket", "  ")]
        public void GetCacheKey_NullCacheBucket_ThrowException(string because, string cacheBucket)
        {
            // Arrange
            var sut = _fixture.Freeze<CacheService>();

            // Act
            Action act = () => sut.GetCacheKey(cacheBucket, new[] { "first" });

            // Assert
            act.Should().Throw<ArgumentNullException>(because);
        }

        [Fact]
        public async Task GetOrAddAsync_NullArguments_ThrowException()
        {
            // Arrange
            var sut = _fixture.Freeze<CacheService>();

            // Act
            Func<Task> nullBucket = () => sut.GetOrAddAsync(null, new[] { "test" }, () => Task.FromResult("data"));
            Func<Task> emptyBucket = () => sut.GetOrAddAsync("", new[] { "test" }, () => Task.FromResult("data"));
            Func<Task> nullGetData = () => sut.GetOrAddAsync<String>("bucketName", new[] { "test" }, null);
            Func<Task> nullKeys = () => sut.GetOrAddAsync<String>("bucketName", null, () => Task.FromResult("data"));
            Func<Task> emptyKeys = () => sut.GetOrAddAsync<String>("bucketName", new string[0], () => Task.FromResult("data"));

            // Assert
            await nullBucket.Should().ThrowExactlyAsync<ArgumentNullException>();
            await emptyBucket.Should().ThrowExactlyAsync<ArgumentNullException>();
            await nullGetData.Should().ThrowExactlyAsync<ArgumentNullException>();
            await nullKeys.Should().ThrowExactlyAsync<ArgumentNullException>();
            await emptyKeys.Should().ThrowExactlyAsync<ArgumentNullException>();
        }


        [Fact]
        public async Task GetOrAddAsync_EmptyCache_CallGetFromDistributedCacheTwice()
        {
            // Arrange
            var sut = _fixture.Freeze<CacheService>();

            // Act
            var actual = await sut.GetOrAddAsync("Bucketname", new[] { "test" }, () => Task.FromResult("data"));

            // Assert
            _cacheMock.Verify(x => x.GetAsync("_Bucketname_test", It.IsAny<CancellationToken>()), Times.Exactly(2));
        }

        [Fact]
        public async Task GetOrAddAsync_EmptyCacheAndGetDataReturnsNull_NotSaveInCache()
        {
            // Arrange
            var sut = _fixture.Freeze<CacheService>();

            // Act
            var actual = await sut.GetOrAddAsync("Bucketname", new[] { "test" }, () => Task.FromResult((string)null));

            // Assert
            _cacheMock.Verify(x => x.SetAsync(It.IsAny<string>(), It.IsAny<byte[]>(), It.IsAny<DistributedCacheEntryOptions>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task GetOrAddAsync_DataInCache_CallGetOnceAndSetNever()
        {
            // Arrange
            _cacheMock.Setup(x => x.GetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).Returns(() =>
            {
                var val = JsonConvert.SerializeObject("data");
                return Task.FromResult(Encoding.UTF8.GetBytes(val));
            });

            var sut = _fixture.Freeze<CacheService>();

            // Act
            var actual = await sut.GetOrAddAsync("Bucketname", new[] { "test" }, () => Task.FromResult("data"));

            // Assert
            actual.Should().Be("data");
            _cacheMock.Verify(x => x.GetAsync("_Bucketname_test", It.IsAny<CancellationToken>()), Times.Once);
            _cacheMock.Verify(x => x.SetAsync(It.IsAny<string>(), It.IsAny<byte[]>(), It.IsAny<DistributedCacheEntryOptions>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task GetOrAddAsync_ForceUpdateAndDataInCache_CallSet()
        {
            // Arrange
            _cacheMock.Setup(x => x.GetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).Returns(() =>
            {
                var val = JsonConvert.SerializeObject("data");
                return Task.FromResult(Encoding.UTF8.GetBytes(val));
            });

            var sut = _fixture.Freeze<CacheService>();

            // Act
            var actual = await sut.GetOrAddAsync("Bucketname", new[] { "test" }, () => Task.FromResult("data"), true);

            // Assert
            actual.Should().Be("data");
            _cacheMock.Verify(x => x.SetAsync(It.IsAny<string>(), It.IsAny<byte[]>(), It.IsAny<DistributedCacheEntryOptions>(), It.IsAny<CancellationToken>()), Times.Once);
            _cacheMock.Verify(x => x.GetAsync("_Bucketname_test", It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task GetOrAddAsync_EmptyCache_SetValueToDistributedCacheOnce()
        {
            // Arrange
            var sut = _fixture.Freeze<CacheService>();

            // Act
            var actual = await sut.GetOrAddAsync("Bucketname", new[] { "test" }, () => Task.FromResult("data"));

            // Assert
            _cacheMock.Verify(x => x.SetAsync("_Bucketname_test", It.IsAny<byte[]>(), It.IsAny<DistributedCacheEntryOptions>(), It.IsAny<CancellationToken>()), Times.Exactly(1));
        }

        [Fact]
        public async Task GetAllValuesForBucketName_PopulatedWithDifferentValues_ShouldReturnAllValues()
        {
            // Arrange
            var cache = new MemoryCache(new MemoryCacheOptions());
            var sut = new MemoryCacheService(cache, _loggerMock.Object, Options.Create<CacheSettings>(new CacheSettings()
            {
                Buckets = new Buckets
                {
                    // does not matter, which bucket to use
                    CMSReferenceData = testBucket,
                    CmsPromotions = testBucket2
                },
                ExpirationSeconds = new Dictionary<string, int>
                {
                    {testBucket, 100},
                    {testBucket2, 100}
                }
            }));

            string exampleString = "587377E8-DE47-47C6-BC63-131A8E8062EA";
            double? exampleDouble = 3.9;
            ulong? exampleUlong = 500000000000000000;

            await sut.GetOrAddAsync(
                testBucket,
                new[] { exampleString },
                () => Task.FromResult(exampleString));

            await sut.GetOrAddAsync(
                testBucket,
                new[] { exampleDouble.Value.ToString(CultureInfo.InvariantCulture) },
                () => Task.FromResult(exampleDouble));

            await sut.GetOrAddAsync(
                testBucket2,
                new[] { exampleUlong!.Value.ToString(CultureInfo.InvariantCulture) },
                () => Task.FromResult(exampleUlong));

            // Act
            var result = await sut.GetAllValuesForBucket(testBucket);

            // Assert
            result.Count.Should().Be(2);
            result.Should().AllSatisfy(x => x.Key.Should().StartWith($"_{testBucket}_"));
            result.Should().Contain(x => x.Value is string && (string)x.Value == exampleString);
            result.Should().Contain(x => x.Value is double && (double)x.Value == exampleDouble);
            result.Should().NotContain(x => x.Key == $"_{testBucket2}_{exampleUlong}");
        }

        [Fact]
        public async Task Add_NullArguments_ThrowException()
        {
            // Arrange
            var sut = _fixture.Freeze<CacheService>();

            // Act
            Func<Task> nullBucket = () => sut.Add(null, "key", "data");
            Func<Task> emptyBucket = () => sut.Add("", "key", "data");
            Func<Task> nullKey = () => sut.Add("bucket", null, "data");
            Func<Task> emptyKey = () => sut.Add("bucket", "", "data");

            // Assert
            await nullBucket.Should().ThrowExactlyAsync<ArgumentNullException>();
            await emptyBucket.Should().ThrowExactlyAsync<ArgumentNullException>();
            await nullKey.Should().ThrowExactlyAsync<ArgumentNullException>();
            await emptyKey.Should().ThrowExactlyAsync<ArgumentNullException>();
        }

        [Fact]
        public async Task Add_NullOrDefaultValue_DontCache()
        {
            // Arrange
            var sut = _fixture.Freeze<CacheService>();

            // Act
            await sut.Add("Bucketname", "key", (string)null); // null
            await sut.Add("Bucketname", "key", ""); // empty string
            await sut.Add("Bucketname", "key", "   "); // whitespaces string
            await sut.Add("Bucketname", "key", new string[0]); // empty collection

            // Assert
            _cacheMock.Verify(x => x.SetAsync(It.IsAny<string>(), It.IsAny<byte[]>(), It.IsAny<DistributedCacheEntryOptions>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task Add_BucketNotConfigured_DontCache()
        {
            // Arrange
            _fixture.Register(() => Options.Create(new CacheSettings
            {
                ExpirationSeconds = new Dictionary<string, int>() {
                    { "EmptyBucket", 0 },
                }
            }));
            var sut = _fixture.Freeze<CacheService>();

            // Act
            await sut.Add("NotValidBucketname", "key", "data"); // bucket doesn't exist
            await sut.Add("EmptyBucket", "key", "data"); // Null expiration

            // Assert
            _cacheMock.Verify(x => x.SetAsync(It.IsAny<string>(), It.IsAny<byte[]>(), It.IsAny<DistributedCacheEntryOptions>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task Add_ValidData_SaveInCacheWithKeyAndExpiration()
        {
            // Arrange
            _fixture.Register(() => Options.Create(new CacheSettings
            {
                ExpirationSeconds = new Dictionary<string, int>() {
                    { "Bucketname", 12 },
                }
            }));
            var sut = _fixture.Freeze<CacheService>();

            // Act
            await sut.Add("Bucketname", "key", "data"); // bucket doesn't exist

            // Assert
            _cacheMock.Verify(x => x.SetAsync(
                "key",
                It.IsAny<byte[]>(),
                It.Is<DistributedCacheEntryOptions>(o => o.AbsoluteExpirationRelativeToNow == TimeSpan.FromSeconds(12)),
                It.IsAny<CancellationToken>()),
                Times.Once
            );
        }

        [Fact]
        public async Task Get_NullOrWhiteSpaceKey_ThrowException()
        {
            // Arrange
            var sut = _fixture.Freeze<CacheService>();

            // Act
            Func<Task> nullKey = () => sut.Get<string>(null);
            Func<Task> emptyKey = () => sut.Get<string>("");
            Func<Task> whitespaceKey = () => sut.Get<string>("   ");

            // Assert
            await nullKey.Should().ThrowExactlyAsync<ArgumentNullException>();
            await emptyKey.Should().ThrowExactlyAsync<ArgumentNullException>();
            await whitespaceKey.Should().ThrowExactlyAsync<ArgumentNullException>();
        }

        [Fact]
        public async Task Get_NullOrEmptyDataInCache_DonotDeserialize()
        {
            // Arrange
            _cacheMock.Setup(x => x.GetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).Returns((string key, CancellationToken token) =>
            {
                if (key == "null")
                {
                    return Task.FromResult((byte[])null);
                }

                return Task.FromResult(new byte[0]);
            });

            var sut = _fixture.Freeze<CacheService>();
            var serializeMock = _fixture.Freeze<Mock<ISerializationService>>();

            // Act
            await sut.Get<string>("null");
            await sut.Get<string>("empty");

            // Assert
            serializeMock.Verify(x => x.Deserialize<string>(It.IsAny<byte[]>()), Times.Never);
        }

        [Fact]
        public async Task Get_DataInCache_ReturnData()
        {
            // Arrange
            _cacheMock.Setup(x => x.GetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).Returns((string key, CancellationToken token) =>
            {
                var val = JsonConvert.SerializeObject("result data");
                return Task.FromResult(Encoding.UTF8.GetBytes(val));
            });

            var sut = _fixture.Freeze<CacheService>();

            // Act
            var actual = await sut.Get<string>("key");

            // Assert
            actual.Should().Be("result data");
        }

        [Fact]
        public async Task RemoveAsync_EmptyBucketName_ThrowException()
        {
            // Arrange
            var sut = _fixture.Freeze<CacheService>();

            // Act
            Func<Task> nullKey = () => sut.RemoveAsync(null);
            Func<Task> emptyKey = () => sut.RemoveAsync("");
            Func<Task> whitespaceKey = () => sut.RemoveAsync("  ");

            // Assert
            await nullKey.Should().ThrowExactlyAsync<ArgumentNullException>();
            await emptyKey.Should().ThrowExactlyAsync<ArgumentNullException>();
            await whitespaceKey.Should().ThrowExactlyAsync<ArgumentNullException>();
        }

        [Fact]
        public async Task RemoveAllAsync_TwoItemsInCache_RemoveFromCacheTwice()
        {
            // Arrange
            var sut = _fixture.Freeze<CacheService>();

            await sut.Add("Bucketname", "first", "first data");
            await sut.Add("Bucketname", "second", "first data");

            // Act
            await sut.RemoveAllAsync();

            // Assert
            _cacheMock.Verify(x => x.RemoveAsync("first", It.IsAny<CancellationToken>()), Times.Once);
            _cacheMock.Verify(x => x.RemoveAsync("second", It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task RemoveAsync_TwoItemsInCacheWithDifferentBuckets_RemoveFromCacheOnce()
        {
            // Arrange
            var sut = _fixture.Freeze<CacheService>();

            await sut.GetOrAddAsync("Bucketname", new[] { "first" }, () => Task.FromResult("first data"));
            await sut.GetOrAddAsync("BucketnameTwo", new[] { "second" }, () => Task.FromResult("second data"));
            //await sut.Add("BucketnameTwo", "second", "first data");

            // Act
            await sut.RemoveAsync("Bucketname");

            // Assert
            _cacheMock.Verify(x => x.RemoveAsync("_Bucketname_first", It.IsAny<CancellationToken>()), Times.Once);
            _cacheMock.Verify(x => x.RemoveAsync("_Bucketname_second", It.IsAny<CancellationToken>()), Times.Never);
        }

        #region RemoveAsyncByKeys
        [Fact]
        public async Task RemoveAsync_ByKeys_RemoveFromCacheOnce()
        {
            // Arrange
            var sut = _fixture.Freeze<CacheService>();

            await sut.GetOrAddAsync("Bucketname", new[] { "first", "second" }, () => Task.FromResult("first data"));
            await sut.GetOrAddAsync("BucketnameTwo", new[] { "second" }, () => Task.FromResult("second data"));

            // Act
            await sut.RemoveAsync("Bucketname", new[] { "first" });

            // Assert
            _cacheMock.Verify(x => x.RemoveAsync("_Bucketname_first", It.IsAny<CancellationToken>()), Times.Once);
            _cacheMock.Verify(x => x.RemoveAsync("_Bucketname_second", It.IsAny<CancellationToken>()), Times.Never);
            _cacheMock.Verify(x => x.RemoveAsync("_BucketnameTwo_second", It.IsAny<CancellationToken>()), Times.Never);
        }
        #endregion
    }
}
