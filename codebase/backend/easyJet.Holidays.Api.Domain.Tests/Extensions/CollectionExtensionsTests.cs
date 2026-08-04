using easyJet.Holidays.Api.Domain.Extensions;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Extensions
{
    public class CollectionExtensionsTests
    {
        [Fact]
        public void Split_Empty_ReturnsEmpty()
        {
            // Arrange
            var list = new List<int>();

            // Act
            var result = list.Split(2);

            // Assert
            result.Should().BeEquivalentTo(new List<int>());
        }

        [Fact]
        public void Split_CountLessThanChunkSize_ReturnsSingleChunk()
        {
            // Arrange
            var list = new List<int> { 1, 2 };

            // Act
            var result = list.Split(3);

            // Assert
            result.Should().BeEquivalentTo(new List<List<int>> { new List<int> { 1, 2 } });
        }

        [Fact]
        public void Split_CountMoreThanChunkSize_ReturnsMultipleChunks()
        {
            // Arrange
            var list = new List<int> { 1, 2, 3, 4, 5, 6, 7 };

            // Act
            var result = list.Split(3);

            // Assert
            result.Should().BeEquivalentTo(new List<List<int>> { new List<int> { 1, 2, 3 }, new List<int> { 4, 5, 6 }, new List<int> { 7 } });
        }

        [Fact]
        public void Split_CountEvenToChunkSize_ReturnsMultipleChunks()
        {
            // Arrange
            var list = new List<int> { 1, 2, 3, 4 };

            // Act
            var result = list.Split(2);

            // Assert
            result.Should().BeEquivalentTo(new List<List<int>> { new List<int> { 1, 2 }, new List<int> { 3, 4, } });
        }

        [Fact]
        public void Split_CountIsZero_ThrowsDivideByZero()
        {
            // Arrange
            var list = new List<int> { 1, 2, 3, 4 };

            // Act
            var result = Record.Exception(
                () =>
                {
                    var split = list.Split(0);
                    foreach (var chunk in split) { }
                }
            );

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<DivideByZeroException>();
        }

        [Fact]
        public void IsNullOrEmpty_NotNullOrEmpty_CorrectResults()
        {
            // Arrange
            var listInt = new List<int> { 1, 2, 3, 4 };
            var listString = new List<string> { "Test1", "Test2", "Test3", "Test4" };

            // Act
            var resultIntList = listInt.IsNullOrEmpty();
            var resultStringList = listString.IsNullOrEmpty();

            // Assert
            resultIntList.Should().BeFalse();
            resultStringList.Should().BeFalse();
        }

        [Fact]
        public void IsNullOrEmpty_NullOrEmpty_CorrectResults()
        {
            // Arrange
            var emptyCollection = new List<int>();
            IEnumerable<string> nullCollection = null;

            // Act
            var resultEmptyCollection = emptyCollection.IsNullOrEmpty();
            var resultNullCollection = nullCollection.IsNullOrEmpty();

            // Assert
            resultEmptyCollection.Should().BeTrue();
            resultNullCollection.Should().BeTrue();
        }
    }
}
