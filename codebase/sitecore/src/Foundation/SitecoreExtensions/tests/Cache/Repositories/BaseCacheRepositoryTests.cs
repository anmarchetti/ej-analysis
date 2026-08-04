using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Cache.Repositories
{
    public class BaseCacheRepositoryTests
    {
        private readonly BaseCacheRepository baseCacheRepository;

        public BaseCacheRepositoryTests()
        {
            baseCacheRepository = Substitute.ForPartsOf<BaseCacheRepository>();
        }

        [Theory]
        [AutoData]
        public void Create_ShouldStoreItem(string name, List<string> value)
        {
            // Act
            var actual = baseCacheRepository.Create(name, value);

            // Assert
            actual.Should().BeOfType(typeof(List<string>));
            baseCacheRepository.Received().StoreItem(Arg.Any<string>(), Arg.Any<List<string>>(), Arg.Any<int>());
            actual.Should().BeEquivalentTo(value);
        }

        [Theory]
        [AutoData]
        public void GetOrCreateWithArgs_ShouldGetItem_IfGetItemHasValueByKey(List<string> value, string[] args, string key)
        {
            // Arrange
            baseCacheRepository.GetItem<List<string>>(Arg.Any<string>()).Returns(value);

            // Act
            var actual = baseCacheRepository.GetOrCreate((arguments) => value, args, key);

            // Assert
            actual.Should().BeOfType(typeof(List<string>));
            baseCacheRepository.DidNotReceive().StoreItem(Arg.Any<string>(), Arg.Any<List<string>>(), Arg.Any<int>());
        }

        [Theory]
        [AutoData]
        public void GetOrCreateWithArgs_ShouldCreateItem_IfGetItemReturnNull(List<string> value, string[] args, string key)
        {
            // Arrange
            List<string> list = null;

            baseCacheRepository.GetItem<List<string>>(Arg.Any<string>()).Returns(list);

            // Act
            var actual = baseCacheRepository.GetOrCreate((arguments) => value, args, key);

            // Assert
            baseCacheRepository.Received().StoreItem(Arg.Any<string>(), Arg.Any<List<string>>(), Arg.Any<int>());
            actual.Should().BeEquivalentTo(value);
        }

        [Theory]
        [AutoData]
        public void GetOrCreate_ShouldGetItem_IfGetItemHasValueByKey(List<string> value, string key)
        {
            // Arrange
            baseCacheRepository.GetItem<List<string>>(Arg.Any<string>()).Returns(value);

            // Act
            var actual = baseCacheRepository.GetOrCreate(() => value, key);

            // Assert
            actual.Should().BeOfType(typeof(List<string>));
            baseCacheRepository.DidNotReceive().StoreItem(Arg.Any<string>(), Arg.Any<List<string>>(), Arg.Any<int>());
        }

        [Theory]
        [AutoData]
        public void GetOrCreate_ShouldCreateItem_IfGetItemReturnNull(List<string> value, string key)
        {
            // Arrange
            List<string> list = null;

            baseCacheRepository.GetItem<List<string>>(Arg.Any<string>()).Returns(list);

            // Act
            var actual = baseCacheRepository.GetOrCreate(() => value, key);

            // Assert
            baseCacheRepository.Received().StoreItem(Arg.Any<string>(), Arg.Any<List<string>>(), Arg.Any<int>());
            actual.Should().BeEquivalentTo(value);
        }

        [Theory]
        [AutoData]
        public void GetOrCreateWithProperties_ShouldGetItem_IfGetItemHasValueByKey(List<string> value, string[] args, string key)
        {
            // Arrange
            baseCacheRepository.GetItem<List<string>>(Arg.Any<string>()).Returns(value);

            string expected = "property";

            // Act
            var actual = baseCacheRepository.GetOrCreate(
                (arguments) => value,
                args,
                key,
                (result) => expected,
                (response, propety) => { });

            // Assert
            actual.Should().Be(expected);
            baseCacheRepository.DidNotReceive().StoreItem(Arg.Any<string>(), Arg.Any<List<string>>(), Arg.Any<int>());
        }

        [Theory]
        [AutoData]
        public void GetOrCreateWithProperties_ShouldCreateItem_IfGetItemReturnNull(List<string> value, string[] args, string key)
        {
            // Arrange
            List<string> list = null;

            baseCacheRepository.GetItem<List<string>>(key).Returns(list);

            string settedProperty = string.Empty;

            // Act
            var actual = baseCacheRepository.GetOrCreate(
                (arguments) => value,
                args,
                key,
                (result) => "property",
                (response, props) => { settedProperty = "fakeData"; });

            // Assert
            baseCacheRepository.Received().StoreItem(Arg.Any<string>(), Arg.Any<List<string>>(), Arg.Any<int>());
            actual.Should().BeEquivalentTo("property");
        }
    }
}
