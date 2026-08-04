using AutoFixture.Xunit2;
using easyJet.Feature.ChangeTracking.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ReturnsExtensions;
using Sitecore.Data.Items;
using Xunit;

namespace easyJet.Feature.ChangeTracking.Tests.Services
{
    public class ChangeTrackingCacheServiceTests
    {
        private readonly ICustomCacheRepository customCacheRepository;
        private readonly ChangeTrackingCacheService sut;

        public ChangeTrackingCacheServiceTests()
        {
            customCacheRepository = Substitute.For<ICustomCacheRepository>();
            sut = new ChangeTrackingCacheService(customCacheRepository);
        }

        [Theory]
        [AutoData]
        public void CacheExecutedDelegateAndReturnsValue_IfCacheWasEmptyBefore(string cacheIndex, object test)
        {
            // Arrange
            customCacheRepository.GetItem<object>(Arg.Any<string>()).ReturnsNull();

            // Act
            var actual = sut.GetCachedValue(cacheIndex, () => test);

            // Assert
            customCacheRepository.Received().StoreItem(Arg.Is<string>(param => param == cacheIndex), Arg.Any<object>(), Arg.Any<int>());
            actual.Should().Be(test);
        }

        [Theory]
        [AutoData]
        public void CacheReturnCachedValue_IfCacheWasFilledBefore(string cacheIndex, object test, object wrongValue)
        {
            // Arrange
            customCacheRepository.GetItem<object>(Arg.Any<string>()).Returns(test);

            // Act
            var actual = sut.GetCachedValue(cacheIndex, () => wrongValue);

            // Assert
            customCacheRepository.DidNotReceiveWithAnyArgs().StoreItem(cacheIndex, Arg.Any<Item>(), Arg.Any<int>());
            actual.Should().Be(test);
        }
    }
}